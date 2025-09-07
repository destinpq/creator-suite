from fastapi import Depends, HTTPException, status, Request, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.base import SecurityBase
from fastapi.security.utils import get_authorization_scheme_param
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Generator, Optional

from app.core.config import settings
from app.core.security import pwd_context
from app.db.session import SessionLocal
from app.models.user import User
from app.models.admin import Admin
from app.schemas.token import TokenPayload
from app.services.user import get_user
from app.services.admin import get_admin_by_user_id

class OAuth2PasswordBearerWithCookie(SecurityBase):
    def __init__(self, tokenUrl: str, scheme_name: str = None, auto_error: bool = True):
        self.tokenUrl = tokenUrl
        self.scheme_name = scheme_name or self.__class__.__name__
        self.auto_error = auto_error
        self.model = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": {}})

    async def __call__(self, request: Request) -> str:
        # First try to get the token from the Authorization header
        authorization = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(authorization)
        
        if authorization and scheme.lower() == "bearer":
            return param
        
        # If not found, try to get from cookies
        # Check multiple possible cookie names (backend sets 'access_token', frontend might set 'authToken')
        token = None
        
        # Priority order: access_token (backend) > authToken (frontend)
        for cookie_name in ["access_token", "authToken"]:
            token = request.cookies.get(cookie_name)
            if token:
                break
        
        if token:
            # Handle legacy cookies that might have 'Bearer ' prefix
            if token.startswith("Bearer "):
                return token[7:]
            return token
            
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

oauth2_scheme = OAuth2PasswordBearerWithCookie(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[int] = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id, is_admin=is_admin)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, user_id=token_data.sub)
    if not user:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_admin_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    admin = get_admin_by_user_id(db, current_user.id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an admin",
        )
    return current_user


def get_current_superadmin_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    admin = get_admin_by_user_id(db, current_user.id)
    if not admin or not admin.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a superadmin",
        )
    return current_user



def get_current_user_with_raw_check(
    request: Request,
    db: Session = Depends(get_db),
    raw: bool = Query(False, description="Set to true to bypass authentication and use default user ID 2")
) -> User:
    """
    Get current user from authentication, or default to user ID 2 if raw=true.
    This is used for endpoints that should conditionally bypass authentication.
    """
    if raw:
        # Bypass authentication and use default user ID 2
        default_user = get_user(db, user_id=2)
        if not default_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default user (ID: 2) not found in system"
            )
        return default_user
    
    # Normal authentication flow
    try:
        # Try to get token from request using the same logic as OAuth2PasswordBearerWithCookie
        token = None
        
        # Check Authorization header first
        authorization = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(authorization)
        
        if authorization and scheme.lower() == "bearer":
            token = param
        else:
            # Check cookies if no Authorization header
            for cookie_name in ["access_token", "authToken"]:
                cookie_token = request.cookies.get(cookie_name)
                if cookie_token:
                    # Handle legacy cookies that might have 'Bearer ' prefix
                    token = cookie_token[7:] if cookie_token.startswith("Bearer ") else cookie_token
                    break
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Validate token and get user
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id: Optional[int] = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            user = get_user(db, user_id=user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return user
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )


