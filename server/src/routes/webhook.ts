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
