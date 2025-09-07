import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user import UserCreate
from app.services.admin import create_admin_with_user, get_admin_by_email
from app.services.organization import get_organization_by_name, create_organization
from app.schemas.organization import OrganizationCreate


def create_default_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = get_admin_by_email(db, "gurkaran@destinpq.com")
        if admin:
            print("Default admin user already exists.")
            return

        # Check if default organization exists, if not create it
        org = get_organization_by_name(db, "Default Organization")
        if not org:
            org_in = OrganizationCreate(
                name="Default Organization",
                description="Default organization for the system"
            )
            org = create_organization(db, org_in)
            print(f"Created default organization with ID: {org.id}")

        # Create admin user
        user_data = UserCreate(
            email="gurkaran@destinpq.com",
            username="gurkaran",
            password="12345678",
            organization_id=org.id,
            is_active=True
        )

        admin = create_admin_with_user(db, user_data, is_superadmin=True)
        print(f"Created default admin user with ID: {admin.id}")

    finally:
        db.close()


if __name__ == "__main__":
    create_default_admin()