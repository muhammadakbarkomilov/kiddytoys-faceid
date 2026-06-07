import asyncio
from sqlalchemy.orm import Session
from models.admin import Admin

def _get_admin_by_username(db: Session, username: str) -> Admin:
    return db.query(Admin).filter(Admin.username == username, Admin.is_deleted == False).first()

async def get_admin_by_username_async(db: Session, username: str) -> Admin:
    return await asyncio.to_thread(_get_admin_by_username, db, username)
