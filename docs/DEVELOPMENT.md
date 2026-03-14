# BotForge — Development Guide

This guide covers everything you need to develop BotForge locally — setup, project conventions, how to add new features, and the development workflow.

---

## Local Development Setup

### Requirements

| Tool | Version | Purpose |
|---|---|---|
| Java (JDK) | 21 | Backend runtime |
| Maven | 3.9+ | Backend build tool |
| Node.js | 18+ | Frontend build |
| Docker Desktop | Any recent | Runs Postgres + Redis locally |

---

### Step-by-Step Setup

#### 1. Clone the repo

```bash
git clone <repo-url>
cd chat-bots
```

#### 2. Start the database and cache

```bash
docker compose up -d postgres redis
```

This starts:
- PostgreSQL on port `5433` (not 5432, to avoid conflicts with any local Postgres)
- Redis on port `6379`

Flyway runs all 9 migrations automatically when the backend starts.

#### 3. Set your OpenAI API key

The backend needs an OpenAI API key for embeddings and chat.

**Option A — Environment variable (recommended):**
```bash
export OPENAI_API_KEY=sk-...
```

**Option B — Edit application.yml directly (dev only, never commit):**
```yaml
botforge:
  openai:
    api-key: sk-...
```

#### 4. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8081`. Watch the logs — Flyway will print which migrations ran.

#### 5. Start the frontend

```bash
cd frontend
npm install   # first time only
npm start
```

The dashboard opens at `http://localhost:4200`. The Angular dev server proxies `/api/*` to `localhost:8081`, so you don't need to deal with CORS.

---

## Environment Variables (Backend)

All config lives in `backend/src/main/resources/application.yml`. Sensitive values are read from environment variables with defaults for local dev.

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | *(none)* | Required. Your OpenAI key |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/botforge` | DB connection |
| `SPRING_DATASOURCE_USERNAME` | `botforge` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `botforge_secret` | DB password |
| `SPRING_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `dev-secret-key-...` | JWT signing key — change in production |
| `UPLOAD_DIR` | `./uploads` | Where uploaded files are stored |

---

## Project Conventions

### Backend

**Package naming:** Feature-first, not layer-first.
```
api/chat/       — controller + service + DTOs all together
domain/chatbot/ — entity + repository together
```

**API responses:** Every endpoint returns `ApiResponse<T>`:
```json
{ "success": true, "data": {...} }
{ "success": false, "message": "Error description" }
```

**Multi-tenancy:** Never query without a tenant scope. Use `TenantContext.getTenantId()` in every controller method. Repositories should always include `tenantId` in queries.

**Error handling:** Throw `ResourceNotFoundException` or `BusinessException` — `GlobalExceptionHandler` converts them to proper HTTP responses automatically.

**Adding a new API endpoint:**
1. Add entity + repository in `domain/<feature>/`
2. Add Flyway migration `V<n>__description.sql` in `resources/db/migration/`
3. Add controller + service + DTOs in `api/<feature>/`
4. Register the endpoint pattern in `SecurityConfig` if it's public

---

### Frontend

**Component structure:** All components are standalone (no NgModules). Import what you need directly in the component's `imports: []` array.

**API calls:** All HTTP calls go through `ApiService` (`core/services/api.service.ts`). Add new methods there rather than calling `HttpClient` directly in components.

**SSE streaming:** Use the `fetch` API directly (not Angular's `HttpClient`) for SSE endpoints. The Angular proxy buffers SSE responses — use `environment.streamUrl` which points directly to the backend (`http://localhost:8081/api/v1` in dev).

**State management:** No NgRx. Components load their own data in `ngOnInit()` and store it in local properties. Keep it simple.

---

## Development Workflow

### Typical feature development

```
1. Create DB migration  →  V<n>__create_table.sql
2. Create entity        →  domain/<feature>/<Entity>.java
3. Create repository   →  domain/<feature>/<Entity>Repository.java
4. Create service       →  api/<feature>/<Feature>Service.java
5. Create controller   →  api/<feature>/<Feature>Controller.java
6. Create Angular UI   →  frontend/src/app/features/<feature>/
7. Add API method      →  frontend/src/app/core/services/api.service.ts
```

### Running tests

```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```

### Building for production

```bash
# Backend — creates target/botforge-0.0.1-SNAPSHOT.jar
cd backend
mvn package -DskipTests

# Frontend — creates dist/botforge-frontend/browser/
cd frontend
npm run build -- --configuration production
```

---

## Database Migrations

BotForge uses **Flyway** for database migrations. Flyway runs automatically when the Spring Boot app starts and applies any new migration files.

**Rules:**
- Migration files live in `backend/src/main/resources/db/migration/`
- Name format: `V<number>__description_with_underscores.sql` (e.g. `V10__add_widget_theme.sql`)
- **Never edit an existing migration** — it will break Flyway's checksum validation. Always add a new migration to alter existing tables.
- Always include `tenant_id UUID` on any new table that holds tenant-specific data

**Current migrations:**

| File | What it creates |
|---|---|
| V1 | `tenants` table, enables `pgvector` and `pgcrypto` extensions |
| V2 | `users` table |
| V3 | `chatbots` table |
| V4 | `knowledge_sources` + `knowledge_chunks` (with vector column) |
| V5 | `conversations` + `messages` |
| V6 | `leads` |
| V7 | `api_keys` |
| V8 | `analytics` |
| V9 | Indexes for performance |

---

## Common Issues

**"Port 8081 already in use"**
```bash
# On Windows
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess -Force"
# On Mac/Linux
lsof -ti:8081 | xargs kill -9
```

**"Cannot connect to database"**
```bash
# Make sure Docker is running the containers
docker compose ps
docker compose up -d postgres redis
```

**"Flyway migration failed"**
- Check the migration file for SQL errors
- If you edited an existing migration, revert it and create a new one instead
- To reset local dev DB: `docker compose down -v && docker compose up -d`

**"Bot responses not streaming (empty bubble)"**
- The Angular dev proxy buffers SSE. The `environment.ts` uses `streamUrl: 'http://localhost:8081/api/v1'` to bypass it. Make sure `sendChatMessage()` in `api.service.ts` uses `streamBase`, not `base`.

**"OpenAI errors in logs"**
- Verify your `OPENAI_API_KEY` is set and valid
- Check you have credits on your OpenAI account
