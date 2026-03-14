# BotForge — Project Working Flow

## 1. Overview

**BotForge** is a multi-tenant SaaS platform that lets businesses build, train, and deploy AI-powered chatbots on their websites. It supports lead capture, conversation management, and a knowledge base trained via RAG (Retrieval Augmented Generation).

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17, Angular Material, RxJS |
| Backend | Spring Boot 3.2.3 (Java 21) |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| AI | OpenAI (gpt-4o-mini + text-embedding-ada-002) |
| Widget | Vanilla TypeScript (no framework) |
| Infrastructure | Docker Compose |

---

## 2. Project Structure

```
chat-bots/
├── frontend/          # Angular 17 dashboard (port 4200)
├── backend/           # Spring Boot REST API (port 8080)
├── widget/            # Embeddable chat widget (compiled to JS)
├── docker-compose.yml # Local dev environment
└── work_flow.md       # This file
```

---

## 3. Authentication Flow

### 3.1 Registration

```
User fills form (businessName, fullName, email, password)
  ↓
POST /api/v1/auth/register
  ↓
Backend:
  - Validates email uniqueness
  - Generates slug from business name
  - Creates Tenant record (organization)
  - Creates User record (role: admin, BCrypt password)
  ↓
Returns: { accessToken, refreshToken, userId, tenantId, ... }
  ↓
Frontend stores tokens in localStorage
  ↓
Redirect → /dashboard
```

### 3.2 Login

```
User enters email + password
  ↓
POST /api/v1/auth/login
  ↓
Backend:
  - Finds User by email
  - Verifies password with BCrypt
  - Loads Tenant
  ↓
Returns: JWT access token (15 min) + refresh token (7 days)
  ↓
Frontend stores in localStorage, navigates to /dashboard
```

### 3.3 JWT Token Usage

- Every API request from the dashboard includes:
  `Authorization: Bearer {accessToken}`
- `JwtAuthFilter` validates the token and sets `TenantContext` (ThreadLocal)
- All DB queries are automatically filtered by `tenantId`

### 3.4 Widget Authentication (API Key)

- Format: `bf_live_` + 32 random URL-safe characters
- Stored as: `keyPrefix` (first 16 chars, plain) + `keyHash` (BCrypt)
- Widget sends: `X-API-Key: bf_live_xxx...` on every request
- `ApiKeyAuthFilter` validates and sets tenant context

---

## 4. Multi-Tenancy

Every entity (`Chatbot`, `Conversation`, `Lead`, `KnowledgeSource`) extends `TenantAwareEntity` which holds a `tenantId` field. All queries are scoped to the authenticated tenant — no data leaks between customers.

---

## 5. Chatbot Creation Flow

```
Dashboard user opens /chatbots/new
  ↓
Multi-step Wizard (4 steps):
  Step 1 → Name, description, language
  Step 2 → Personality, welcome message, fallback message
  Step 3 → Lead capture settings (toggle + trigger timing)
  Step 4 → Widget color and position
  ↓
POST /api/v1/chatbots
  ↓
Backend creates Chatbot record (status: draft)
  ↓
Redirect to /chatbots/{id} (detail page)
```

### Chatbot Config Fields

| Field | Description |
|---|---|
| `name` | Display name |
| `personality` | System prompt / instructions for AI |
| `language` | en, es, fr, de, pt |
| `welcomeMessage` | First message shown to visitor |
| `fallbackMessage` | Shown when AI cannot answer |
| `widgetColor` | Hex color for chat bubble |
| `widgetPosition` | bottom-right / bottom-left |
| `collectLead` | Enable lead capture form |
| `leadTrigger` | after_3_messages / after_5_messages / immediate |
| `handoffEnabled` | Allow human agent takeover |
| `status` | draft / published |

---

## 6. Knowledge Base Flow

Users train their chatbot by adding knowledge sources. The pipeline runs asynchronously.

### 6.1 Supported Sources

| Type | How |
|---|---|
| Plain Text | Paste text content |
| FAQ | Structured Q&A pairs |
| PDF Upload | Extracted via Apache PDFBox |
| Website URL | HTML scraped via JSoup |

### 6.2 Ingestion Pipeline

```
User adds source via /chatbots/{id}/knowledge/*
  ↓
KnowledgeSource record created (status: pending)
  ↓
IngestionPipeline (async thread pool):
  1. Extract text (PDF → PDFBox, URL → JSoup, text → direct)
  2. Sanitize (remove special chars, normalize whitespace)
  3. Chunk into ~500-token pieces with overlap
  4. Embed each chunk via OpenAI text-embedding-ada-002 → float[1536]
  5. Save KnowledgeChunk records with pgvector column
  ↓
Status updates: pending → processing → indexed (or failed)
```

### 6.3 Vector Search (RAG)

During a chat conversation:

```
User sends message
  ↓
Embed user message (same embedding model)
  ↓
pgvector similarity search:
  SELECT * FROM knowledge_chunks
  WHERE chatbot_id = ?
  ORDER BY embedding <-> query_vector
  LIMIT 5
  ↓
Top-5 most relevant chunks injected into system prompt
  ↓
OpenAI receives: system prompt + knowledge context + chat history
```

---

## 7. Widget Deployment Flow

### 7.1 Generate API Key

```
Dashboard → /chatbots/{id} → Deploy tab
  ↓
Click "Generate API Key"
  ↓
POST /api/v1/chatbots/{id}/api-key
  ↓
Returns full key ONCE — user must copy it
  ↓
Backend stores: keyPrefix + BCrypt hash
```

### 7.2 Embed Code

```
GET /api/v1/chatbots/{id}/embed

Returns HTML snippet:
  <script>
    window.BotForgeConfig = {
      apiKey: "bf_live_xxx...",
      botId: "uuid"
    };
  </script>
  <script src="http://localhost:8080/widget/botforge-widget.min.js" async></script>
```

User pastes this into their website's HTML — the chatbot appears automatically.

---

## 8. Live Chat / Conversation Flow

### 8.1 Visitor Starts Chat

```
Visitor loads website with embed code
  ↓
Widget JS loads from /widget/botforge-widget.min.js
  ↓
Widget reads window.BotForgeConfig (apiKey)
  ↓
Checks localStorage for existing sessionId
  ↓
If none → POST /api/v1/chat/start
  Headers: X-API-Key
  Body: { botId, channel: "web" }
  ↓
Server creates Conversation record, returns { sessionId, welcomeMessage }
  ↓
Widget displays welcome message in chat panel
```

### 8.2 Visitor Sends a Message (Streaming)

```
Visitor types → clicks Send
  ↓
POST /api/v1/chat/message
  Headers: X-API-Key
  Body: { sessionId, message, channel: "web" }
  ↓
Backend (ChatService):
  1. Find Conversation by sessionId
  2. Sanitize input (prevent prompt injection)
  3. Save Message record (role: user)
  4. Fetch last 10 messages (conversation history)
  5. RAGService.buildSystemPrompt():
       - Embed user query
       - Vector search → top 5 knowledge chunks
       - Build system prompt with context
  6. OpenAIClient.streamChat() → gpt-4o-mini
  ↓
Response: Server-Sent Events (SSE) stream
  data: {"token": "Hello"}\n\n
  data: {"token": " there"}\n\n
  ...
  data: {"type": "done", "lead_prompt": true}\n\n
  ↓
Widget parses SSE tokens → appends to message in real-time
  ↓
On "done" event:
  - If lead_prompt=true → show lead capture form
  - Save complete assistant Message to DB
```

### 8.3 Lead Capture

```
After 3 messages (configurable) → lead form appears in widget
  ↓
Visitor fills: Name, Email, Phone
  ↓
POST /api/v1/chat/{sessionId}/lead
  Body: { fullName, email, phone }
  ↓
Backend creates Lead record:
  - chatbotId, conversationId
  - fullName, email, phone
  - source: "web"
  - status: "new"
  ↓
Lead appears in dashboard → /leads
```

---

## 9. Dashboard Pages

| Route | Purpose |
|---|---|
| `/dashboard` | Overview: stats, recent conversations, recent leads |
| `/chatbots` | List all chatbots |
| `/chatbots/new` | Multi-step creation wizard |
| `/chatbots/:id` | Detail: Knowledge Base, Deploy, Settings tabs |
| `/conversations` | Inbox: list + full conversation view with resolve action |
| `/leads` | Table of captured leads with status management |
| `/pricing` | Pricing plans (Starter / Growth / Pro) |

---

## 10. Leads Management

```
Lead statuses: new → contacted → converted / lost

Dashboard /leads:
  - View all leads (name, email, phone, source, status, date)
  - Update status inline (dropdown)
  - Add notes per lead
  - Links back to conversation

API:
  GET  /api/v1/leads         - paginated list
  PUT  /api/v1/leads/{id}    - update status + notes
```

---

## 11. Conversation Management

```
Dashboard /conversations (split-panel view):
  Left:  List of all conversations (sorted by last message)
  Right: Selected conversation with all messages

Actions:
  - View full message history
  - Mark as resolved (PUT /api/v1/conversations/{id}/resolve)

Conversation states: open → resolved / handed_off
```

---

## 12. Pricing Plans

| Plan | Price | Features |
|---|---|---|
| Starter | ₹999/month | Website chatbot, 500 messages |
| Growth | ₹1999/month | Website + WhatsApp, analytics (popular) |
| Pro | ₹3999/month | Unlimited messages, advanced AI, all channels |

---

## 13. Database Schema (Key Tables)

```
tenants          → Organization accounts
users            → Admin users per tenant
chatbots         → Bot configurations
api_keys         → Widget authentication keys
conversations    → Chat sessions with visitors
messages         → Individual chat messages
leads            → Captured visitor contact info
knowledge_sources → Uploaded content (PDF, URL, text)
knowledge_chunks → Vector embeddings (pgvector float[1536])
```

---

## 14. API Endpoints Summary

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Chatbots
```
GET    /api/v1/chatbots
POST   /api/v1/chatbots
GET    /api/v1/chatbots/{id}
PUT    /api/v1/chatbots/{id}
DELETE /api/v1/chatbots/{id}
GET    /api/v1/chatbots/{id}/embed
POST   /api/v1/chatbots/{id}/api-key
```

### Knowledge Base
```
GET    /api/v1/chatbots/{id}/knowledge
POST   /api/v1/chatbots/{id}/knowledge/text
POST   /api/v1/chatbots/{id}/knowledge/faq
POST   /api/v1/chatbots/{id}/knowledge/upload
POST   /api/v1/chatbots/{id}/knowledge/url
DELETE /api/v1/chatbots/{id}/knowledge/{sourceId}
```

### Chat (Widget)
```
POST   /api/v1/chat/start
POST   /api/v1/chat/message         (SSE streaming)
GET    /api/v1/chat/{sessionId}/history
POST   /api/v1/chat/{sessionId}/lead
```

### Conversations
```
GET    /api/v1/conversations
GET    /api/v1/conversations/{id}
PUT    /api/v1/conversations/{id}/resolve
```

### Leads
```
GET    /api/v1/leads
PUT    /api/v1/leads/{id}
```

---

## 15. Local Development Setup

### Prerequisites
- Java 21
- Node.js 18+
- Docker Desktop

### Start Backend + DB
```bash
# From project root
docker-compose up -d
```

### Start Frontend
```bash
cd frontend
npm install
npm start
# Opens at http://localhost:4200
```

### Build Widget
```bash
cd widget
npm install
npm run build
# Output: backend/src/main/resources/static/widget/botforge-widget.min.js
```

### Environment Variables (docker-compose)
```
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

---

## 16. Current Git Branch

Active development branch: `claude/general-session-VWZdz`
