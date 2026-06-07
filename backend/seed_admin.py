import sys
import os

# Add parent directory to path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import SessionLocal, engine, Base
from models.admin import Admin
from utils.auth import hash_password

def seed_default_admin():
    # Ensure database tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        admin_count = db.query(Admin).filter(Admin.is_deleted == False).count()
        if admin_count == 0:
            default_admin = Admin(
                first_name="Admin",
                last_name="Super",
                username="admin",
                phone="+998901234567",
                password=hash_password("admin123") # Argon2id hashed
            )
            db.add(default_admin)
            db.commit()
            print("--------------------------------------------------")
            print("DB_SEED: Default admin created successfully!")
            print("Username: admin")
            print("Password: admin123")
            print("--------------------------------------------------")
        else:
            print("DB_SEED: Admin already exists, skipping.")
    except Exception as e:
        print(f"DB_SEED_ERROR: Failed to seed DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_default_admin()
