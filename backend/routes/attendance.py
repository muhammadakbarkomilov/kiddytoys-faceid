from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from config.database import get_db
from config.settings import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from utils.auth import get_current_admin
from utils.attendance_helpers import (
    send_telegram_notification,
    get_employee_by_id_async,
    get_attendance_record_async,
    create_attendance_record_async,
    update_attendance_time_async,
    get_attendance_overview_async
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/overview")
async def get_attendance_overview(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    tz_uz = timezone(timedelta(hours=5))
    now_uz = datetime.now(tz=tz_uz)
    
    if now_uz.hour < 5:
        logical_today = now_uz - timedelta(days=1)
    else:
        logical_today = now_uz
        
    logical_midnight = datetime(logical_today.year, logical_today.month, logical_today.day, tzinfo=tz_uz)
    today_ts = int(logical_midnight.timestamp() * 1000)
    
    stats = await get_attendance_overview_async(db, today_ts)
    return {"success": True, "data": stats}


@router.post("/events", status_code=status.HTTP_200_OK)
async def register_attendance_event(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "detail": "Invalid JSON body"}

    sub_event = data.get("AccessControllerEvent", data)
    
    # Extract employee identifier
    emp_str = sub_event.get("employeeNoString") or sub_event.get("name")
    if not emp_str:
        return {"success": False, "detail": "Employee ID (employeeNoString or name) not found"}

    try:
        emp_id_int = int(emp_str)
    except ValueError:
        return {"success": False, "detail": f"Invalid Employee ID format: {emp_str}"}

    # Verify employee exists asynchronously
    employee = await get_employee_by_id_async(db, emp_id_int)
    if not employee:
        return {"success": False, "detail": f"Employee with ID {emp_id_int} not found"}

    # Extract event datetime
    date_time_str = sub_event.get("dateTime") or data.get("dateTime")
    if not date_time_str:
        return {"success": False, "detail": "dateTime field not found"}

    try:
        # Parse ISO 8601 datetime format (e.g. "2026-06-06T22:19:03+05:00")
        dt = datetime.fromisoformat(date_time_str)
    except Exception:
        return {"success": False, "detail": f"Invalid ISO 8601 dateTime format: {date_time_str}"}

    # Unix timestamp in milliseconds since epoch
    event_timestamp_ms = int(dt.timestamp() * 1000)

    # Night shift logic: if hour is less than 5 AM, assign to previous calendar day
    if dt.hour < 5:
        logical_date = dt - timedelta(days=1)
    else:
        logical_date = dt

    # Calculate logical midnight timestamp with the same timezone info
    logical_midnight = datetime(
        logical_date.year, 
        logical_date.month, 
        logical_date.day, 
        tzinfo=dt.tzinfo
    )
    date_ts = int(logical_midnight.timestamp() * 1000)

    # Check for existing attendance record on this logical date asynchronously
    existing_record = await get_attendance_record_async(db, employee.id, date_ts)

    event_status = None
    if not existing_record:
        # No record -> Check-in asynchronously
        event_status = "checkIn"
        await create_attendance_record_async(db, employee.id, date_ts, event_timestamp_ms)
    else:
        # Record exists, check times
        if existing_record.in_time is None:
            event_status = "checkIn"
            await update_attendance_time_async(db, existing_record, "in_time", event_timestamp_ms)
        elif existing_record.out_time is None:
            event_status = "checkOut"
            await update_attendance_time_async(db, existing_record, "out_time", event_timestamp_ms)
        else:
            # Both times are already set for today
            return {
                "success": True,
                "message": "Attendance already recorded for today, ignored duplicate"
            }

    # Prepare notification message
    status_map = {
        "checkIn": "Kirish",
        "checkOut": "Chiqish"
    }
    status_text = status_map.get(event_status, event_status)
    
    full_name = f"{employee.first_name} {employee.last_name}"
    formatted_time = dt.strftime('%d.%m.%Y | %H:%M')

    message = (
        f"🔰 #employee_{employee.id}\n"
        f"🔰 Xodim: <b>{full_name}</b>\n"
        f"🔰 Holat: <b>{status_text}</b>\n"
        f"🔰 Vaqt: <b>{formatted_time}</b>"
    )


    # Send telegram message
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        await send_telegram_notification(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message)

    return {
        "success": True,
        "message": f"Attendance event registered successfully as {event_status}"
    }
