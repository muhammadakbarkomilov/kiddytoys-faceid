import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


from config.database import engine, Base, SessionLocal
from models.admin import Admin
from models.position import Position
from models.attendance import Attendance

from utils.auth import hash_password
from utils.rate_limit import limiter
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.error_handler import global_exception_handler

from routes.auth import router as auth_router, user_router
from routes.admin import router as admin_router
from routes.position import router as position_router
from routes.employee import router as employee_router
from routes.attendance import router as attendance_router


app = FastAPI(
    title="Attendance Management System",
    description="Attendance management system by Muhamadakbar Komilov",
    version="2.0.0",
    docs_url=None,
    redoc_url=None
)

# Wire up rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Wire up global unhandled exceptions (Error Masking)
app.add_exception_handler(Exception, global_exception_handler)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(position_router)
app.include_router(employee_router)
app.include_router(attendance_router)


@app.on_event("startup")
def startup_populate():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message":"ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
