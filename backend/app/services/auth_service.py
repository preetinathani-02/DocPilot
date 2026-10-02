from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import AuthProvider, User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_local_user(db: Session, email: str, password: str, full_name: str | None) -> User:
    if get_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email.lower(),
        hashed_password=hash_password(password),
        full_name=full_name,
        auth_provider=AuthProvider.LOCAL,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_local_user(db: Session, email: str, password: str) -> User:
    """Verify credentials, enforcing basic brute-force lockout. Raises HTTPException on failure."""
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )

    user = get_user_by_email(db, email)
    if not user or user.auth_provider != AuthProvider.LOCAL or not user.hashed_password:
        # Don't reveal whether the account exists or uses a different auth method.
        raise generic_error

    now = datetime.now(timezone.utc)
    locked_until = user.locked_until
    if locked_until is not None and locked_until.tzinfo is None:
        # SQLite drops tzinfo on round-trip; treat naive timestamps as UTC.
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    if locked_until and locked_until > now:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Too many failed login attempts. Please try again later.",
        )

    if not verify_password(password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        raise generic_error

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    # Successful login: reset lockout counters.
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return user


def get_or_create_google_user(db: Session, id_token_str: str) -> User:
    """Verify a Google ID token and find-or-create the corresponding user."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google sign-in is not configured on this server.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential.",
        )

    if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token issuer.")

    if not idinfo.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified.",
        )

    email = idinfo["email"].lower()
    google_id = idinfo["sub"]

    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        return user

    # Link to an existing local account with the same, verified email.
    user = get_user_by_email(db, email)
    if user:
        user.google_id = google_id
        if not user.avatar_url:
            user.avatar_url = idinfo.get("picture")
        db.commit()
        db.refresh(user)
        return user

    user = User(
        email=email,
        full_name=idinfo.get("name"),
        avatar_url=idinfo.get("picture"),
        auth_provider=AuthProvider.GOOGLE,
        google_id=google_id,
        is_verified=True,
        hashed_password=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def issue_tokens(db: Session, user: User, family_id: str | None = None, user_agent: str | None = None, ip_address: str | None = None):
    """Create a new access + refresh token pair and persist the refresh token record."""
    access_token = create_access_token(subject=str(user.id))
    refresh_token, jti, family_id, expires_at = create_refresh_token(
        subject=str(user.id), family_id=family_id
    )

    record = RefreshToken(
        user_id=user.id,
        jti=jti,
        token_hash=hash_token(refresh_token),
        family_id=family_id,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(record)
    db.commit()

    return access_token, refresh_token


def revoke_token_family(db: Session, family_id: str) -> None:
    db.query(RefreshToken).filter(RefreshToken.family_id == family_id).update(
        {"revoked": True}
    )
    db.commit()


def revoke_all_user_tokens(db: Session, user_id) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
    db.commit()
