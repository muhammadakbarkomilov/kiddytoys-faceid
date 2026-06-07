import time
from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    emp_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(BigInteger, index=True, nullable=False) # Logical date midnight Unix timestamp in milliseconds
    in_time = Column(BigInteger, nullable=True) # First check-in event Unix timestamp in milliseconds
    out_time = Column(BigInteger, nullable=True) # Last check-out event Unix timestamp in milliseconds
    type = Column(String, default="present", nullable=False) # "present"
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000), nullable=False)
    updated_at = Column(BigInteger, default=lambda: int(time.time() * 1000), onupdate=lambda: int(time.time() * 1000), nullable=False)

    employee = relationship("Employee", backref="attendances")
