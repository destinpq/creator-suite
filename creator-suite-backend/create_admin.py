#!/usr/bin/env python3
"""
Script to create an admin account for the Creator Suite system.
"""

import sys
import os
sys.path.append('/home/azureuser/creator-suite/creator-suite-backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.admin import create_admin_with_user
from app.services.user import get_user_by_email
from app.schemas.user import UserCreate

def create_admin_account():
    """Create an admin account with specified credentials."""
    
    # Admin credentials
    email = "pratik@destinpq.com"
    username = "pratik_admin"
    password = "Akanksha100991!"
    full_name = "Pratik - Super Admin"
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False
        
        # Create user data
        user_data = UserCreate(
            email=email,
            username=username,
            password=password,
            name=full_name,
            is_active=True
        )
        
        # Create admin with superadmin privileges
        admin = create_admin_with_user(db, user_data, is_superadmin=True)
        
        print(f"✅ Admin account created successfully!")
        print(f"   Email: {email}")
        print(f"   Username: {username}")
        print(f"   Admin ID: {admin.id}")
        print(f"   Superadmin: {admin.is_superadmin}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin account: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Creating admin account...")
    success = create_admin_account()
    if success:
        print("🎉 Admin account creation completed!")
    else:
        print("💥 Admin account creation failed!")
        sys.exit(1)
