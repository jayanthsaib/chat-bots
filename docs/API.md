# Qbot — API Reference

All endpoints are under the base path `/api/v1`.

**Authentication:** Include `Authorization: Bearer <access_token>` on every request except the auth endpoints.

**Response format:** Every endpoint returns:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Auth

### POST /auth/register
Register a new business account. Creates a tenant + user.

**Request:**
```json
{
  "businessName": "Acme Corp",
  "fullName": "John Smith",
  "email": "john@acme.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "fullName": "John Smith",
    "email": "john@acme.com"
  }
}
```

---

### POST /auth/login

**Request:**
```json
{ "email": "john@acme.com", "password": "SecurePass123!" }
```

**Response:** Same as register.

---

### POST /auth/refresh
Get a new access token using a refresh token.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response:** Same as register.

---

## Chatbots

### GET /chatbots
List all chatbots for the authenticated tenant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Support Bot",
      "status": "active",
      "language": "en",
      "widgetColor": "#4F46E5",
      "welcomeMessage": "Hi! How can I help?",
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### POST /chatbots
Create a new chatbot.

**Request:**
```json
{
  "name": "Support Bot",
  "description": "Handles customer support queries",
  "personality": "You are a helpful support agent for Acme Corp. Be friendly and concise.",
  "welcomeMessage": "Hi! How can I help you today?",
  "language": "en",
  "widgetColor": "#4F46E5",
  "collectLead": true,
  "leadTrigger": "after_3_messages"
}
```

---

### GET /chatbots/{id}
Get a single chatbot by ID.

---

### PUT /chatbots/{id}
Update chatbot settings. Send only the fields you want to change.

---

### DELETE /chatbots/{id}
Delete a chatbot and all its knowledge, conversations, and leads.

---

### GET /chatbots/{id}/embed
Get the HTML embed code snippet for this chatbot.

**Response:**
```json
{
  "success": true,
  "data": {
    "embedCode": "<script src=\"...\" data-bot-id=\"...\" data-api-key=\"...\"></script>"
  }
}
```

---

### POST /chatbots/{id}/api-key
Generate a new API key for this chatbot (used in the embed widget).

**Query param:** `label` (optional, default: "Default")

**Response:**
```json
{
  "success": true,
  "data": { "apiKey": "bf_live_abc123..." }
}
```

> **Important:** The raw API key is only shown once. Store it immediately.

---

## Knowledge Base

### GET /chatbots/{id}/knowledge
List all knowledge sources for a chatbot.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Product Manual",
      "sourceType": "document",
      "status": "ready",
      "chunkCount": 42,
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

**Source types:** `text`, `faq`, `document`, `website_url`
**Statuses:** `processing`, `ready`, `failed`

---

### POST /chatbots/{id}/knowledge/text
Add plain text as a knowledge source.

**Request:**
```json
{
  "title": "Refund Policy",
  "content": "We offer a 30-day money-back guarantee..."
}
```

---

### POST /chatbots/{id}/knowledge/faq
Add FAQ pairs as a knowledge source.

**Request:**
```json
{
  "title": "Common Questions",
  "faqs": [
    { "question": "What are your hours?", "answer": "We're open 9am-6pm Mon-Fri." },
    { "question": "Do you offer refunds?", "answer": "Yes, 30-day money-back." }
  ]
}
```

---

### POST /chatbots/{id}/knowledge/url
Scrape a webpage and add its content as a knowledge source.

**Request:**
```json
{ "url": "https://yoursite.com/about", "title": "About Page" }
```

---

### POST /chatbots/{id}/knowledge/upload
Upload a PDF or TXT file. Use `multipart/form-data`.

```
form-data:
  file: <file binary>
```

Max file size: **10MB**. Supported formats: `.pdf`, `.txt`

---

### DELETE /chatbots/{id}/knowledge/{sourceId}
Delete a knowledge source and all its chunks.

---

## Chat

These endpoints are used by both the Test Chat in the dashboard and the embeddable widget.

### POST /chat/start
Start a new chat session.

**Request:**
```json
{
  "botId": "uuid",
  "channel": "web"
}
```

Or authenticate with an API key and omit `botId` (the key is linked to a specific chatbot).

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "welcomeMessage": "Hi! How can I help?",
    "chatbotId": "uuid"
  }
}
```

---

### POST /chat/message
Send a message and stream the AI response as Server-Sent Events.

**Request:**
```json
{
  "sessionId": "sess_abc123",
  "message": "What is your refund policy?",
  "channel": "web"
}
```

**Response:** `text/event-stream`

Each SSE event is a JSON object on a `data:` line:

```
data:{"token":"Our"}

data:{"token":" refund"}

data:{"token":" policy"}

data:{"token":" is"}

data:{"token":" 30"}

data:{"token":" days."}

data:{"type":"done","lead_prompt":false}
```

When `lead_prompt` is `true`, the client should show a lead capture form.

---

### GET /chat/{sessionId}/history
Get the full message history for a session.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "role": "user", "content": "Hello", "createdAt": "..." },
    { "id": "uuid", "role": "assistant", "content": "Hi! How can I help?", "createdAt": "..." }
  ]
}
```

---

### POST /chat/{sessionId}/lead
Submit lead info collected from a visitor.

**Request:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890"
}
```

---

## Conversations

### GET /conversations
Paginated list of all conversations across all chatbots.

**Query params:** `page` (default 0), `size` (default 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "sessionId": "sess_abc123",
        "channel": "web",
        "status": "open",
        "visitorIp": "1.2.3.4",
        "lastMessageAt": "2024-01-01T12:00:00",
        "messageCount": 5
      }
    ],
    "totalElements": 42,
    "totalPages": 3,
    "page": 0,
    "size": 20
  }
}
```

**Statuses:** `open`, `resolved`

---

### GET /conversations/{id}
Get a single conversation with all its messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": { "id": "uuid", "status": "open", ... },
    "messages": [
      { "role": "user", "content": "Hello", "createdAt": "..." },
      { "role": "assistant", "content": "Hi!", "createdAt": "..." }
    ]
  }
}
```

---

### PUT /conversations/{id}/resolve
Mark a conversation as resolved.

---

## Leads

### GET /leads
Paginated list of all captured leads.

**Query params:** `page` (default 0), `size` (default 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "status": "new",
        "source": "web",
        "createdAt": "2024-01-01T12:00:00"
      }
    ],
    "totalElements": 10,
    "totalPages": 1
  }
}
```

**Lead statuses:** `new`, `contacted`, `qualified`, `lost`

---

### PUT /leads/{id}
Update a lead's status or notes.

**Request:**
```json
{
  "status": "contacted",
  "notes": "Called on Jan 2nd, interested in Pro plan"
}
```

---

## Error Codes

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — invalid input |
| `401` | Unauthorized — missing or expired JWT |
| `403` | Forbidden — you don't own this resource |
| `404` | Resource not found |
| `429` | Rate limit exceeded (60 req/min per tenant) |
| `500` | Internal server error |

All errors follow the same format:
```json
{ "success": false, "message": "Chatbot not found with id: abc123" }
```
