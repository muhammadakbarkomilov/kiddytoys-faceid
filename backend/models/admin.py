import time
from sqlalchemy import Column, Integer, String, Boolean, BigInteger
from config.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False) # Argon2id Hash
    is_deleted = Column(Boolean, default=False, nullable=False)
    # Storing dates as Unix timestamp integers (milliseconds since epoch)
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000), nullable=False)
    deleted_at = Column(BigInteger, nullable=True)
