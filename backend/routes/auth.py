from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from config.database import get_db
from models.admin import Admin
from utils.auth import verify_password, create_access_token, get_current_admin
from utils.auth_helpers import get_admin_by_username_async
from utils.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])
user_router = APIRouter(prefix="/user", tags=["User"])

class LoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    username: str
    phone: Optional[str] = None
    role: str = "admin"

class LoginData(BaseModel):
    access_token: str
    token_type: str
    expiry_date: int
    admin: AdminLoginResponse

class TokenResponse(BaseModel):
    success: bool
    data: LoginData

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    username: str
    phone: Optional[str] = None
    role: str = "admin"
    created_at: int

class UserWrapperResponse(BaseModel):
    success: bool
    data: UserResponse

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, request_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    admin = await get_admin_by_username_async(db, request_data.username)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username yoki parol notoʻgʻri"
        )
    
    if not verify_password(admin.password, request_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username yoki parol notoʻgʻri"
        )
        
    access_token, expiry_date = create_access_token(data={"sub": admin.username, "role": "admin"})
    
    # Set secure HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,  # Set False for localhost testing, set True in HTTPS production
        samesite="strict"
    )
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expiry_date": expiry_date,
            "admin": {
                "id": admin.id,
                "first_name": admin.first_name,
                "last_name": admin.last_name,
                "username": admin.username,
                "phone": admin.phone,
                "role": "admin"
            }
        }
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, current_admin: Admin = Depends(get_current_admin)):
    access_token, expiry_date = create_access_token(data={"sub": current_admin.username, "role": "admin"})
    
    # Refresh secure HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="strict"
    )
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expiry_date": expiry_date,
            "admin": {
                "id": current_admin.id,
                "first_name": current_admin.first_name,
                "last_name": current_admin.last_name,
                "username": current_admin.username,
                "phone": current_admin.phone,
                "role": "admin"
            }
        }
    }

@user_router.get("/me", response_model=UserWrapperResponse)
async def get_my_profile(current_admin: Admin = Depends(get_current_admin)):
    return {
        "success": True,
        "data": {
            "id": current_admin.id,
            "first_name": current_admin.first_name,
            "last_name": current_admin.last_name,
            "username": current_admin.username,
            "phone": current_admin.phone,
            "role": "admin",
            "created_at": current_admin.created_at
        }
    }
