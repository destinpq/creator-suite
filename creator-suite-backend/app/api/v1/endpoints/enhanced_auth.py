from datetime import timedelta
from fastapi import APIRouter, Body, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
import json

from app.api.deps import get_db, get_current_user, get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token
from app.core.enhanced_security import (
    mfa_manager, session_manager, rate_limit_manager, audit_logger, security_manager
)
from app.schemas.token import Token
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel
from app.models.enhanced_auth import UserSession, MFASetting, AuditLog
from app.services.user import authenticate_user, create_user, get_user_by_email, get_user_by_username, update_user
from app.services.admin import get_admin_by_user_id


class LoginRequest(BaseModel):
    email: str
    password: str
    mfa_code: Optional[str] = None
    remember_me: bool = False


class MFASetupRequest(BaseModel):
    enable_mfa: bool
    phone_number: Optional[str] = None
    email_backup: Optional[str] = None


class MFASetupResponse(BaseModel):
    totp_secret: str
    totp_uri: str
    backup_codes: List[str]


class SessionInfo(BaseModel):
    id: int
    device_info: Dict[str, Any]
    ip_address: str
    location: Optional[Dict[str, Any]]
    last_activity: str
    is_current: bool


class UserActivityLog(BaseModel):
    id: int
    action: str
    resource: Optional[str]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    location: Optional[Dict[str, Any]]
    success: bool
    created_at: str


router = APIRouter()


@router.post("/register", response_model=User)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    request: Request,
) -> User:
    """
    Register a new user with enhanced security.
    """
    # Check rate limit for registration
    client_ip = request.client.host
    allowed, remaining = rate_limit_manager.check_rate_limit(
        f"register:{client_ip}", "ip", max_requests=5, window_seconds=3600
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
        )

    user = get_user_by_email(db, email=user_in.email)
    if user:
        audit_logger.log_activity(
            user_id=None,
            action="register_attempt",
            details={"email": user_in.email, "reason": "email_exists"},
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            error_message="Email already registered"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = get_user_by_username(db, username=user_in.username)
    if user:
        audit_logger.log_activity(
            user_id=None,
            action="register_attempt",
            details={"username": user_in.username, "reason": "username_taken"},
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            error_message="Username already taken"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    user = create_user(db, user_in)

    # Log successful registration
    audit_logger.log_activity(
        user_id=user.id,
        action="register",
        details={"email": user.email, "username": user.username},
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True
    )

    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    login_data: LoginRequest = None,
) -> Token:
    """
    Enhanced login with MFA support and session management.
    """
    if not login_data:
        # Fallback for form data
        form_data = await request.form()
        login_data = LoginRequest(
            email=form_data.get("username"),
            password=form_data.get("password")
        )

    client_ip = request.client.host
    user_agent = request.headers.get("user-agent")

    # Check rate limit for login attempts
    allowed, remaining = rate_limit_manager.check_rate_limit(
        f"login:{client_ip}", "ip", max_requests=10, window_seconds=900
    )
    if not allowed:
        audit_logger.log_activity(
            user_id=None,
            action="login_attempt",
            details={"email": login_data.email, "reason": "rate_limited"},
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            error_message="Rate limited"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    user = authenticate_user(db, email=login_data.email, password=login_data.password)
    if not user:
        audit_logger.log_activity(
            user_id=None,
            action="login_attempt",
            details={"email": login_data.email, "reason": "invalid_credentials"},
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            error_message="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if MFA is enabled
    mfa_setting = db.query(MFASetting).filter(MFASetting.user_id == user.id).first()
    if mfa_setting and mfa_setting.mfa_enabled:
        if not login_data.mfa_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="MFA code required",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify MFA code
        if mfa_setting.totp_secret:
            if not mfa_manager.verify_totp(mfa_setting.totp_secret, login_data.mfa_code):
                # Try backup codes
                if mfa_setting.backup_codes:
                    valid, remaining_codes = mfa_manager.verify_backup_code(
                        mfa_setting.backup_codes, login_data.mfa_code
                    )
                    if valid:
                        # Update backup codes
                        mfa_setting.backup_codes = mfa_manager.encrypt_backup_codes(remaining_codes)
                        db.commit()
                    else:
                        audit_logger.log_activity(
                            user_id=user.id,
                            action="login_attempt",
                            details={"reason": "invalid_mfa"},
                            ip_address=client_ip,
                            user_agent=user_agent,
                            success=False,
                            error_message="Invalid MFA code"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid MFA code",
                        )
                else:
                    audit_logger.log_activity(
                        user_id=user.id,
                        action="login_attempt",
                        details={"reason": "invalid_mfa"},
                        ip_address=client_ip,
                        user_agent=user_agent,
                        success=False,
                        error_message="Invalid MFA code"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid MFA code",
                    )

    # Check if user is an admin
    admin = get_admin_by_user_id(db, user.id)
    is_admin_user = bool(admin)

    # Create session
    device_info = {
        "ip": client_ip,
        "user_agent": user_agent,
        "browser": request.headers.get("sec-ch-ua", ""),
        "platform": request.headers.get("sec-ch-ua-platform", ""),
    }

    session_data = session_manager.create_session(
        user.id, device_info, client_ip, user_agent
    )

    # Create access token with session info
    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    if login_data.remember_me:
        token_expires = timedelta(days=30)

    access_token = create_access_token(
        user.id, expires_delta=token_expires, is_admin=is_admin_user
    )

    # Set cookie with the token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=int(token_expires.total_seconds()),
        expires=int(token_expires.total_seconds()),
        samesite="none",
        secure=True,
    )

    # Log successful login
    audit_logger.log_activity(
        user_id=user.id,
        action="login",
        details={
            "email": user.email,
            "mfa_used": bool(login_data.mfa_code),
            "remember_me": login_data.remember_me,
            "session_id": session_data.get("session_token", "")[:8] + "..."
        },
        ip_address=client_ip,
        user_agent=user_agent,
        success=True
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/mfa/setup", response_model=MFASetupResponse)
def setup_mfa(
    *,
    db: Session = Depends(get_db),
    mfa_request: MFASetupRequest,
    current_user: UserModel = Depends(get_current_active_user),
) -> MFASetupResponse:
    """
    Setup Multi-Factor Authentication for the current user.
    """
    # Get or create MFA settings
    mfa_setting = db.query(MFASetting).filter(MFASetting.user_id == current_user.id).first()
    if not mfa_setting:
        mfa_setting = MFASetting(user_id=current_user.id)
        db.add(mfa_setting)

    if mfa_request.enable_mfa:
        # Generate TOTP secret
        totp_secret = mfa_manager.generate_totp_secret()
        totp_uri = mfa_manager.generate_totp_uri(totp_secret, current_user.email)

        # Generate backup codes
        backup_codes = mfa_manager.generate_backup_codes()
        encrypted_codes = mfa_manager.encrypt_backup_codes(backup_codes)

        mfa_setting.mfa_enabled = False  # Will be enabled after verification
        mfa_setting.totp_secret = security_manager.encrypt_data(totp_secret)
        mfa_setting.backup_codes = encrypted_codes
        mfa_setting.sms_phone_number = mfa_request.phone_number
        mfa_setting.email_backup = mfa_request.email_backup

        db.commit()

        # Log MFA setup
        audit_logger.log_activity(
            user_id=current_user.id,
            action="mfa_setup",
            details={"method": "totp"},
            success=True
        )

        return MFASetupResponse(
            totp_secret=totp_secret,
            totp_uri=totp_uri,
            backup_codes=backup_codes
        )
    else:
        # Disable MFA
        mfa_setting.mfa_enabled = False
        mfa_setting.totp_secret = None
        mfa_setting.backup_codes = None
        db.commit()

        audit_logger.log_activity(
            user_id=current_user.id,
            action="mfa_disable",
            success=True
        )

        return MFASetupResponse(
            totp_secret="",
            totp_uri="",
            backup_codes=[]
        )


@router.post("/mfa/verify")
def verify_mfa_setup(
    *,
    db: Session = Depends(get_db),
    code: str = Body(..., embed=True),
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Verify MFA setup and enable it.
    """
    mfa_setting = db.query(MFASetting).filter(MFASetting.user_id == current_user.id).first()
    if not mfa_setting or not mfa_setting.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not set up",
        )

    totp_secret = security_manager.decrypt_data(mfa_setting.totp_secret)
    if not mfa_manager.verify_totp(totp_secret, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    mfa_setting.mfa_enabled = True
    db.commit()

    audit_logger.log_activity(
        user_id=current_user.id,
        action="mfa_enable",
        success=True
    )

    return {"message": "MFA enabled successfully"}


@router.get("/sessions", response_model=List[SessionInfo])
def get_user_sessions(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
) -> List[SessionInfo]:
    """
    Get all active sessions for the current user.
    """
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).all()

    session_infos = []
    for session in sessions:
        session_infos.append(SessionInfo(
            id=session.id,
            device_info=session.device_info or {},
            ip_address=session.ip_address,
            location=session.location,
            last_activity=session.last_activity.isoformat(),
            is_current=False  # Would need to check current session
        ))

    return session_infos


@router.delete("/sessions/{session_id}")
def terminate_session(
    *,
    db: Session = Depends(get_db),
    session_id: int,
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Terminate a specific session.
    """
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session.is_active = False
    db.commit()

    # Invalidate in Redis as well
    session_manager.invalidate_session(session.session_token)

    audit_logger.log_activity(
        user_id=current_user.id,
        action="session_terminate",
        resource="session",
        resource_id=session_id,
        success=True
    )

    return {"message": "Session terminated"}


@router.get("/activity", response_model=List[UserActivityLog])
def get_user_activity(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    current_user: UserModel = Depends(get_current_active_user),
) -> List[UserActivityLog]:
    """
    Get user activity logs.
    """
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    activity_logs = []
    for log in logs:
        activity_logs.append(UserActivityLog(
            id=log.id,
            action=log.action,
            resource=log.resource,
            details=log.details,
            ip_address=log.ip_address,
            location=log.location,
            success=log.success,
            created_at=log.created_at.isoformat()
        ))

    return activity_logs


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Enhanced logout that terminates the current session.
    """
    # Get current session token
    token = request.cookies.get("access_token")
    if token:
        session_manager.invalidate_session(token)

    # Clear cookies
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    response.delete_cookie(
        key="authToken",
        samesite="lax",
        secure=False,
    )

    audit_logger.log_activity(
        user_id=current_user.id,
        action="logout",
        success=True
    )

    return {"message": "Successfully logged out"}
