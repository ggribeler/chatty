# Chatty Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use 10x-engineer:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-tenant WhatsApp Cloud API chatbot platform with Embedded Signup onboarding and a conversation inbox.

**Architecture:** Monorepo with separate `client/` (React + TypeScript, Vite) and `server/` (Node.js + Express + TypeScript) packages. Server connects to Render PostgreSQL via Prisma ORM. Frontend polls server every 3 seconds for new messages.

**Tech Stack:** React, Vite, TypeScript, Express, Prisma, PostgreSQL, Facebook JS SDK, WhatsApp Cloud API

---

## Task Dependencies

Tasks in the same parallel group can be worked on concurrently.
Tasks with dependencies must wait for their prerequisites.

| Task | Parallel Group | Depends On | Files Touched |
|------|---------------|------------|---------------|
| 1: Root setup + git | A | — | `.gitignore` |
| 2: Server scaffolding | B | Task 1 | `server/package.json`, `server/tsconfig.json`, `server/src/index.ts` |
| 3: Client scaffolding | B | Task 1 | `client/` (Vite scaffold) |
| 4: Prisma schema + DB | C | Task 2 | `server/prisma/schema.prisma` |
| 5: Webhook routes | D | Task 4 | `server/src/routes/webhook.ts`, `server/src/index.ts` |
| 6: WhatsApp service | D | Task 4 | `server/src/services/whatsapp.ts` |
| 7: Auth route | E | Tasks 5, 6 | `server/src/routes/auth.ts`, `server/src/index.ts` |
| 8: Account route | E | Task 4 | `server/src/routes/account.ts`, `server/src/index.ts` |
| 9: Conversations routes | E | Task 6 | `server/src/routes/conversations.ts`, `server/src/index.ts` |
| 10: Client API layer | F | Task 3 | `client/src/api/client.ts` |
| 11: Setup page | G | Task 10 | `client/src/pages/Setup.tsx`, `client/public/index.html`, `client/src/App.tsx` |
| 12: Inbox page | G | Task 10 | `client/src/pages/Inbox.tsx`, `client/src/App.tsx`, `client/src/components/`, `client/src/hooks/` |
| 13: Final integration + commit | H | Tasks 7-12 | — |

**Parallel execution:** Tasks 2+3 (Group B) run simultaneously. Tasks 5+6 (Group D) run simultaneously. Tasks 7+8+9 (Group E) run simultaneously. Tasks 11+12 (Group G) run simultaneously.

---

### Task 1: Root setup + git

**Parallel group:** A

**Files:**
- Create: `.gitignore`

**Step 1: Create root .gitignore**

```gitignore
node_modules/
dist/
.env
*.log
```

Write this to `.gitignore` in the repo root.

**Step 2: Commit**

```bash
git add .gitignore docs/
git commit -m "docs: add project design and gitignore"
```

---

### Task 2: Server scaffolding

**Parallel group:** B — Depends on Task 1

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`

**Step 1: Initialize server package**

```bash
cd server && npm init -y
```

Then update `server/package.json` to set:

```json
{
  "name": "chatty-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Step 2: Install dependencies**

```bash
cd server && npm install express cors dotenv && npm install -D typescript ts-node-dev @types/express @types/cors @types/node
```

**Step 3: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create server/src/index.ts**

Minimal Express server with health check:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 5: Verify it runs**

```bash
cd server && npx ts-node-dev src/index.ts
```

Expected: `Server running on port 3001`. Kill the process after confirming.

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: scaffold server with Express and TypeScript"
```

---

### Task 3: Client scaffolding

**Parallel group:** B — Depends on Task 1

**Files:**
- Create: `client/` (entire Vite scaffold)

**Step 1: Scaffold React + TypeScript with Vite**

```bash
npm create vite@latest client -- --template react-ts
```

**Step 2: Install dependencies**

```bash
cd client && npm install react-router-dom && npm install
```

**Step 3: Clean up default Vite files**

Remove default boilerplate from `client/src/App.tsx`, `client/src/App.css`, and `client/src/index.css`. Replace `App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div>Chatty</div>;
}

export default App;
```

Clear `App.css` and `index.css` to empty files (keep them for later use).

**Step 4: Verify it runs**

```bash
cd client && npm run dev
```

Expected: Vite dev server starts, shows "Chatty" in browser. Kill the process after confirming.

**Step 5: Commit**

```bash
git add client/
git commit -m "feat: scaffold client with Vite, React, and TypeScript"
```

---

### Task 4: Prisma schema + database

**Parallel group:** C — Depends on Task 2

**Files:**
- Create: `server/prisma/schema.prisma`

**Step 1: Install Prisma**

```bash
cd server && npm install @prisma/client && npm install -D prisma
```

**Step 2: Initialize Prisma**

```bash
cd server && npx prisma init
```

This creates `server/prisma/schema.prisma` and `server/.env`.

**Step 3: Write the schema**

Replace `server/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                  Int      @id @default(autoincrement())
  businessId          String   @map("business_id")
  wabaId              String   @map("waba_id")
  phoneNumberId       String   @map("phone_number_id")
  displayPhoneNumber  String   @map("display_phone_number")
  accessToken         String   @map("access_token")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("accounts")
}

model Conversation {
  id            Int       @id @default(autoincrement())
  waId          String    @unique @map("wa_id")
  profileName   String?   @map("profile_name")
  lastMessageAt DateTime  @map("last_message_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  messages      Message[]

  @@map("conversations")
}

enum MessageDirection {
  inbound
  outbound
}

model Message {
  id             Int              @id @default(autoincrement())
  conversationId Int              @map("conversation_id")
  waMessageId    String           @unique @map("wa_message_id")
  direction      MessageDirection
  content        String
  status         String?
  timestamp      DateTime
  createdAt      DateTime         @default(now()) @map("created_at")

  conversation   Conversation     @relation(fields: [conversationId], references: [id])

  @@map("messages")
}
```

**Step 4: Set up a local DATABASE_URL for development**

Add to `server/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/chatty?schema=public"
```

Note: Replace with your actual local Postgres credentials or use Render's external connection string. This `.env` is gitignored.

**Step 5: Generate Prisma client**

```bash
cd server && npx prisma generate
```

Expected: `Prisma Client` generated successfully.

**Step 6: Create a db helper module**

Create `server/src/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

**Step 7: Commit**

```bash
git add server/prisma/schema.prisma server/src/db.ts server/package.json server/package-lock.json
git commit -m "feat: add Prisma schema with accounts, conversations, and messages models"
```

---

### Task 5: Webhook routes

**Parallel group:** D — Depends on Task 4

**Files:**
- Create: `server/src/routes/webhook.ts`
- Modify: `server/src/index.ts`

**Step 1: Create server/src/routes/webhook.ts**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// Webhook verification
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages and status updates
router.post('/webhook', async (req: Request, res: Response) => {
  // Always return 200 immediately
  res.sendStatus(200);

  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            if (message.type !== 'text') continue;

            const contactInfo = value.contacts?.[0];
            const waId = message.from;
            const profileName = contactInfo?.profile?.name || null;

            // Upsert conversation
            const conversation = await prisma.conversation.upsert({
              where: { waId },
              update: {
                profileName,
                lastMessageAt: new Date(parseInt(message.timestamp) * 1000),
              },
              create: {
                waId,
                profileName,
                lastMessageAt: new Date(parseInt(message.timestamp) * 1000),
              },
            });

            // Insert message (ignore duplicates)
            await prisma.message.upsert({
              where: { waMessageId: message.id },
              update: {},
              create: {
                conversationId: conversation.id,
                waMessageId: message.id,
                direction: 'inbound',
                content: message.text.body,
                timestamp: new Date(parseInt(message.timestamp) * 1000),
              },
            });
          }
        }

        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await prisma.message.updateMany({
              where: { waMessageId: status.id },
              data: { status: status.status },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

export default router;
```

**Step 2: Register webhook routes in server/src/index.ts**

Add after `app.use(express.json())`:

```typescript
import webhookRoutes from './routes/webhook';

app.use('/', webhookRoutes);
```

**Step 3: Commit**

```bash
git add server/src/routes/webhook.ts server/src/index.ts
git commit -m "feat: add webhook routes for message reception and status updates"
```

---

### Task 6: WhatsApp service

**Parallel group:** D — Depends on Task 4

**Files:**
- Create: `server/src/services/whatsapp.ts`

**Step 1: Create server/src/services/whatsapp.ts**

This module wraps the WhatsApp Cloud API and the Embedded Signup token exchange:

```typescript
const GRAPH_API_URL = 'https://graph.facebook.com/v22.0';

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_URL}/oauth/access_token` +
    `?client_id=${process.env.META_APP_ID}` +
    `&client_secret=${process.env.META_APP_SECRET}` +
    `&code=${code}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function subscribeApp(wabaId: string, accessToken: string): Promise<void> {
  const response = await fetch(
    `${GRAPH_API_URL}/${wabaId}/subscribed_apps`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`App subscription failed: ${error}`);
  }
}

export async function registerPhoneNumber(phoneNumberId: string, accessToken: string): Promise<void> {
  const response = await fetch(
    `${GRAPH_API_URL}/${phoneNumberId}/register`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: '123456',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Phone registration failed: ${error}`);
  }
}

export async function getPhoneNumberDetails(
  phoneNumberId: string,
  accessToken: string
): Promise<{ displayPhoneNumber: string }> {
  const response = await fetch(
    `${GRAPH_API_URL}/${phoneNumberId}?fields=display_phone_number`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Phone number fetch failed: ${error}`);
  }

  const data = await response.json();
  return { displayPhoneNumber: data.display_phone_number };
}

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_URL}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Send message failed: ${error}`);
  }

  const data = await response.json();
  return data.messages[0].id;
}
```

**Step 2: Commit**

```bash
git add server/src/services/whatsapp.ts
git commit -m "feat: add WhatsApp Cloud API service (token exchange, subscribe, register, send)"
```

---

### Task 7: Auth route

**Parallel group:** E — Depends on Tasks 5, 6

**Files:**
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/index.ts`

**Step 1: Create server/src/routes/auth.ts**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../db';
import {
  exchangeCodeForToken,
  subscribeApp,
  registerPhoneNumber,
  getPhoneNumberDetails,
} from '../services/whatsapp';

const router = Router();

router.post('/api/auth/signup-complete', async (req: Request, res: Response) => {
  try {
    const { code, businessId, wabaId, phoneNumberId } = req.body;

    if (!code || !businessId || !wabaId || !phoneNumberId) {
      res.status(400).json({ error: 'Missing required fields: code, businessId, wabaId, phoneNumberId' });
      return;
    }

    // 1. Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // 2. Subscribe app to WABA
    await subscribeApp(wabaId, accessToken);

    // 3. Register phone number
    await registerPhoneNumber(phoneNumberId, accessToken);

    // 4. Get phone number display info
    const { displayPhoneNumber } = await getPhoneNumberDetails(phoneNumberId, accessToken);

    // 5. Store account
    const account = await prisma.account.create({
      data: {
        businessId,
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        accessToken,
      },
    });

    res.json({
      id: account.id,
      businessId: account.businessId,
      wabaId: account.wabaId,
      phoneNumberId: account.phoneNumberId,
      displayPhoneNumber: account.displayPhoneNumber,
    });
  } catch (error) {
    console.error('Signup complete error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

export default router;
```

**Step 2: Register auth routes in server/src/index.ts**

Add import and `app.use('/', authRoutes);`

```typescript
import authRoutes from './routes/auth';

app.use('/', authRoutes);
```

**Step 3: Commit**

```bash
git add server/src/routes/auth.ts server/src/index.ts
git commit -m "feat: add auth route for Embedded Signup completion flow"
```

---

### Task 8: Account route

**Parallel group:** E — Depends on Task 4

**Files:**
- Create: `server/src/routes/account.ts`
- Modify: `server/src/index.ts`

**Step 1: Create server/src/routes/account.ts**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

router.get('/api/account', async (_req: Request, res: Response) => {
  try {
    const account = await prisma.account.findFirst();

    if (!account) {
      res.json({ exists: false });
      return;
    }

    res.json({
      exists: true,
      id: account.id,
      businessId: account.businessId,
      wabaId: account.wabaId,
      phoneNumberId: account.phoneNumberId,
      displayPhoneNumber: account.displayPhoneNumber,
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

export default router;
```

**Step 2: Register account routes in server/src/index.ts**

Add import and `app.use('/', accountRoutes);`

```typescript
import accountRoutes from './routes/account';

app.use('/', accountRoutes);
```

**Step 3: Commit**

```bash
git add server/src/routes/account.ts server/src/index.ts
git commit -m "feat: add account route to check onboarding status"
```

---

### Task 9: Conversations routes

**Parallel group:** E — Depends on Task 6

**Files:**
- Create: `server/src/routes/conversations.ts`
- Modify: `server/src/index.ts`

**Step 1: Create server/src/routes/conversations.ts**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../db';
import { sendTextMessage } from '../services/whatsapp';

const router = Router();

// List all conversations
router.get('/api/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const result = conversations.map((c) => ({
      id: c.id,
      waId: c.waId,
      profileName: c.profileName,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0]?.content || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/api/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a reply
router.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Get conversation and account
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const account = await prisma.account.findFirst();

    if (!account) {
      res.status(400).json({ error: 'No account configured' });
      return;
    }

    // Send via WhatsApp Cloud API
    const waMessageId = await sendTextMessage(
      account.phoneNumberId,
      account.accessToken,
      conversation.waId,
      content
    );

    // Store outbound message
    const message = await prisma.message.create({
      data: {
        conversationId,
        waMessageId,
        direction: 'outbound',
        content,
        status: 'sent',
        timestamp: new Date(),
      },
    });

    // Update conversation's last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
```

**Step 2: Register conversations routes in server/src/index.ts**

Add import and `app.use('/', conversationsRoutes);`

```typescript
import conversationsRoutes from './routes/conversations';

app.use('/', conversationsRoutes);
```

**Step 3: Commit**

```bash
git add server/src/routes/conversations.ts server/src/index.ts
git commit -m "feat: add conversations routes (list, messages, send reply)"
```

---

### Task 10: Client API layer

**Parallel group:** F — Depends on Task 3

**Files:**
- Create: `client/src/api/client.ts`

**Step 1: Create client/src/api/client.ts**

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export interface Account {
  exists: boolean;
  id?: number;
  businessId?: string;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
}

export interface Conversation {
  id: number;
  waId: string;
  profileName: string | null;
  lastMessageAt: string;
  lastMessage: string | null;
}

export interface Message {
  id: number;
  conversationId: number;
  waMessageId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: string | null;
  timestamp: string;
  createdAt: string;
}

export const api = {
  getAccount: () => request<Account>('/api/account'),

  completeSignup: (data: {
    code: string;
    businessId: string;
    wabaId: string;
    phoneNumberId: string;
  }) =>
    request<Account>('/api/auth/signup-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getConversations: () => request<Conversation[]>('/api/conversations'),

  getMessages: (conversationId: number) =>
    request<Message[]>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, content: string) =>
    request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
```

**Step 2: Commit**

```bash
git add client/src/api/client.ts
git commit -m "feat: add API client with types for all server endpoints"
```

---

### Task 11: Setup page

**Parallel group:** G — Depends on Task 10

**Files:**
- Modify: `client/public/index.html`
- Create: `client/src/pages/Setup.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Add Facebook JS SDK to client/public/index.html**

Add before the closing `</body>` tag (or in the `<head>` if Vite uses `index.html` differently — check the file first):

```html
<script async defer crossorigin="anonymous"
  src="https://connect.facebook.net/en_US/sdk.js">
</script>
```

**Step 2: Create client/src/pages/Setup.tsx**

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

declare global {
  interface Window {
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code: string } }) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean; extras: { setup: object; featureType: string; sessionInfoVersion: number } }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

export default function Setup() {
  const navigate = useNavigate();
  const signupDataRef = useRef<{
    businessId: string;
    wabaId: string;
    phoneNumberId: string;
  } | null>(null);

  // Listen for WA_EMBEDDED_SIGNUP event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          const { business_id, waba_id, phone_number_id } = data.data;
          signupDataRef.current = {
            businessId: business_id,
            wabaId: waba_id,
            phoneNumberId: phone_number_id,
          };
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v22.0',
      });
    };
  }, []);

  const handleLogin = useCallback(() => {
    window.FB.login(
      async (response) => {
        if (response.authResponse?.code && signupDataRef.current) {
          try {
            await api.completeSignup({
              code: response.authResponse.code,
              ...signupDataRef.current,
            });
            navigate('/inbox');
          } catch (error) {
            console.error('Signup failed:', error);
          }
        }
      },
      {
        config_id: import.meta.env.VITE_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: 2,
        },
      }
    );
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Chatty</h1>
      <p>Connect your WhatsApp Business account to get started.</p>
      <button onClick={handleLogin} style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}>
        Connect WhatsApp
      </button>
    </div>
  );
}
```

**Step 3: Update client/src/App.tsx with routing**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Setup from './pages/Setup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

Note: The Inbox route will be added in Task 12.

**Step 4: Commit**

```bash
git add client/src/pages/Setup.tsx client/src/App.tsx client/public/index.html
git commit -m "feat: add Setup page with Embedded Signup and WA_EMBEDDED_SIGNUP listener"
```

---

### Task 12: Inbox page

**Parallel group:** G — Depends on Task 10

**Files:**
- Create: `client/src/pages/Inbox.tsx`
- Create: `client/src/components/ConversationList.tsx`
- Create: `client/src/components/MessageThread.tsx`
- Create: `client/src/components/MessageInput.tsx`
- Create: `client/src/hooks/usePolling.ts`
- Modify: `client/src/App.tsx`

**Step 1: Create client/src/hooks/usePolling.ts**

```typescript
import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
```

**Step 2: Create client/src/components/ConversationList.tsx**

```tsx
import { Conversation } from '../api/client';

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <div style={{ width: '300px', borderRight: '1px solid #ddd', overflowY: 'auto', height: '100vh' }}>
      <h2 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #ddd' }}>Conversations</h2>
      {conversations.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: selectedId === c.id ? '#e3f2fd' : 'transparent',
            borderBottom: '1px solid #eee',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{c.profileName || c.waId}</div>
          <div style={{ fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.lastMessage || 'No messages'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(c.lastMessageAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Create client/src/components/MessageThread.tsx**

```tsx
import { Message } from '../api/client';

interface Props {
  messages: Message[];
}

export default function MessageThread({ messages }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            alignSelf: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
            backgroundColor: m.direction === 'outbound' ? '#dcf8c6' : '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '8px 12px',
            maxWidth: '60%',
          }}
        >
          <div>{m.content}</div>
          <div style={{ fontSize: '11px', color: '#999', textAlign: 'right', marginTop: '4px' }}>
            {new Date(m.timestamp).toLocaleTimeString()}
            {m.direction === 'outbound' && m.status ? ` · ${m.status}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Create client/src/components/MessageInput.tsx**

```tsx
import { useState } from 'react';

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '12px', borderTop: '1px solid #ddd', gap: '8px' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
      />
      <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Send
      </button>
    </form>
  );
}
```

**Step 5: Create client/src/pages/Inbox.tsx**

```tsx
import { useState, useCallback } from 'react';
import { api, Conversation, Message } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import ConversationList from '../components/ConversationList';
import MessageThread from '../components/MessageThread';
import MessageInput from '../components/MessageInput';

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Poll conversations every 3 seconds
  usePolling(
    useCallback(() => {
      api.getConversations().then(setConversations).catch(console.error);
    }, []),
    3000
  );

  // Poll messages for selected conversation every 3 seconds
  usePolling(
    useCallback(() => {
      if (selectedId) {
        api.getMessages(selectedId).then(setMessages).catch(console.error);
      }
    }, [selectedId]),
    3000
  );

  const handleSelect = (id: number) => {
    setSelectedId(id);
    api.getMessages(id).then(setMessages).catch(console.error);
  };

  const handleSend = async (content: string) => {
    if (!selectedId) return;

    // Optimistic append
    const optimisticMessage: Message = {
      id: Date.now(),
      conversationId: selectedId,
      waMessageId: `temp-${Date.now()}`,
      direction: 'outbound',
      content,
      status: 'sending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await api.sendMessage(selectedId, content);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedId ? (
          <>
            <MessageThread messages={messages} />
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#999' }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 6: Add Inbox route to client/src/App.tsx**

Update App.tsx to include the Inbox route:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import Setup from './pages/Setup';
import Inbox from './pages/Inbox';

function App() {
  const [accountExists, setAccountExists] = useState<boolean | null>(null);

  useEffect(() => {
    api.getAccount()
      .then((account) => setAccountExists(account.exists))
      .catch(() => setAccountExists(false));
  }, []);

  if (accountExists === null) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={accountExists ? <Navigate to="/inbox" /> : <Setup />} />
        <Route path="/inbox" element={accountExists ? <Inbox /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 7: Commit**

```bash
git add client/src/pages/Inbox.tsx client/src/components/ client/src/hooks/ client/src/App.tsx
git commit -m "feat: add Inbox page with conversation list, message thread, and polling"
```

---

### Task 13: Final integration + commit

**Parallel group:** H — Depends on Tasks 7-12

**Files:**
- Modify: `server/src/index.ts` (final state verification)

**Step 1: Verify final server/src/index.ts has all routes registered**

Ensure `server/src/index.ts` looks like this:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import webhookRoutes from './routes/webhook';
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import conversationsRoutes from './routes/conversations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', webhookRoutes);
app.use('/', authRoutes);
app.use('/', accountRoutes);
app.use('/', conversationsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 2: Add server build script for Prisma**

Update `server/package.json` build script to generate Prisma client before compiling:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "npx prisma generate && tsc",
    "start": "node dist/index.js"
  }
}
```

**Step 3: Create server/.env.example**

```
DATABASE_URL=postgresql://user:password@localhost:5432/chatty?schema=public
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

**Step 4: Create client/.env.example**

```
VITE_API_URL=http://localhost:3001
VITE_META_APP_ID=your_meta_app_id
VITE_EMBEDDED_SIGNUP_CONFIG_ID=your_config_id
```

**Step 5: Verify both services build**

```bash
cd server && npm run build
cd ../client && npm run build
```

Expected: Both compile without errors.

**Step 6: Commit and push**

```bash
git add .
git commit -m "feat: finalize project structure with env examples and build config"
git branch -M main
git push -u origin main
```
