from pydantic import BaseModel
from typing import Optional

from app.schemas.user import User


class AdminBase(BaseModel):
    is_superadmin: bool = False


class AdminCreate(AdminBase):
    pass


class AdminUpdate(AdminBase):
    pass


class AdminInDBBase(AdminBase):
    id: int

    class Config:
        from_attributes = True


class Admin(AdminInDBBase):
    pass


class AdminWithUser(Admin):
    user: User