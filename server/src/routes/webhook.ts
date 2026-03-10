import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// Webhook verification
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[webhook.GET] mode:', mode);
  console.log('[webhook.GET] token:', token);
  console.log('[webhook.GET] challenge:', challenge);

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook.GET] verification PASSED');
    res.status(200).send(challenge);
  } else {
    console.log('[webhook.GET] verification FAILED');
    res.sendStatus(403);
  }
});

// Receive messages and status updates
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('[webhook.POST] full body:', JSON.stringify(req.body));

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
            if (message.type !== 'text') {
              console.log('[webhook.POST] skipping non-text message, type:', message.type);
              continue;
            }

            const contactInfo = value.contacts?.[0];
            const waId = message.from;
            const profileName = contactInfo?.profile?.name || null;

            console.log('[webhook.POST] incoming message — waId:', waId, 'messageId:', message.id, 'type:', message.type, 'content:', message.text.body);

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
            console.log('[webhook.POST] conversation upsert result:', JSON.stringify(conversation));

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
            console.log('[webhook.POST] status update — messageId:', status.id, 'status:', status.status);
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
