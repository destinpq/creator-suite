#!/usr/bin/env python3
"""
Script to update the super admin password to fix bcrypt compatibility issues.
"""

import sys
import os
sys.path.append('/home/azureuser/creator-suite/creator-suite-backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.user import get_user_by_email, update_user
from app.schemas.user import UserUpdate

def update_admin_password():
    """Update the admin password to ensure compatibility."""
    
    # Admin credentials
    email = "pratik@destinpq.com"
    new_password = "Akanksha100991!"
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Get the user
        user = get_user_by_email(db, email)
        if not user:
            print(f"❌ User with email {email} does not exist!")
            return False
        
        print(f"✅ Found user: {user.email} (ID: {user.id})")
        
        # Update the password (need to provide all required fields)
        user_update = UserUpdate(
            email=user.email,
            username=user.username,
            password=new_password,
            name=user.name,
            is_active=user.is_active,
            organization_id=user.organization_id
        )
        updated_user = update_user(db, user.id, user_update)
        
        if updated_user:
            print(f"✅ Password updated successfully!")
            print(f"   User: {updated_user.email}")
            return True
        else:
            print(f"❌ Failed to update password!")
            return False
        
    except Exception as e:
        print(f"❌ Error updating password: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Updating super admin password...")
    success = update_admin_password()
    if success:
        print("🎉 Password update completed!")
    else:
        print("💥 Password update failed!")
        sys.exit(1)
