import time
from sqlalchemy import Column, Integer, String, Boolean, BigInteger
from sqlalchemy.orm import relationship
from config.database import Base

class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    # Storing dates as Unix timestamp integers (milliseconds since epoch)
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000), nullable=False)
    deleted_at = Column(BigInteger, nullable=True)

    employees = relationship("Employee", back_populates="position")

    @property
    def employee_count(self) -> int:
        return sum(1 for e in self.employees if not e.is_deleted)
