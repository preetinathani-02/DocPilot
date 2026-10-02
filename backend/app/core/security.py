"""
Core security primitives: password hashing and JWT issuance/verification.

Design choices (industry-standard, OWASP-aligned):
  - Passwords hashed with bcrypt (via the `bcrypt` library directly — no
    passlib, which is unmaintained and has known bcrypt-backend issues).
  - Short-lived access tokens (default 15 min) signed with HS256, carried
    in the Authorization header — never persisted client-side beyond memory.
  - Long-lived refresh tokens (default 7 days) with rotation: every refresh
    issues a brand-new token and invalidates the old one. Refresh tokens are
    delivered as an httpOnly, Secure, SameSite=Lax/Strict cookie so they are
    inaccessible to JavaScript (mitigates XSS token theft).
  - Refresh tokens are tracked server-side (see RefreshToken model) so a
    single session (or all sessions) can be revoked, and reuse of an
    already-rotated token can be detected and treated as a compromise signal.
"""
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import bcrypt
import jwt
from jwt import PyJWTError

from app.core.config import settings

ALGORITHM = "HS256"


# ─── Password hashing ────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt (auto-generated salt)."""
    pwd_bytes = plain_password.encode("utf-8")[:72]  # bcrypt's own limit
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


# ─── JWT access tokens ────────────────────────────────────────────────────────

def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": uuid.uuid4().hex,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(
    subject: str, family_id: str | None = None
) -> tuple[str, str, str, datetime]:
    """
    Returns (token, jti, family_id, expires_at).

    `family_id` links a chain of rotated refresh tokens together; pass the
    previous token's family_id when rotating so the whole chain can be
    revoked together if reuse of a stale token is ever detected.
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = uuid.uuid4().hex
    family_id = family_id or uuid.uuid4().hex

    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": expires_at,
        "jti": jti,
        "fam": family_id,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return token, jti, family_id, expires_at


def decode_token(token: str, expected_type: Literal["access", "refresh"]) -> dict:
    """Decode + validate a JWT. Raises PyJWTError subclasses on failure."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != expected_type:
        raise PyJWTError(f"Expected a {expected_type} token")
    return payload


def hash_token(token: str) -> str:
    """One-way hash of a refresh token for storage (never store raw tokens)."""
    import hashlib

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)
