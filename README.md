# DocPilot

AI-powered Document Intelligence Platform that enables users to chat with their documents using Retrieval-Augmented Generation (RAG) and multiple Large Language Models.

## Features

- Upload and parse PDF, DOCX, and XLSX documents
- Intelligent document chunking
- Embedding generation using **Gemini Embedding**
- Semantic search with **Qdrant Cloud**
- Retrieval-Augmented Generation (RAG)
- Multi-LLM support
  - Google Gemini
  - OpenAI
  - Anthropic Claude
- LangChain-powered prompt orchestration
- Source-backed AI responses
- Production-ready FastAPI REST APIs

---

## Tech Stack

**Backend**
- Python
- FastAPI
- PostgreSQL

**AI & RAG**
- LangChain
- Google Gemini
- OpenAI
- Anthropic Claude
- Gemini Embedding Model
- Qdrant Cloud

---

## Architecture

```text
Upload
   ↓
Document Parsing
   ↓
Chunking
   ↓
Gemini Embeddings
   ↓
Qdrant Cloud
   ↓
Semantic Retrieval
   ↓
Prompt Generation
   ↓
LLM (Gemini / OpenAI / Claude)
   ↓
Grounded AI Response
```

---

## APIs

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google      # body: { id_token }
POST /api/v1/auth/refresh     # reads httpOnly refresh cookie
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Documents
```
GET    /api/v1/documents
DELETE /api/v1/documents/{document_id}
```

### Upload Documents
```
POST /api/v1/upload
```

Parse, chunk, generate embeddings, and index documents into Qdrant. **Requires
authentication** — documents are indexed and retrieved per-user.

### Chat with Documents
```
POST /api/v1/chat
```

Retrieve relevant context and generate grounded responses using the selected LLM.
**Requires authentication.**

---

## Current Capabilities

- Document ingestion & parsing
- Semantic document search
- End-to-end RAG pipeline
- Multi-LLM architecture
- Configurable AI provider
- Source citation support
- **Authentication**: email/password registration & login, Google Sign-In, JWT
  access + rotating refresh tokens, per-user data isolation. See
  [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md) for the full design.

---

## Roadmap

- LangGraph workflows
- Agentic AI
- Multi-document chat
- Streaming responses
- Role-based access control (RBAC)
- Conversation history
- MCP integration
- Enterprise connectors
- Email verification & password reset flows

---

## Run Locally

### Backend

```bash
cd backend
python -m venv env
source env/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in QDRANT_URL / QDRANT_API_KEY / GEMINI_API_KEY.
# Generate a real JWT secret: openssl rand -hex 32
# (Optional) fill in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET for Google Sign-In.

# Apply database migrations (creates users/refresh_tokens/documents tables)
alembic upgrade head

uvicorn app.main:app --reload --port 8020
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL should point at the backend above.
# VITE_GOOGLE_CLIENT_ID must match the backend's GOOGLE_CLIENT_ID (optional).

npm run dev
```

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full, documented list.
Summary:

```env
# Backend
GEMINI_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=

DATABASE_URL=sqlite:///./docpilot.db   # use Postgres in production
JWT_SECRET_KEY=                         # openssl rand -hex 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Frontend
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```