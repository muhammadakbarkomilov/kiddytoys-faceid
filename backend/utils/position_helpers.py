import asyncio
import time
from typing import List, Optional
from sqlalchemy.orm import Session
from models.position import Position
from models.employee import Employee

# Synchronous blocking database operations (nodes)
def _get_position_by_name(db: Session, name: str) -> Optional[Position]:
    return db.query(Position).filter(Position.name == name, Position.is_deleted == False).first()

def _get_position_by_id(db: Session, position_id: int) -> Optional[Position]:
    return db.query(Position).filter(Position.id == position_id, Position.is_deleted == False).first()

def _get_all_positions(db: Session) -> List[Position]:
    return db.query(Position).filter(Position.is_deleted == False).all()

def _create_position(db: Session, name: str) -> Position:
    position = Position(name=name)
    db.add(position)
    db.commit()
    db.refresh(position)
    return position

def _update_position(db: Session, position: Position, name: str) -> Position:
    position.name = name
    db.commit()
    db.refresh(position)
    return position

def _get_active_employees_count_by_position(db: Session, position_id: int) -> int:
    return db.query(Employee).filter(
        Employee.position_id == position_id,
        Employee.is_deleted == False
    ).count()

def _delete_position(db: Session, position: Position):
    position.is_deleted = True
    position.deleted_at = int(time.time() * 1000)
    db.commit()

# Asynchronous non-blocking wrappers
async def get_position_by_name_async(db: Session, name: str) -> Optional[Position]:
    return await asyncio.to_thread(_get_position_by_name, db, name)

async def get_position_by_id_async(db: Session, position_id: int) -> Optional[Position]:
    return await asyncio.to_thread(_get_position_by_id, db, position_id)

async def get_all_positions_async(db: Session) -> List[Position]:
    return await asyncio.to_thread(_get_all_positions, db)

async def create_position_async(db: Session, name: str) -> Position:
    return await asyncio.to_thread(_create_position, db, name)

async def update_position_async(db: Session, position: Position, name: str) -> Position:
    return await asyncio.to_thread(_update_position, db, position, name)

async def get_active_employees_count_by_position_async(db: Session, position_id: int) -> int:
    return await asyncio.to_thread(_get_active_employees_count_by_position, db, position_id)

async def delete_position_async(db: Session, position: Position):
    await asyncio.to_thread(_delete_position, db, position)
