# DocPilot — Authentication Architecture

This document describes the authentication system added to DocPilot: email/password
registration & login, Google Sign-In, and how the rest of the API was updated to be
multi-tenant safe.

## Why this was necessary

The original codebase had **no authentication at all**. Every API endpoint was public,
document chunks in Qdrant were not tagged by owner, and uploaded files were written to a
single shared directory keyed only by original filename. In practice this meant:

- Any client could call `/api/v1/chat` or `/api/v1/search` and query **every user's**
  documents.
- Two users uploading a file with the same name would overwrite each other's file on disk.
- There was no concept of "who owns this document" anywhere in the system.

Everything below exists to close those gaps while adding standard, modern auth.

---

## 1. High-level flow

```
┌──────────────┐        1. register / login / google         ┌──────────────────┐
│              │ ────────────────────────────────────────────▶ │                  │
│   Frontend   │        access_token (JSON body, in memory)     │   FastAPI        │
│   (React)    │ ◀──────────────────────────────────────────── │   /api/v1/auth   │
│              │        refresh_token (httpOnly cookie)         │                  │
└──────┬───────┘                                                └────────┬─────────┘
       │                                                                 │
       │ 2. Authorization: Bearer <access_token>                        │
       │    on every subsequent API call                                ▼
       │                                                        ┌──────────────────┐
       │                                                        │  PostgreSQL /    │
       │        3. on 401 (expired access token):                │  SQLite          │
       │           POST /auth/refresh (cookie sent                │  users           │
       │           automatically) → new access_token               │  refresh_tokens  │
       │           → original request retried once                 │  documents       │
       └────────────────────────────────────────────────────▶     └──────────────────┘
```

### Token strategy (OWASP-aligned)

| Token          | Lifetime  | Storage                          | Purpose                        |
|----------------|-----------|-----------------------------------|--------------------------------|
| Access token   | 15 min    | JS memory only (never persisted) | Sent as `Authorization: Bearer` on every API call |
| Refresh token  | 7 days    | httpOnly, Secure, SameSite cookie, scoped to `/api/v1/auth` | Used only to mint new access tokens |

Why not just store a JWT in `localStorage`? Because any XSS on the page can read
`localStorage`/`sessionStorage` and exfiltrate the token. Keeping the access token in
memory and the refresh token in an `httpOnly` cookie means client-side JavaScript never
has access to a long-lived credential — an XSS bug can at most steal a 15-minute token.

**Refresh token rotation**: every call to `/auth/refresh` invalidates the token that was
used and issues a brand-new one in the same "family" (`RefreshToken.family_id`). If a
already-rotated (i.e. stale) token is ever replayed — the signature of a stolen/leaked
token — the entire family is revoked server-side, killing that session chain. This is the
rotation-with-reuse-detection pattern recommended by OWASP's JWT/refresh-token cheat
sheet.

**Revocation**: refresh tokens are stored server-side (hashed, never in plaintext) in the
`refresh_tokens` table, so logout, password changes, or an admin action can revoke a
single session or all of a user's sessions immediately — something a stateless JWT alone
cannot do.

---

## 2. Backend components

```
backend/app/
├── core/
│   ├── config.py        # all settings incl. JWT/cookie/Google config (env-driven)
│   ├── database.py       # SQLAlchemy engine/session, init_db()
│   ├── security.py       # bcrypt hashing, JWT create/decode, token hashing
│   ├── deps.py           # get_current_user FastAPI dependency
│   └── limiter.py        # slowapi rate limiter
├── models/
│   ├── user.py            # User (local + Google), lockout fields
│   ├── refresh_token.py   # hashed refresh tokens, rotation family, revocation
│   └── document.py        # per-user document metadata (owner_id FK)
├── schemas/
│   └── auth.py            # Pydantic request/response models, password policy
├── services/
│   └── auth_service.py    # registration, authentication, Google verification,
│                            token issuance/rotation, lockout logic
└── api/
    ├── auth.py             # /register /login /google /refresh /logout /me
    └── documents.py        # per-user document list/delete
```

### Password storage

- Hashed with **bcrypt** (12 rounds), via the `bcrypt` library directly (not `passlib`,
  which is unmaintained and has had bcrypt-backend compatibility issues).
- Plaintext passwords are never logged or persisted.
- Password policy (enforced server-side in `schemas/auth.py`, and mirrored client-side
  for UX): minimum 8 characters, at least one uppercase, one lowercase, one digit.

### Brute-force protection

`User.failed_login_attempts` / `User.locked_until` implement a simple lockout: after
`MAX_FAILED_LOGIN_ATTEMPTS` (default 5) consecutive failures, the account is locked for
`ACCOUNT_LOCKOUT_MINUTES` (default 15). Successful login resets the counter. This is in
addition to IP-based rate limiting on `/auth/login` and `/auth/register` via `slowapi`.

Login and registration also return **generic error messages** ("Incorrect email or
password") rather than revealing whether an email exists, to resist user enumeration.

### Google Sign-In

We use **Google Identity Services (GIS)**, the current standard client-side flow for
SPAs (no server-side redirect dance needed):

1. The frontend renders Google's official button (`GoogleSignInButton.tsx`), which loads
   `accounts.google.com/gsi/client` and calls `google.accounts.id.initialize()` with the
   app's `VITE_GOOGLE_CLIENT_ID`.
2. On success, Google returns a signed **ID token** directly to the browser — no
   client secret is ever exposed to the frontend.
3. The frontend POSTs that ID token to `POST /api/v1/auth/google`.
4. The backend verifies the token's signature, issuer, audience, and `email_verified`
   claim using Google's own `google-auth` library
   (`google.oauth2.id_token.verify_oauth2_token`) — the server never trusts client-supplied
   claims, only what Google's public keys can verify.
5. We find-or-create a `User`:
   - If a `google_id` match exists → log in.
   - Else if a **verified**, matching email exists (a local account) → link the Google
     identity to it.
   - Else → create a new user with `auth_provider = google` and no local password.
6. Standard access/refresh tokens are issued exactly as with local login, so the rest of
   the system doesn't need to know or care which provider the user signed in with.

### Multi-tenant data isolation

This was the most important gap in the original code, so it's called out separately:

- **Qdrant**: every point now carries an `owner_id` payload field. All reads
  (`search_similar_chunks`) and deletes are filtered `WHERE owner_id = current_user.id`.
- **Postgres/SQLite**: a new `documents` table records who uploaded what, backing the new
  `GET /api/v1/documents` and `DELETE /api/v1/documents/{id}` endpoints (previously the
  frontend only tracked "documents" in `localStorage`, with no real backing list).
- **Filesystem**: uploads are written to `app/uploads/<owner_id>/<uuid>_<sanitized-name>`
  instead of a flat shared directory keyed by the original filename — this closes both a
  cross-user file collision bug and a path-traversal vector (filenames are sanitized with
  `os.path.basename` + a character allow-list before being used in a path).
- Every existing endpoint (`/upload`, `/chat`, `/search`, `/settings`) now requires
  `Depends(get_current_user)` and scopes its queries by `current_user.id`.

### Migrations

Schema is managed with **Alembic** (`backend/alembic/`), not ad-hoc `create_all()` in
production. An initial migration (`create users, refresh_tokens, documents tables`) is
included and has been verified to apply cleanly against both SQLite and the
Postgres-compatible schema. `init_db()` still calls `create_all()` as a zero-config
convenience for local dev, but real deployments should run:

```bash
alembic upgrade head
```

---

## 3. Frontend components

```
frontend/src/
├── lib/
│   ├── tokenStore.ts     # in-memory access-token store (no localStorage)
│   ├── auth.ts            # register/login/google/refresh/logout/me API calls
│   └── api.ts              # main axios client: attaches Bearer token, auto-
│                              refreshes once on 401, retries the original request
├── context/
│   └── AuthContext.tsx    # user state, exposes login/register/loginGoogle/logout
├── components/auth/
│   ├── AuthLayout.tsx      # shared visual shell for auth pages
│   └── GoogleSignInButton.tsx  # loads GIS script, renders Google's button
└── pages/
    ├── LoginPage.tsx
    └── RegisterPage.tsx    # live password-policy checklist
```

- **Session recovery on page load**: since the access token lives only in memory, a page
  refresh loses it. `AuthProvider` calls `POST /auth/refresh` on mount (the browser sends
  the httpOnly cookie automatically); if it succeeds, the user is silently re-authenticated
  without needing to log in again. A splash screen is shown for the brief duration of this
  check so an authenticated user is never flashed the login page.
- **Automatic retry on 401**: `api.ts`'s response interceptor catches a 401, performs a
  single in-flight refresh (concurrent requests share one refresh call, not one each),
  attaches the new token, and retries the original request exactly once.
- **Route guards**: `App.tsx` keeps `PROTECTED_PAGES` (dashboard/upload/chat/documents/
  settings) behind `isAuthenticated`, and keeps a signed-in user out of the login/register
  screens — implemented as a single `useEffect`-driven redirect to respect React's Rules
  of Hooks.

---

## 4. Configuration reference

All new settings are read from environment variables (see `backend/.env.example`):

| Variable | Purpose | Production guidance |
|---|---|---|
| `DATABASE_URL` | Relational DB connection string | Use Postgres, not the SQLite default |
| `JWT_SECRET_KEY` | HMAC signing key for JWTs | `openssl rand -hex 32`, keep out of source control |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | 15 (default) is a reasonable balance |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | 7 (default); shorten for higher-sensitivity apps |
| `COOKIE_SECURE` | `Secure` flag on the refresh cookie | **Must be `true`** in production (HTTPS only) |
| `COOKIE_SAMESITE` | `SameSite` cookie policy | `lax` (default) or `strict` |
| `MAX_FAILED_LOGIN_ATTEMPTS` / `ACCOUNT_LOCKOUT_MINUTES` | Brute-force lockout | Tune per risk tolerance |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials | From Google Cloud Console |
| `VITE_GOOGLE_CLIENT_ID` (frontend) | Same Client ID, exposed to the browser | Must match backend's `GOOGLE_CLIENT_ID` |

### Setting up Google Sign-In

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** of type "Web application".
3. Add your frontend origin(s) under **Authorized JavaScript origins**
   (e.g. `http://localhost:5173` for local dev, your real domain for prod).
4. Copy the Client ID into both `backend/.env` (`GOOGLE_CLIENT_ID`) and
   `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). The Client Secret
   (`GOOGLE_CLIENT_SECRET`) is not currently used by the ID-token flow but is kept in
   config for future server-side flows (e.g. incremental authorization, Drive access).

---

## 5. What a production rollout still needs

This implementation is solid for a production launch, but a few operational items are
deliberately left as follow-ups rather than baked in, since they depend on your
infrastructure:

- **Postgres in production** — switch `DATABASE_URL`, run `alembic upgrade head`.
- **Email verification / password reset** — `User.is_verified` and the schema are ready
  for this, but sending emails requires picking a provider (SES, Postgres, Resend, etc.).
- **Redis-backed rate limiting** — `slowapi`'s default in-memory store works for a single
  instance; swap in `slowapi`'s Redis storage backend once you run multiple API replicas.
- **HTTPS termination** — required for `COOKIE_SECURE=true` to work; typically handled by
  your load balancer/reverse proxy, not the app itself.
- **Structured audit logging** of auth events (login, failed login, lockout, logout) for
  security monitoring, if your compliance needs require it.
