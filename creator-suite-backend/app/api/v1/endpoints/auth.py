from datetime import timedelta
from fastapi import APIRouter, Body, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.token import Token
from app.schemas.user import User, UserCreate
from app.services.user import authenticate_user, create_user, get_user_by_email, get_user_by_username
from app.services.admin import get_admin_by_user_id

class LoginRequest(BaseModel):
    email: str
    password: str

router = APIRouter()


@router.post("/register", response_model=User)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> User:
    """
    Register a new user.
    
    Creates a new user account with the provided email, username, and password.
    Returns the created user information without the password.
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    user = create_user(db, user_in)
    return user


@router.options("/login")
def login_options():
    """Handle CORS preflight requests for login endpoint"""
    return {"message": "OK"}

@router.get("/login")
def login_get_debug():
    """DEBUG: Handle GET requests to see what browser is sending"""
    return {"error": "Login requires POST method", "debug": "Browser sent GET instead of POST"}

@router.post("/login", response_model=Token)
def login(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.

    Authenticates a user with email/password and returns a JWT token.
    Also sets an HTTP-only cookie with the token for web clients.

    Note: The OAuth2PasswordRequestForm uses 'username' field, but we use it for email.
    """
    # Use the username field as email (frontend sends email in username field)
    email = form_data.username
    password = form_data.password

    user = authenticate_user(db, email=email, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is an admin
    admin = get_admin_by_user_id(db, user.id)
    is_admin_user = bool(admin)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires, is_admin=is_admin_user
    )

    # Set cookie with the token (no Bearer prefix needed for cookies)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none",  # Allow cross-origin requests
        secure=True,  # Set to True for HTTPS in production
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/login-json", response_model=Token)
def login_json(
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    """
    JSON-compatible login endpoint for frontend applications.
    
    Authenticates a user with email/password from JSON body and returns a JWT token.
    Also sets an HTTP-only cookie with the token for web clients.
    """
    user = authenticate_user(db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is an admin
    admin = get_admin_by_user_id(db, user.id)
    is_admin_user = bool(admin)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires, is_admin=is_admin_user
    )
    
    # Set cookie with the token (no Bearer prefix needed for cookies)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none",  # Allow cross-origin requests
        secure=True,  # Set to True for HTTPS in production
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
def logout(response: Response) -> dict:
    """
    Logout user by clearing all authentication cookies.
    
    Clears both 'access_token' (backend) and 'authToken' (frontend) cookies
    to ensure complete logout across different token storage methods.
    """
    # Clear backend cookie
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )
    
    # Clear frontend cookie (if it exists)
    response.delete_cookie(
        key="authToken",
        samesite="lax", 
        secure=False,  # Set to True in production with HTTPS
    )
    
    return {"message": "Successfully logged out"}