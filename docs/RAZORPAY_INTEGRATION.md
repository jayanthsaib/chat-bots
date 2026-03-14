# Razorpay Integration Plan

This document explains what will be built, why, and how — before any code is written.

---

## Goal

Allow users to subscribe to a paid plan (Starter, Growth, Pro) using Razorpay. The platform enforces usage limits based on their active plan.

---

## Pricing Plans

| Plan | Price | Chatbots | Messages/month | Knowledge Sources |
|---|---|---|---|---|
| **Free** | ₹0 | 1 | 100 | 3 |
| **Starter** | ₹999/month | 2 | 1,000 | 10 |
| **Growth** | ₹2,499/month | 5 | 5,000 | 30 |
| **Pro** | ₹4,999/month | Unlimited | Unlimited | Unlimited |

---

## How Razorpay Subscriptions Work

Razorpay has a **Subscriptions API** that handles recurring billing automatically.

```
User clicks "Subscribe"
        │
        ▼
Backend creates a Razorpay Subscription
(links to a Razorpay Plan ID)
        │
        ▼
Frontend opens Razorpay checkout popup
(user enters card/UPI details)
        │
        ▼
User completes payment
        │
        ▼
Razorpay calls our webhook (POST /api/v1/payments/webhook)
        │
        ▼
Backend verifies signature → activates plan on tenant
        │
        ▼
Every month Razorpay auto-charges and fires webhook again
```

---

## What Will Be Built

### 1. Database — new migration `V10__create_subscriptions.sql`

Two new tables:

**`plans`** — stores the plan definitions
```
id, name, price_inr, max_bots, max_messages_per_month,
max_knowledge_sources, razorpay_plan_id
```

**`subscriptions`** — tracks each tenant's active subscription
```
id, tenant_id, plan_id, razorpay_subscription_id,
status (active/cancelled/past_due), current_period_start,
current_period_end, created_at
```

---

### 2. Backend — new package `api/payment/`

| Class | What it does |
|---|---|
| `PaymentController` | REST endpoints for subscription actions |
| `PaymentService` | Business logic — create subscription, handle webhook |
| `RazorpayClient` | HTTP calls to Razorpay API |
| `RazorpayProperties` | Config: key_id, key_secret, webhook_secret |
| `SubscriptionRepository` | DB access for subscriptions |
| `PlanRepository` | DB access for plans |

**New endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/plans` | List all available plans |
| `POST` | `/api/v1/payments/subscribe` | Create a Razorpay subscription, return checkout details |
| `POST` | `/api/v1/payments/webhook` | Razorpay webhook (public, signature-verified) |
| `GET` | `/api/v1/payments/subscription` | Get current tenant's subscription status |
| `POST` | `/api/v1/payments/cancel` | Cancel subscription |

---

### 3. Usage Enforcement — `UsageLimitService`

Checks plan limits before allowing actions. Called inside existing services:

| Action | Where limit is checked |
|---|---|
| Create chatbot | `ChatbotService.createChatbot()` |
| Send chat message | `ChatService.streamResponse()` |
| Add knowledge source | `KnowledgeService` |

If limit exceeded → throws `PlanLimitExceededException` → returns HTTP 402 with upgrade message.

**Monthly message counter** stored in Redis:
```
key:   usage:{tenantId}:messages:{yyyy-mm}
value: integer count
TTL:   60 days
```

---

### 4. Frontend — updates to existing pages

**Pricing page** (`pricing.component.ts`)
- "Subscribe" button calls `/api/v1/payments/subscribe`
- Opens Razorpay checkout popup using `razorpay.open()`
- Shows current plan with "Active" badge

**New: Billing page** (`features/billing/`)
- Shows current plan, renewal date, usage stats (bots used, messages this month)
- Cancel subscription button
- Upgrade/downgrade plan buttons

**Dashboard** — add usage bar showing messages used vs. plan limit

---

### 5. Razorpay Setup (one-time, done in Razorpay dashboard)

Before the code works, these need to be created in the Razorpay dashboard:

1. Create 3 **Plans** (Razorpay Plans API or dashboard):
   - `plan_starter` — ₹999, monthly interval
   - `plan_growth` — ₹2,499, monthly interval
   - `plan_pro` — ₹4,999, monthly interval

2. Copy the **Plan IDs** and add them to the database seed

3. Set up a **Webhook** in Razorpay dashboard pointing to:
   `http://13.233.44.37:8444/api/v1/payments/webhook`

   Subscribe to these events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.halted` (payment failed)

4. Copy **Key ID**, **Key Secret**, and **Webhook Secret** into `botforge.env`

---

## New Environment Variables

```bash
# Add to /home/ubuntu/botforge/botforge.env on EC2
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

```yaml
# Add to application.yml
botforge:
  razorpay:
    key-id: ${RAZORPAY_KEY_ID:}
    key-secret: ${RAZORPAY_KEY_SECRET:}
    webhook-secret: ${RAZORPAY_WEBHOOK_SECRET:}
```

---

## Webhook Security

Razorpay signs every webhook with HMAC-SHA256. Before processing any webhook:

```
expected = HMAC-SHA256(webhook_secret, raw_request_body)
actual   = X-Razorpay-Signature header

if expected != actual → reject with 400
```

This ensures only Razorpay can trigger plan changes, not anyone who discovers the endpoint.

---

## Implementation Order

1. `V10__create_subscriptions.sql` — DB schema
2. `RazorpayProperties` + `application.yml` config
3. `RazorpayClient` — API calls
4. `PaymentService` + `PaymentController` — subscribe + webhook
5. `UsageLimitService` — enforce limits in existing services
6. Seed plan data (insert Razorpay plan IDs into `plans` table)
7. Frontend — pricing page subscribe button + billing page
8. Test with Razorpay test keys end-to-end
9. Switch to live keys + deploy

---

## What is NOT in scope (for now)

- Proration when upgrading mid-cycle (Razorpay handles this automatically)
- Invoice emails (Razorpay sends these automatically)
- Annual billing discount
- Coupon codes
