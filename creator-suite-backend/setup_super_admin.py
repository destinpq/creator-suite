#!/usr/bin/env python3
"""
Script to check and create/update super admin account for the Creator Suite system.
"""

import sys
import os
sys.path.append('/home/azureuser/creator-suite/creator-suite-backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.admin import get_admin_by_email, create_admin
from app.services.user import get_user_by_email
from app.schemas.admin import AdminCreate

def setup_super_admin():
    """Check existing user and make them super admin if not already."""
    
    # Admin credentials
    email = "pratik@destinpq.com"
    password = "Akanksha100991!"
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if user exists
        user = get_user_by_email(db, email)
        if not user:
            print(f"❌ User with email {email} does not exist!")
            return False
        
        print(f"✅ Found user: {user.email} (ID: {user.id})")
        
        # Check if user is already an admin
        existing_admin = get_admin_by_email(db, email)
        if existing_admin:
            if existing_admin.is_superadmin:
                print(f"✅ User is already a super admin!")
                print(f"   Admin ID: {existing_admin.id}")
                print(f"   Superadmin: {existing_admin.is_superadmin}")
                return True
            else:
                # Update to super admin
                existing_admin.is_superadmin = True
                db.commit()
                db.refresh(existing_admin)
                print(f"✅ Updated user to super admin!")
                print(f"   Admin ID: {existing_admin.id}")
                print(f"   Superadmin: {existing_admin.is_superadmin}")
                return True
        
        # Create admin record for existing user
        admin_data = AdminCreate(is_superadmin=True)
        admin = create_admin(db, user.id, admin_data)
        
        print(f"✅ Created super admin account for existing user!")
        print(f"   Email: {email}")
        print(f"   User ID: {user.id}")
        print(f"   Admin ID: {admin.id}")
        print(f"   Superadmin: {admin.is_superadmin}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up super admin: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Setting up super admin account...")
    success = setup_super_admin()
    if success:
        print("🎉 Super admin setup completed!")
    else:
        print("💥 Super admin setup failed!")
        sys.exit(1)
