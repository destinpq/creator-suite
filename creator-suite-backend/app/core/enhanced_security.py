import secrets
import string
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import pyotp
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import redis
import geoip2.database
import user_agents

from app.core.config import settings


class EnhancedSecurity:
    """Enhanced security utilities for authentication and authorization"""

    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.encryption_key = self._derive_key(settings.SECRET_KEY)

    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password"""
        salt = b'enhanced_auth_salt_2024'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))

    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        f = Fernet(self.encryption_key)
        return f.encrypt(data.encode()).decode()

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        f = Fernet(self.encryption_key)
        return f.decrypt(encrypted_data.encode()).decode()

    def generate_session_token(self) -> str:
        """Generate a secure session token"""
        return secrets.token_urlsafe(64)

    def hash_device_fingerprint(self, device_info: Dict[str, Any]) -> str:
        """Create a hash of device fingerprint for tracking"""
        device_string = json.dumps(device_info, sort_keys=True)
        return hashlib.sha256(device_string.encode()).hexdigest()

    def get_geolocation(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """Get geolocation data from IP address"""
        try:
            # This would require a GeoIP database
            # For now, return basic info
            return {
                "ip": ip_address,
                "country": "Unknown",
                "city": "Unknown",
                "coordinates": {"lat": 0.0, "lon": 0.0}
            }
        except Exception:
            return None

    def parse_user_agent(self, user_agent_string: str) -> Dict[str, Any]:
        """Parse user agent string for device information"""
        try:
            ua = user_agents.parse(user_agent_string)
            return {
                "browser": ua.browser.family,
                "browser_version": ua.browser.version_string,
                "os": ua.os.family,
                "os_version": ua.os.version_string,
                "device": ua.device.family,
                "is_mobile": ua.is_mobile,
                "is_tablet": ua.is_tablet,
                "is_pc": ua.is_pc,
                "is_bot": ua.is_bot
            }
        except Exception:
            return {"raw": user_agent_string}


class MFAManager:
    """Multi-Factor Authentication Manager"""

    def __init__(self):
        self.security = EnhancedSecurity()

    def generate_totp_secret(self) -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    def generate_totp_uri(self, secret: str, username: str, issuer: str = "Creator Suite") -> str:
        """Generate TOTP URI for QR code"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=username, issuer_name=issuer)

    def verify_totp(self, secret: str, code: str) -> bool:
        """Verify TOTP code"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    def generate_backup_codes(self, count: int = 10) -> list[str]:
        """Generate backup codes for MFA"""
        codes = []
        for _ in range(count):
            code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            codes.append(code.upper())
        return codes

    def encrypt_backup_codes(self, codes: list[str]) -> str:
        """Encrypt backup codes for storage"""
        codes_json = json.dumps(codes)
        return self.security.encrypt_data(codes_json)

    def decrypt_backup_codes(self, encrypted_codes: str) -> list[str]:
        """Decrypt backup codes"""
        codes_json = self.security.decrypt_data(encrypted_codes)
        return json.loads(codes_json)

    def verify_backup_code(self, encrypted_codes: str, code: str) -> tuple[bool, list[str]]:
        """Verify and consume a backup code"""
        codes = self.decrypt_backup_codes(encrypted_codes)
        if code.upper() in codes:
            codes.remove(code.upper())
            return True, codes
        return False, codes


class SessionManager:
    """Session management utilities"""

    def __init__(self):
        self.security = EnhancedSecurity()
        self.max_concurrent_sessions = 5

    def create_session(self, user_id: int, device_info: Dict[str, Any],
                      ip_address: str, user_agent: str) -> Dict[str, Any]:
        """Create a new user session"""
        session_token = self.security.generate_session_token()
        device_hash = self.security.hash_device_fingerprint(device_info)
        geolocation = self.security.get_geolocation(ip_address)
        parsed_ua = self.security.parse_user_agent(user_agent)

        session_data = {
            "user_id": user_id,
            "session_token": session_token,
            "device_hash": device_hash,
            "device_info": device_info,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "parsed_user_agent": parsed_ua,
            "geolocation": geolocation,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }

        # Store in Redis with expiration
        self.security.redis_client.setex(
            f"session:{session_token}",
            86400,  # 24 hours
            json.dumps(session_data)
        )

        return session_data

    def validate_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Validate and refresh session"""
        session_data = self.security.redis_client.get(f"session:{session_token}")
        if not session_data:
            return None

        session = json.loads(session_data)

        # Check if session is expired
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.utcnow() > expires_at:
            self.security.redis_client.delete(f"session:{session_token}")
            return None

        # Refresh session expiration
        self.security.redis_client.expire(f"session:{session_token}", 86400)

        return session

    def invalidate_session(self, session_token: str):
        """Invalidate a session"""
        self.security.redis_client.delete(f"session:{session_token}")

    def get_user_sessions(self, user_id: int) -> list[Dict[str, Any]]:
        """Get all active sessions for a user"""
        # This would require storing session tokens per user in Redis
        # For now, return empty list
        return []

    def invalidate_all_user_sessions(self, user_id: int):
        """Invalidate all sessions for a user"""
        sessions = self.get_user_sessions(user_id)
        for session in sessions:
            self.invalidate_session(session["session_token"])


class RateLimitManager:
    """Rate limiting manager using Redis"""

    def __init__(self):
        self.security = EnhancedSecurity()

    def check_rate_limit(self, identifier: str, limit_type: str,
                        max_requests: int = 100, window_seconds: int = 60) -> tuple[bool, int]:
        """
        Check if request is within rate limit
        Returns: (is_allowed, remaining_requests)
        """
        key = f"ratelimit:{limit_type}:{identifier}"
        current_time = datetime.utcnow().timestamp()

        # Use Redis sorted set to track requests
        # Remove old requests outside the window
        self.security.redis_client.zremrangebyscore(key, 0, current_time - window_seconds)

        # Count current requests in window
        request_count = self.security.redis_client.zcount(key, current_time - window_seconds, current_time)

        if request_count >= max_requests:
            return False, 0

        # Add current request
        self.security.redis_client.zadd(key, {str(current_time): current_time})
        self.security.redis_client.expire(key, window_seconds)

        remaining = max_requests - request_count - 1
        return True, remaining

    def get_remaining_time(self, identifier: str, limit_type: str, window_seconds: int = 60) -> int:
        """Get remaining time until rate limit resets"""
        key = f"ratelimit:{limit_type}:{identifier}"
        current_time = datetime.utcnow().timestamp()

        # Get the oldest request in the current window
        oldest_request = self.security.redis_client.zrange(key, 0, 0, withscores=True)
        if oldest_request:
            oldest_time = oldest_request[0][1]
            reset_time = oldest_time + window_seconds
            remaining = max(0, int(reset_time - current_time))
            return remaining

        return 0


class AuditLogger:
    """Audit logging system"""

    def __init__(self):
        self.security = EnhancedSecurity()

    def log_activity(self, user_id: Optional[int], action: str,
                    resource: Optional[str] = None, resource_id: Optional[int] = None,
                    details: Optional[Dict[str, Any]] = None,
                    ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                    success: bool = True, error_message: Optional[str] = None):
        """Log user activity"""
        log_entry = {
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "location": self.security.get_geolocation(ip_address) if ip_address else None,
            "success": success,
            "error_message": error_message,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Store in Redis for immediate access
        log_key = f"audit:{datetime.utcnow().strftime('%Y%m%d')}"
        self.security.redis_client.lpush(log_key, json.dumps(log_entry))

        # Set expiration for log retention (30 days)
        self.security.redis_client.expire(log_key, 2592000)

        # Also log to database (would be handled by the API endpoint)
        return log_entry


# Global instances
security_manager = EnhancedSecurity()
mfa_manager = MFAManager()
session_manager = SessionManager()
rate_limit_manager = RateLimitManager()
audit_logger = AuditLogger()
