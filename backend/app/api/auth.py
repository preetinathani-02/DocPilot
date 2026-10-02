from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import decode_token, hash_token
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    GoogleLoginRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        domain=settings.COOKIE_DOMAIN,
        path="/api/v1/auth",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, response: Response, payload: UserRegister, db: Session = Depends(get_db)):
    user = auth_service.create_local_user(db, payload.email, payload.password, payload.full_name)
    access_token, refresh_token = auth_service.issue_tokens(
        db, user, user_agent=request.headers.get("user-agent"), ip_address=request.client.host if request.client else None
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, response: Response, payload: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_local_user(db, payload.email, payload.password)
    access_token, refresh_token = auth_service.issue_tokens(
        db, user, user_agent=request.headers.get("user-agent"), ip_address=request.client.host if request.client else None
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_login(request: Request, response: Response, payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    user = auth_service.get_or_create_google_user(db, payload.id_token)
    access_token, refresh_token = auth_service.issue_tokens(
        db, user, user_agent=request.headers.get("user-agent"), ip_address=request.client.host if request.client else None
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
@limiter.limit("30/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")

    if not raw_token:
        raise unauthorized

    try:
        payload = decode_token(raw_token, expected_type="refresh")
    except Exception:
        _clear_refresh_cookie(response)
        raise unauthorized

    jti = payload.get("jti")
    family_id = payload.get("fam")
    record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()

    if record is None or record.token_hash != hash_token(raw_token):
        _clear_refresh_cookie(response)
        raise unauthorized

    if record.revoked:
        # Reuse of an already-rotated (or explicitly revoked) refresh token
        # is a strong signal of theft — nuke the whole token family.
        auth_service.revoke_token_family(db, family_id)
        _clear_refresh_cookie(response)
        raise unauthorized

    user = auth_service.get_user_by_id(db, record.user_id)
    if user is None or not user.is_active:
        _clear_refresh_cookie(response)
        raise unauthorized

    # Rotate: revoke the old token, issue a new one in the same family.
    record.revoked = True
    db.commit()

    access_token, new_refresh_token = auth_service.issue_tokens(
        db, user, family_id=family_id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    _set_refresh_cookie(response, new_refresh_token)

    return AccessTokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    if raw_token:
        try:
            payload = decode_token(raw_token, expected_type="refresh")
            record = db.query(RefreshToken).filter(RefreshToken.jti == payload.get("jti")).first()
            if record:
                record.revoked = True
                db.commit()
        except Exception:
            pass
    _clear_refresh_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
