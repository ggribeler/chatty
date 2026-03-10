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
router.get('/api/conversations/:id/messages', async (req: Request<{ id: string }>, res: Response) => {
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
router.post('/api/conversations/:id/messages', async (req: Request<{ id: string }>, res: Response) => {
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
