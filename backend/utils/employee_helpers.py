import asyncio
import time
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from models.employee import Employee
from models.position import Position

# Synchronous blocking database operations (nodes)
def _get_employee_by_id(db: Session, employee_id: int) -> Optional[Employee]:
    return db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()

def _get_employee_with_position_by_id(db: Session, employee_id: int) -> Optional[Employee]:
    return db.query(Employee).options(joinedload(Employee.position)).filter(
        Employee.id == employee_id,
        Employee.is_deleted == False
    ).first()

def _get_all_employees_with_position(db: Session) -> List[Employee]:
    return db.query(Employee).options(joinedload(Employee.position)).filter(Employee.is_deleted == False).all()

def _create_employee(db: Session, first_name: str, last_name: str, birthday: Optional[int], gender: str, phone: str, adress: Optional[str], position_id: int) -> Employee:
    employee = Employee(
        first_name=first_name,
        last_name=last_name,
        birthday=birthday,
        male=(gender == "male"),
        phone=phone,
        adress=adress,
        position_id=position_id
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

def _update_employee(db: Session, employee: Employee, first_name: str, last_name: str, birthday: Optional[int], gender: str, phone: str, adress: Optional[str], position_id: int) -> Employee:
    employee.first_name = first_name
    employee.last_name = last_name
    employee.birthday = birthday
    employee.male = (gender == "male")
    employee.phone = phone
    employee.adress = adress
    employee.position_id = position_id
    db.commit()
    db.refresh(employee)
    return employee

def _delete_employee(db: Session, employee: Employee):
    employee.is_deleted = True
    employee.deleted_at = int(time.time() * 1000)
    db.commit()

# Asynchronous non-blocking wrappers
async def get_employee_by_id_async(db: Session, employee_id: int) -> Optional[Employee]:
    return await asyncio.to_thread(_get_employee_by_id, db, employee_id)

async def get_employee_with_position_by_id_async(db: Session, employee_id: int) -> Optional[Employee]:
    return await asyncio.to_thread(_get_employee_with_position_by_id, db, employee_id)

async def get_all_employees_with_position_async(db: Session) -> List[Employee]:
    return await asyncio.to_thread(_get_all_employees_with_position, db)

async def create_employee_async(db: Session, first_name: str, last_name: str, birthday: Optional[int], gender: str, phone: str, adress: Optional[str], position_id: int) -> Employee:
    return await asyncio.to_thread(_create_employee, db, first_name, last_name, birthday, gender, phone, adress, position_id)

async def update_employee_async(db: Session, employee: Employee, first_name: str, last_name: str, birthday: Optional[int], gender: str, phone: str, adress: Optional[str], position_id: int) -> Employee:
    return await asyncio.to_thread(_update_employee, db, employee, first_name, last_name, birthday, gender, phone, adress, position_id)

async def delete_employee_async(db: Session, employee: Employee):
    await asyncio.to_thread(_delete_employee, db, employee)
