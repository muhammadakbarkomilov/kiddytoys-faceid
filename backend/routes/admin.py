import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from config.database import get_db
from models.admin import Admin
from utils.auth import get_current_admin, hash_password
from utils.admin_helpers import (
    get_admin_by_username_async,
    get_admin_by_id_async,
    get_all_admins_async,
    create_admin_async,
    update_admin_async,
    delete_admin_async
)

router = APIRouter(prefix="/admins", tags=["Admins"])

class AdminBase(BaseModel):
    first_name: str
    last_name: str
    username: str
    phone: Optional[str] = None

class AdminCreate(AdminBase):
    password: str

class AdminUpdate(AdminBase):
    password: Optional[str] = None

class AdminResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    username: str
    phone: Optional[str] = None
    created_at: int

    class Config:
        from_attributes = True

class AdminWrapperResponse(BaseModel):
    success: bool
    data: AdminResponse

class AdminListWrapperResponse(BaseModel):
    success: bool
    data: List[AdminResponse]

class AdminMessageResponse(BaseModel):
    success: bool
    data: dict

@router.post("", response_model=AdminWrapperResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    existing = await get_admin_by_username_async(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Ushbu username bilan roʻyxatdan oʻtilgan")

    hashed_pw = hash_password(payload.password)
    admin = await create_admin_async(
        db,
        payload.first_name,
        payload.last_name,
        payload.username,
        payload.phone,
        hashed_pw
    )
    return {"success": True, "data": admin}

@router.get("", response_model=AdminListWrapperResponse)
async def get_admins(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    admins = await get_all_admins_async(db)
    return {"success": True, "data": admins}

@router.put("/{admin_id}", response_model=AdminWrapperResponse)
async def update_admin(
    admin_id: int,
    payload: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    admin = await get_admin_by_id_async(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin topilmadi")
        
    hashed_pw = hash_password(payload.password) if payload.password else None
    updated_admin = await update_admin_async(
        db,
        admin,
        payload.first_name,
        payload.last_name,
        payload.username,
        payload.phone,
        hashed_pw
    )
    return {"success": True, "data": updated_admin}

@router.delete("/{admin_id}", response_model=AdminMessageResponse)
async def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    if admin_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Oʻz profilingizni oʻchira olmaysiz")
        
    admin = await get_admin_by_id_async(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin topilmadi")
        
    await delete_admin_async(db, admin)
    return {"success": True, "data": {"message": "Admin tizimdan oʻchirildi"}}
