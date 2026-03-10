# Chatty — WhatsApp Cloud API Chatbot Platform

## Overview

Chatty is a single-tenant WhatsApp Cloud API chatbot platform. It provides a web interface for onboarding a WhatsApp Business phone number via Embedded Signup and an inbox for viewing and replying to conversations.

## Architecture

Two components deployed as separate Render services:

**Client (React + TypeScript)** — Render Static Site with two screens:
1. Setup screen — Launches Meta's Embedded Signup to onboard a phone number.
2. Inbox screen — Displays conversations and messages with reply capability.

**Server (Node.js + Express + TypeScript)** — Render Web Service that:
- Hosts the WhatsApp Cloud API webhook (receives incoming messages).
- Exposes REST endpoints for the frontend.
- Handles the Embedded Signup callback.
- Stores all data in Render-managed PostgreSQL via Prisma ORM.

## Data Flow

1. User completes Embedded Signup -> server receives auth code -> exchanges for system user access token -> stores credentials -> subscribes the app to the WABA (`POST /{waba-id}/subscribed_apps`) -> registers the phone number (`POST /{phone-number-id}/register`).
2. Customer sends WhatsApp message -> Meta calls webhook -> server stores message in DB.
3. Frontend polls server every 3 seconds for new messages.
4. User types reply in inbox -> frontend POSTs to server -> server calls WhatsApp Cloud API to send message -> stores outbound message in DB.

## Database Schema

### accounts

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| business_id | string | Meta Business portfolio ID |
| waba_id | string | WhatsApp Business Account ID |
| phone_number_id | string | Registered phone number ID |
| display_phone_number | string | The actual phone number for display |
| access_token | string | System user access token |
| created_at | timestamp | |
| updated_at | timestamp | |

### conversations

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| wa_id | string (unique) | Customer's WhatsApp number |
| profile_name | string (nullable) | Customer's profile name |
| last_message_at | timestamp | For sorting by recency |
| created_at | timestamp | |

### messages

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| conversation_id | FK -> conversations | |
| wa_message_id | string (unique) | WhatsApp message ID (deduplication) |
| direction | enum: inbound, outbound | |
| content | text | Message body (text only) |
| status | string (nullable) | sent, delivered, read |
| timestamp | timestamp | WhatsApp's original timestamp |
| created_at | timestamp | |

Text messages only — no media support.

## API Endpoints

### REST API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/signup-complete | Receives auth code, exchanges for token, stores account, subscribes app, registers phone |
| GET | /api/account | Returns current account info (checks if setup is complete) |
| GET | /api/conversations | Lists conversations ordered by last_message_at desc |
| GET | /api/conversations/:id/messages | Returns messages for a conversation |
| POST | /api/conversations/:id/messages | Sends a reply via Cloud API, stores outbound message |

### Webhook

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /webhook | Verification challenge — validates hub.verify_token against WEBHOOK_VERIFY_TOKEN |
| POST | /webhook | Receives inbound messages and status updates from Meta |

Webhook payload handling:
- Messages: extracted from `entry[].changes[].value.messages[]`. Upsert conversation by wa_id, insert message, update last_message_at.
- Statuses: extracted from `entry[].changes[].value.statuses[]`. Update matching message's status field.
- Always returns 200 immediately.

## Frontend Screens

### Setup (route: /)

- If no account exists, show setup screen.
- Sets up a session logging message event listener (`window.addEventListener('message', ...)`) for the `WA_EMBEDDED_SIGNUP` event to capture `business_id`, `waba_id`, and `phone_number_id`.
- "Connect WhatsApp" button launches `FB.login()` with scopes: `business_management`, `whatsapp_business_management`, `whatsapp_business_messaging`.
- On success, POSTs auth code + business_id + waba_id + phone_number_id to `/api/auth/signup-complete`.
- Redirects to inbox on completion.
- Config values `META_APP_ID` and `EMBEDDED_SIGNUP_CONFIG_ID` passed as build-time environment variables.

### Inbox (route: /inbox)

- If no account exists, redirects to `/`.
- Two-panel layout:
  - Left panel: conversation list (profile name or phone number, last message preview, timestamp). Sorted by most recent.
  - Right panel: message thread (inbound left, outbound right chat bubbles). Text input + send button.
- Polls `/api/conversations` every 3 seconds.
- Polls `/api/conversations/:id/messages` every 3 seconds for selected conversation.
- Optimistic append on send.

## Project Structure

```
chatty/
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── Setup.tsx
│       │   └── Inbox.tsx
│       ├── components/
│       ├── hooks/
│       └── api/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── routes/
│       │   ├── webhook.ts
│       │   ├── auth.ts
│       │   ├── account.ts
│       │   └── conversations.ts
│       ├── services/
│       └── db/
│           ├── connection.ts
│           └── migrations/
└── docs/
    └── plans/
```

## Deployment (Render)

**Static Site (client/):**
- Build: `cd client && npm install && npm run build`
- Publish directory: `client/dist`

**Web Service (server/):**
- Build: `cd server && npm install && npm run build`
- Start: `npm start`
- Env vars: `DATABASE_URL`, `META_APP_ID`, `META_APP_SECRET`, `EMBEDDED_SIGNUP_CONFIG_ID`, `WEBHOOK_VERIFY_TOKEN`

## Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| META_APP_ID | client + server | Meta App ID for Embedded Signup and API calls |
| META_APP_SECRET | server | Used to exchange auth code for access token |
| EMBEDDED_SIGNUP_CONFIG_ID | client | Configuration ID for Embedded Signup flow |
| WEBHOOK_VERIFY_TOKEN | server | Secret token to verify webhook registration |
| DATABASE_URL | server | PostgreSQL connection string (Render internal) |
