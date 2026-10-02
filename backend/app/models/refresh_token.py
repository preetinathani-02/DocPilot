import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func

from app.core.database import Base
from app.models.user import GUID


class RefreshToken(Base):
    """
    Server-side record of issued refresh tokens.

    We never store the raw token — only a hash of it (jti + hash) — so a
    leaked database dump can't be used to mint sessions. This lets us:
      - revoke a single session (logout)
      - revoke all sessions for a user (e.g. after a password change)
      - detect refresh-token reuse (a stolen/replayed token) and react by
        revoking the whole token family, per OWASP guidance on refresh
        token rotation.
    """

    __tablename__ = "refresh_tokens"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # jti = unique token identifier embedded in the JWT payload
    jti = Column(String(64), unique=True, nullable=False, index=True)
    token_hash = Column(String(128), nullable=False)

    # Tokens are rotated on every refresh; family_id links a chain of
    # rotated tokens so reuse of an old token can invalidate the whole chain.
    family_id = Column(String(64), nullable=False, index=True)

    revoked = Column(Boolean, nullable=False, default=False)
    user_agent = Column(String(512), nullable=True)
    ip_address = Column(String(64), nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
