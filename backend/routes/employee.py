import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from config.database import get_db
from models.employee import Employee
from models.position import Position
from utils.auth import get_current_admin
from utils.position_helpers import get_position_by_id_async
from utils.employee_helpers import (
    get_employee_by_id_async,
    get_employee_with_position_by_id_async,
    get_all_employees_with_position_async,
    create_employee_async,
    update_employee_async,
    delete_employee_async
)

router = APIRouter(prefix="/employees", tags=["Employees"])

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    birthday: Optional[int] = None # Unix timestamp in milliseconds
    gender: str
    phone: str
    adress: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    position_id: int

class PositionMini(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    birthday: Optional[int] = None
    gender: str
    phone: str
    adress: Optional[str] = None
    created_at: int
    position: Optional[PositionMini] = None

    class Config:
        from_attributes = True

class EmployeeWrapperResponse(BaseModel):
    success: bool
    data: EmployeeResponse

class EmployeeListWrapperResponse(BaseModel):
    success: bool
    data: List[EmployeeResponse]

class EmployeeMessageResponse(BaseModel):
    success: bool
    data: dict

@router.post("", response_model=EmployeeWrapperResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    # Verify position exists asynchronously
    position = await get_position_by_id_async(db, payload.position_id)
    if not position:
        raise HTTPException(status_code=400, detail="Lavozim topilmadi")

    employee = await create_employee_async(
        db,
        payload.first_name,
        payload.last_name,
        payload.birthday,
        payload.gender,
        payload.phone,
        payload.adress,
        payload.position_id
    )
    
    # Reload with joined load to fill position relationship asynchronously
    emp = await get_employee_with_position_by_id_async(db, employee.id)
    return {"success": True, "data": emp}

@router.get("", response_model=EmployeeListWrapperResponse)
async def get_employees(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    employees = await get_all_employees_with_position_async(db)
    return {"success": True, "data": employees}

@router.get("/{employee_id}", response_model=EmployeeWrapperResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    employee = await get_employee_with_position_by_id_async(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
    return {"success": True, "data": employee}

@router.put("/{employee_id}", response_model=EmployeeWrapperResponse)
async def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    employee = await get_employee_by_id_async(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
        
    # Verify position exists asynchronously
    position = await get_position_by_id_async(db, payload.position_id)
    if not position:
        raise HTTPException(status_code=400, detail="Lavozim topilmadi")

    await update_employee_async(
        db,
        employee,
        payload.first_name,
        payload.last_name,
        payload.birthday,
        payload.gender,
        payload.phone,
        payload.adress,
        payload.position_id
    )
    
    # Reload with relation asynchronously
    emp = await get_employee_with_position_by_id_async(db, employee.id)
    return {"success": True, "data": emp}

@router.delete("/{employee_id}", response_model=EmployeeMessageResponse)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    employee = await get_employee_by_id_async(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
        
    await delete_employee_async(db, employee)
    return {"success": True, "data": {"message": "Xodim oʻchirildi"}}
