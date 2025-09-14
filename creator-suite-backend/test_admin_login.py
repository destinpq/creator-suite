#!/usr/bin/env python3
"""
Script to test super admin login with the provided credentials.
"""

import sys
import os
sys.path.append('/home/azureuser/creator-suite/creator-suite-backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.user import authenticate_user
from app.services.admin import get_admin_by_email

def test_admin_login():
    """Test login with admin credentials."""
    
    # Admin credentials
    email = "pratik@destinpq.com"
    password = "Akanksha100991!"
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Authenticate user
        user = authenticate_user(db, email, password)
        if not user:
            print(f"❌ Authentication failed for {email}")
            return False
        
        print(f"✅ Authentication successful!")
        print(f"   User: {user.email} (ID: {user.id})")
        print(f"   Username: {user.username}")
        print(f"   Active: {user.is_active}")
        
        # Check admin status
        admin = get_admin_by_email(db, email)
        if admin:
            print(f"✅ Admin privileges confirmed!")
            print(f"   Admin ID: {admin.id}")
            print(f"   Superadmin: {admin.is_superadmin}")
        else:
            print(f"❌ No admin privileges found!")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing login: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔐 Testing super admin login...")
    success = test_admin_login()
    if success:
        print("🎉 Login test successful!")
    else:
        print("💥 Login test failed!")
        sys.exit(1)
