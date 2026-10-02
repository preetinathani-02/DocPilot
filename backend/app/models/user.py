import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR

from app.core.database import Base


class GUID(TypeDecorator):
    """Platform-independent UUID type.

    Uses PostgreSQL's native UUID type when available, otherwise stores
    as a 36-character string (works with SQLite for local/dev use).
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class AuthProvider(str, enum.Enum):
    LOCAL = "local"
    GOOGLE = "google"


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(320), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)

    # Nullable because Google-only accounts have no local password.
    hashed_password = Column(String(255), nullable=True)

    auth_provider = Column(
        Enum(AuthProvider), nullable=False, default=AuthProvider.LOCAL
    )
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    avatar_url = Column(String(1024), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)

    # Basic brute-force protection: track consecutive failed attempts and
    # temporarily lock the account after too many. Reset on success.
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
