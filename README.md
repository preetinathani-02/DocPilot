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

### Upload Documents
```
POST /api/v1/upload
```

Parse, chunk, generate embeddings, and index documents into Qdrant.

### Chat with Documents
```
POST /api/v1/chat
```

Retrieve relevant context and generate grounded responses using the selected LLM.

---

## Current Capabilities

- Document ingestion & parsing
- Semantic document search
- End-to-end RAG pipeline
- Multi-LLM architecture
- Configurable AI provider
- Source citation support

---

## Roadmap

- LangGraph workflows
- Agentic AI
- Multi-document chat
- Streaming responses
- Authentication & RBAC
- Conversation history
- MCP integration
- Enterprise connectors

---

## Run Locally

```bash
git clone <repository-url>

cd backend

python -m venv env

source env/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Environment Variables

```env
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

QDRANT_URL=
QDRANT_API_KEY=
```