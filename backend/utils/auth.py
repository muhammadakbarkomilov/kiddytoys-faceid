import asyncio
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from config.database import get_db
from models.admin import Admin
from utils.password import hash_password, verify_password
from utils.jwt import create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.auth_helpers import get_admin_by_username_async

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_token_from_header_or_cookie(request: Request) -> Optional[str]:
    # 1. Try to fetch token from cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        # Standard Bearer prefix check inside cookie
        if cookie_token.startswith("Bearer "):
            return cookie_token[7:]
        return cookie_token

    # 2. Try to fetch token from Authorization Header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]

    return None

async def get_current_admin(request: Request, db: Session = Depends(get_db)) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = get_token_from_header_or_cookie(request)
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    role: str = payload.get("role")
    if username is None or role != "admin":
        raise credentials_exception
        
    admin = await get_admin_by_username_async(db, username)
    if admin is None:
        raise credentials_exception
    return admin
