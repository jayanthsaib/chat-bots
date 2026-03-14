# BotForge — AI Chatbot SaaS Platform

BotForge lets businesses create AI-powered chatbots trained on their own content (PDFs, websites, FAQs, text). Each chatbot can be embedded on any website via a JavaScript widget. The platform is multi-tenant — every user gets their own isolated workspace.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start (Local)](#quick-start-local)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Deployment](#deployment)

---

## Features

| Feature | Description |
|---|---|
| **Chatbot Builder** | Create bots with custom name, personality, and welcome message |
| **Knowledge Base** | Train bots from text, URLs, PDFs, or FAQ pairs |
| **RAG-Powered Chat** | Responses grounded in your content using vector search |
| **Embeddable Widget** | Drop a `<script>` tag on any website to add the chatbot |
| **Lead Capture** | Bots collect visitor name/email after N messages |
| **Conversation Inbox** | View and resolve all chat conversations |
| **API Keys** | Secure per-chatbot API keys for widget authentication |
| **Multi-Tenant** | Each registered business gets a fully isolated workspace |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3.2.3 |
| **Database** | PostgreSQL 16 + pgvector (vector similarity search) |
| **Cache** | Redis 7 |
| **AI** | OpenAI GPT-4o-mini (chat) + text-embedding-ada-002 (embeddings) |
| **Frontend** | Angular 17, Angular Material |
| **Widget** | Vanilla TypeScript, bundled with esbuild |
| **Auth** | JWT (15-min access token + 7-day refresh token) |
| **Migrations** | Flyway (9 migrations, auto-runs on startup) |

---

## Quick Start (Local)

### Prerequisites

- Java 21
- Node.js 18+
- Docker Desktop (for Postgres + Redis)

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Start backend

```bash
cd backend
export OPENAI_API_KEY=sk-...
mvn spring-boot:run
# Runs on http://localhost:8081
```

### 3. Start frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:4200
```

### 4. Open the app

Go to `http://localhost:4200`, register an account, and start building chatbots.

---

## Project Structure

```
chat-bots/
├── backend/           Java Spring Boot API (port 8081)
├── frontend/          Angular dashboard — admin UI (port 4200)
├── widget/            Embeddable JS widget for customer websites
├── docker-compose.yml Local dev infrastructure (Postgres + Redis)
└── docs/              Architecture, deployment, and API reference
```

---

## Documentation

| Document | What it covers |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, component diagram, data flow, RAG pipeline |
| [Development Guide](docs/DEVELOPMENT.md) | Local setup, project conventions, how to add features |
| [API Reference](docs/API.md) | All REST endpoints with request/response examples |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production EC2 deployment steps |

---

## Deployment

BotForge runs on AWS EC2 (`m5a.large`, Ubuntu 24.04).

- **Dashboard**: `http://13.233.44.37:8444`
- **API Base**: `http://13.233.44.37:8444/api/v1`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment guide.
