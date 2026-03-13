import { Router, Request, Response } from 'express';
import prisma from '../db';
import { sendTextMessage, sendInteractiveMessage } from '../services/whatsapp';

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

    console.log('[conversations.GET] returning', result.length, 'conversations');
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

    console.log('[conversations.GET messages] conversationId:', conversationId, 'message count:', messages.length);
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
    const { content, type, interactive } = req.body;
    console.log('[conversations.POST message] conversationId:', conversationId, 'type:', type || 'text', 'content:', content);

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

    let waMessageId: string;
    let messageType: 'text' | 'interactive' = 'text';
    let metadata: any = null;
    let messageContent = content;

    if (type === 'interactive' && interactive) {
      // Send interactive message
      waMessageId = await sendInteractiveMessage(
        account.phoneNumberId,
        account.accessToken,
        conversation.waId,
        interactive
      );
      messageType = 'interactive';
      metadata = interactive;
      messageContent = interactive.body?.text || content || '[Interactive message]';
      console.log('[conversations.POST message] interactive waMessageId:', waMessageId);
    } else {
      // Send text message (default)
      if (!content) {
        res.status(400).json({ error: 'content is required' });
        return;
      }
      waMessageId = await sendTextMessage(
        account.phoneNumberId,
        account.accessToken,
        conversation.waId,
        content
      );
      console.log('[conversations.POST message] text waMessageId:', waMessageId);
    }

    // Store outbound message
    const message = await prisma.message.create({
      data: {
        conversationId,
        waMessageId,
        direction: 'outbound',
        type: messageType,
        content: messageContent,
        metadata,
        status: 'sent',
        timestamp: new Date(),
      },
    });
    console.log('[conversations.POST message] stored message:', JSON.stringify(message));

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
