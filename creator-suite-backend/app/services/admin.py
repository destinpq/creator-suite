from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.admin import Admin
from app.models.user import User
from app.schemas.admin import AdminCreate, AdminUpdate
from app.services.user import create_user, get_user_by_email
from app.schemas.user import UserCreate


def get_admin(db: Session, admin_id: int) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.id == admin_id).first()


def get_admin_by_user_id(db: Session, user_id: int) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.id == user_id).first()


def get_admin_by_email(db: Session, email: str) -> Optional[Admin]:
    return db.query(Admin).join(User, Admin.id == User.id).filter(User.email == email).first()


def get_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
    return db.query(Admin).offset(skip).limit(limit).all()


def create_admin(db: Session, user_id: int, admin: AdminCreate) -> Admin:
    db_admin = Admin(
        id=user_id,
        is_superadmin=admin.is_superadmin,
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def create_admin_with_user(db: Session, user_data: UserCreate, is_superadmin: bool = False) -> Admin:
    # First create the user
    user = create_user(db, user_data)
    
    # Then create the admin linked to this user
    admin_data = AdminCreate(is_superadmin=is_superadmin)
    admin = create_admin(db, user.id, admin_data)
    
    return admin


def update_admin(db: Session, admin_id: int, admin: AdminUpdate) -> Optional[Admin]:
    db_admin = get_admin(db, admin_id)
    if not db_admin:
        return None
    
    update_data = admin.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_admin, field, value)
    
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def delete_admin(db: Session, admin_id: int) -> Optional[Admin]:
    db_admin = get_admin(db, admin_id)
    if not db_admin:
        return None
    
    db.delete(db_admin)
    db.commit()
    return db_admin