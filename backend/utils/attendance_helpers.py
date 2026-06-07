import asyncio
from sqlalchemy.orm import Session
import aiohttp

from models.employee import Employee
from models.attendance import Attendance

async def send_telegram_notification(bot_token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    timeout = aiohttp.ClientTimeout(total=10.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            async with session.post(url, json=payload) as response:
                await response.read()
        except Exception as e:
            # Silent catch to ensure network failures don't block DB updates
            print(f"Telegram notification error: {e}")

# Database helper nodes (synchronous blocking calls)
def _get_employee_by_id(db: Session, emp_id: int) -> Employee:
    return db.query(Employee).filter(Employee.id == emp_id, Employee.is_deleted == False).first()

def _get_attendance_record(db: Session, emp_id: int, date_ts: int) -> Attendance:
    return db.query(Attendance).filter(Attendance.emp_id == emp_id, Attendance.date == date_ts).first()

def _create_attendance_record(db: Session, emp_id: int, date_ts: int, timestamp: int) -> Attendance:
    record = Attendance(
        emp_id=emp_id,
        date=date_ts,
        in_time=timestamp,
        out_time=None,
        type="present"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def _update_attendance_time(db: Session, record: Attendance, check_type: str, timestamp: int):
    if check_type == "in_time":
        record.in_time = timestamp
    elif check_type == "out_time":
        record.out_time = timestamp
    db.commit()

# Async wrappers for database helper nodes
async def get_employee_by_id_async(db: Session, emp_id: int) -> Employee:
    return await asyncio.to_thread(_get_employee_by_id, db, emp_id)

async def get_attendance_record_async(db: Session, emp_id: int, date_ts: int) -> Attendance:
    return await asyncio.to_thread(_get_attendance_record, db, emp_id, date_ts)

async def create_attendance_record_async(db: Session, emp_id: int, date_ts: int, timestamp: int) -> Attendance:
    return await asyncio.to_thread(_create_attendance_record, db, emp_id, date_ts, timestamp)

async def update_attendance_time_async(db: Session, record: Attendance, check_type: str, timestamp: int):
    await asyncio.to_thread(_update_attendance_time, db, record, check_type, timestamp)

def _get_attendance_overview(db: Session, today_ts: int) -> dict:
    total_employees = db.query(Employee).filter(Employee.is_deleted == False).count()
    checked_in_today = db.query(Attendance).filter(
        Attendance.date == today_ts,
        Attendance.in_time.isnot(None)
    ).count()
    
    latest_records = db.query(Attendance).order_by(Attendance.updated_at.desc()).limit(5).all()
    latest_logs = []
    
    for rec in latest_records:
        emp = rec.employee
        if not emp or emp.is_deleted:
            continue
        
        if rec.out_time is not None:
            status = "checkOut"
            timestamp = rec.out_time
        else:
            status = "checkIn"
            timestamp = rec.in_time
            
        latest_logs.append({
            "id": rec.id,
            "employee_id": emp.id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "status": status,
            "timestamp": timestamp
        })
        
    return {
        "total_employees": total_employees,
        "checked_in_today": checked_in_today,
        "latest_logs": latest_logs
    }

async def get_attendance_overview_async(db: Session, today_ts: int) -> dict:
    return await asyncio.to_thread(_get_attendance_overview, db, today_ts)

