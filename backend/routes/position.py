import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from config.database import get_db
from models.position import Position
from models.employee import Employee
from utils.auth import get_current_admin
from utils.position_helpers import (
    get_position_by_name_async,
    get_position_by_id_async,
    get_all_positions_async,
    create_position_async,
    update_position_async,
    get_active_employees_count_by_position_async,
    delete_position_async
)

router = APIRouter(prefix="/positions", tags=["Positions"])

class PositionBase(BaseModel):
    name: str

class PositionCreate(PositionBase):
    pass

class PositionResponse(BaseModel):
    id: int
    name: str
    created_at: int
    employee_count: int = 0

    class Config:
        from_attributes = True

class PositionWrapperResponse(BaseModel):
    success: bool
    data: PositionResponse

class PositionListWrapperResponse(BaseModel):
    success: bool
    data: List[PositionResponse]

class PositionMessageResponse(BaseModel):
    success: bool
    data: dict

@router.post("", response_model=PositionWrapperResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    payload: PositionCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    existing = await get_position_by_name_async(db, payload.name)
    if existing:
        raise HTTPException(status_code=400, detail="Ushbu lavozim allaqachon mavjud")
        
    position = await create_position_async(db, payload.name)
    return {"success": True, "data": position}

@router.get("", response_model=PositionListWrapperResponse)
async def get_positions(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    positions = await get_all_positions_async(db)
    return {"success": True, "data": positions}

@router.get("/{position_id}", response_model=PositionWrapperResponse)
async def get_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    position = await get_position_by_id_async(db, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Lavozim topilmadi")
    return {"success": True, "data": position}

@router.put("/{position_id}", response_model=PositionWrapperResponse)
async def update_position(
    position_id: int,
    payload: PositionCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    position = await get_position_by_id_async(db, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Lavozim topilmadi")
        
    updated_position = await update_position_async(db, position, payload.name)
    return {"success": True, "data": updated_position}

@router.delete("/{position_id}", response_model=PositionMessageResponse)
async def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    position = await get_position_by_id_async(db, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Lavozim topilmadi")
        
    active_employees_count = await get_active_employees_count_by_position_async(db, position_id)
    if active_employees_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ushbu lavozimga faol xodimlar biriktirilgan, uni oʻchirib boʻlmaydi"
        )
        
    await delete_position_async(db, position)
    return {"success": True, "data": {"message": "Lavozim oʻchirildi"}}
