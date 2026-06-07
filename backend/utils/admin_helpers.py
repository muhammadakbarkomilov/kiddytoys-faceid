import asyncio
import time
from typing import List, Optional
from sqlalchemy.orm import Session
from models.admin import Admin

# Synchronous blocking database operations (nodes)
def _get_admin_by_username(db: Session, username: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.username == username, Admin.is_deleted == False).first()

def _get_admin_by_id(db: Session, admin_id: int) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.id == admin_id, Admin.is_deleted == False).first()

def _get_all_admins(db: Session) -> List[Admin]:
    return db.query(Admin).filter(Admin.is_deleted == False).all()

def _create_admin(db: Session, first_name: str, last_name: str, username: str, phone: Optional[str], hashed_pw: str) -> Admin:
    admin = Admin(
        first_name=first_name,
        last_name=last_name,
        username=username,
        phone=phone,
        password=hashed_pw
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def _update_admin(db: Session, admin: Admin, first_name: str, last_name: str, username: str, phone: Optional[str], hashed_pw: Optional[str]) -> Admin:
    admin.first_name = first_name
    admin.last_name = last_name
    admin.username = username
    admin.phone = phone
    if hashed_pw:
        admin.password = hashed_pw
    db.commit()
    db.refresh(admin)
    return admin

def _delete_admin(db: Session, admin: Admin):
    admin.is_deleted = True
    admin.deleted_at = int(time.time() * 1000)
    db.commit()

# Asynchronous non-blocking wrappers
async def get_admin_by_username_async(db: Session, username: str) -> Optional[Admin]:
    return await asyncio.to_thread(_get_admin_by_username, db, username)

async def get_admin_by_id_async(db: Session, admin_id: int) -> Optional[Admin]:
    return await asyncio.to_thread(_get_admin_by_id, db, admin_id)

async def get_all_admins_async(db: Session) -> List[Admin]:
    return await asyncio.to_thread(_get_all_admins, db)

async def create_admin_async(db: Session, first_name: str, last_name: str, username: str, phone: Optional[str], hashed_pw: str) -> Admin:
    return await asyncio.to_thread(_create_admin, db, first_name, last_name, username, phone, hashed_pw)

async def update_admin_async(db: Session, admin: Admin, first_name: str, last_name: str, username: str, phone: Optional[str], hashed_pw: Optional[str]) -> Admin:
    return await asyncio.to_thread(_update_admin, db, admin, first_name, last_name, username, phone, hashed_pw)

async def delete_admin_async(db: Session, admin: Admin):
    await asyncio.to_thread(_delete_admin, db, admin)
