from sqlalchemy import Boolean, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.session import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    is_superadmin = Column(Boolean, default=False)
    
    user = relationship("User", backref="admin_info", uselist=False)