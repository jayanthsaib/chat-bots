# Qbot — System Architecture

This document explains how Qbot is built, how its components fit together, and how data flows through the system.

---

## High-Level Overview

Qbot is a **multi-tenant SaaS platform**. Each business that registers gets their own isolated tenant. Their chatbots, knowledge, conversations, and leads are all scoped to their tenant ID.

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                           │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
   ┌───────▼──────┐      ┌────────▼────────┐
   │  Admin UI    │      │  Customer Site  │
   │  (Angular)   │      │  + JS Widget    │
   │  Port 4200   │      │  (any website)  │
   └───────┬──────┘      └────────┬────────┘
           │                      │
           └──────────┬───────────┘
                      │  HTTP / SSE
              ┌───────▼────────┐
              │  Spring Boot   │
              │  REST API      │
              │  Port 8081     │
              └───────┬────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
   ┌──────▼─────┐  ┌──▼────┐  ┌──▼──────┐
   │ PostgreSQL │  │ Redis │  │ OpenAI  │
   │ + pgvector │  │ Cache │  │  API    │
   └────────────┘  └───────┘  └─────────┘
```

---

## Components

### 1. Angular Dashboard (frontend/)

The admin interface used by business owners to:
- Register / log in
- Create and configure chatbots
- Upload knowledge sources (PDF, URL, text, FAQ)
- Test their chatbot in a live chat window
- View conversations and captured leads
- Generate embed codes and API keys

**Key design decisions:**
- Angular 17 standalone components (no NgModules)
- Angular Material for UI components
- Auth interceptor automatically attaches JWT to every HTTP request
- SSE (Server-Sent Events) uses the native `fetch` API directly to bypass Angular's HTTP proxy buffering

---

### 2. Spring Boot API (backend/)

The core of the platform. Handles all business logic, AI orchestration, and data persistence.

**Package structure:**

```
com.infectbyte.botforge/
├── api/              REST controllers + request/response DTOs
│   ├── auth/         Login, register, refresh token
│   ├── chat/         Start session, stream AI response, capture lead
│   ├── chatbot/      CRUD for chatbots, embed code, API keys
│   ├── conversation/ List and resolve conversations
│   ├── knowledge/    Add/delete knowledge sources
│   └── lead/         List and update leads
├── ai/               AI pipeline
│   ├── OpenAIClient      HTTP calls to OpenAI (embeddings + chat)
│   ├── EmbeddingService  Converts text → float[] vector
│   ├── IngestionPipeline Orchestrates knowledge ingestion
│   ├── RAGService        Retrieves context + builds prompts
│   ├── TextChunker       Splits documents into overlapping chunks
│   └── TextExtractor     Parses PDF, HTML, plain text
├── domain/           JPA entities + Spring Data repositories
│   ├── chatbot/      Chatbot configuration
│   ├── conversation/ Conversation + Message entities
│   ├── knowledge/    KnowledgeSource + KnowledgeChunk (with vector)
│   ├── lead/         Captured visitor leads
│   ├── tenant/       Tenant (one per registered business)
│   ├── user/         User accounts
│   └── apikey/       Per-chatbot API keys
├── config/           Security, CORS, JWT filters, async executor
└── common/           Shared exceptions, ApiResponse wrapper, TenantContext
```

---

### 3. Embeddable Widget (widget/)

A self-contained JavaScript bundle that any website can include to show a chat bubble. It:
- Authenticates using a per-chatbot API key
- Calls `/api/v1/chat/start` to get a session
- Streams AI responses via SSE from `/api/v1/chat/message`
- Optionally shows a lead capture form

---

### 4. PostgreSQL + pgvector

Stores all application data. The `pgvector` extension enables storing and searching 1536-dimensional embedding vectors for semantic search.

**Schema overview (9 Flyway migrations):**

| Table | Purpose |
|---|---|
| `tenants` | One row per registered business |
| `users` | Login accounts, linked to a tenant |
| `chatbots` | Bot config (name, personality, widget settings) |
| `knowledge_sources` | A uploaded document, URL, or text block |
| `knowledge_chunks` | Document split into ~500-token pieces + their embeddings |
| `conversations` | A single chat session (visitor ↔ bot) |
| `messages` | Individual messages within a conversation |
| `leads` | Visitor contact info collected by a bot |
| `api_keys` | Hashed keys for widget authentication |

---

### 5. Redis

Used for:
- Rate limiting (Bucket4j token buckets per tenant)
- Session/token caching (future use)

---

## Multi-Tenancy

Every API request goes through `TenantContext`, which reads the tenant ID from the JWT and stores it in a `ThreadLocal`. All database queries automatically filter by `tenant_id`.

```
Request → JwtAuthFilter → TenantContext.set(tenantId) → Controller → Repository (scoped query)
```

The widget uses API key authentication instead of JWT. The `ApiKeyAuthFilter` resolves the tenant from the API key.

---

## RAG Pipeline (How AI Responses Work)

RAG = **Retrieval-Augmented Generation**. Instead of the AI answering from general knowledge, it first searches the chatbot's knowledge base and includes relevant content in its prompt.

### Knowledge Ingestion (one-time, when you add content)

```
User uploads PDF / URL / text
         │
         ▼
   TextExtractor         — extracts plain text from PDF, HTML, etc.
         │
         ▼
   TextChunker           — splits into ~500-token chunks with 50-token overlap
         │
         ▼
   EmbeddingService      — calls OpenAI text-embedding-ada-002 per chunk
         │                  returns float[1536] vector
         ▼
   KnowledgeChunk saved  — stored in Postgres with the vector column
```

### Chat Response (every message)

```
User sends message
         │
         ▼
   EmbeddingService      — embed the user's question → float[1536]
         │
         ▼
   pgvector cosine search — find top-5 most similar knowledge chunks
         │
         ▼
   RAGService            — builds system prompt:
                           "You are [bot personality].
                            Use this context: [top-5 chunks]
                            Answer the user's question."
         │
         ▼
   OpenAIClient.streamChat() — streams GPT-4o-mini response token by token
         │
         ▼
   ChatController        — writes each token as SSE event to HTTP response
         │
         ▼
   Frontend              — appends tokens to the bot message bubble in real time
```

---

## Authentication Flow

```
Register → Tenant created → User created → JWT issued
                                               │
                              ┌────────────────┴────────────────┐
                              │ access_token (15 min)           │
                              │ refresh_token (7 days)          │
                              └─────────────────────────────────┘

Every API call:
  Authorization: Bearer <access_token>
       │
  JwtAuthFilter validates → sets TenantContext + SecurityContext
```

When the access token expires, the frontend calls `/auth/refresh` with the refresh token to get a new access token without re-login.

---

## SSE Streaming Architecture

Chat responses are streamed token-by-token using Server-Sent Events (SSE).

**Why SSE instead of WebSocket?**
- SSE is one-directional (server → client) which is all we need for streaming AI tokens
- Works over standard HTTP, no connection upgrade needed
- Simpler to proxy through Nginx

**Key implementation detail:**
The backend uses Java's `HttpClient` to call OpenAI (blocking, line-by-line read) wrapped in `Flux.create(...).subscribeOn(Schedulers.boundedElastic())`. This runs the blocking I/O on a dedicated thread pool, while the Tomcat request thread writes tokens directly to `HttpServletResponse` using `PrintWriter.flush()` per token.

```
OpenAI SSE stream
       │  (Java HttpClient, blocking read on boundedElastic thread)
       ▼
  Flux<String> tokens
       │  (toIterable() blocks Tomcat thread)
       ▼
  PrintWriter.write("data:{token}\n\n")
  PrintWriter.flush()   ← sends bytes immediately, no buffering
       │
       ▼
  Nginx (proxy_buffering off)
       │
       ▼
  Browser fetch() ReadableStream
       │
       ▼
  Angular component appends token to message bubble
```
