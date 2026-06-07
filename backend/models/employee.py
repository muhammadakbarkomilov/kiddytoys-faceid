import time
from sqlalchemy import Column, Integer, String, Boolean, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthday = Column(BigInteger, nullable=True) # Unix timestamp (milliseconds)
    male = Column(Boolean, default=True, nullable=False)
    phone = Column(String, nullable=False)
    adress = Column(String, nullable=True)
    position_id = Column(Integer, ForeignKey("positions.id"), index=True, nullable=False)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    # Storing dates as Unix timestamp integers (milliseconds since epoch)
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000), nullable=False)
    deleted_at = Column(BigInteger, nullable=True)

    position = relationship("Position", back_populates="employees")

    @property
    def gender(self) -> str:
        return "male" if self.male else "female"
