import { Router, Request, Response } from 'express';
import prisma from '../db';
import { getMessageTemplates, sendTemplateMessage } from '../services/whatsapp';

const router = Router();

// List approved templates
router.get('/api/templates', async (_req: Request, res: Response) => {
  try {
    const account = await prisma.account.findFirst();
    if (!account) {
      res.status(400).json({ error: 'No account configured' });
      return;
    }

    const templates = await getMessageTemplates(account.wabaId, account.accessToken);
    console.log('[templates.GET] returning', templates.length, 'approved templates');
    res.json(templates);
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Send a template message
router.post('/api/templates/send', async (req: Request, res: Response) => {
  try {
    const { conversationId, templateName, languageCode, components } = req.body;
    console.log('[templates.POST send] conversationId:', conversationId, 'templateName:', templateName);

    if (!conversationId || !templateName || !languageCode) {
      res.status(400).json({ error: 'conversationId, templateName, and languageCode are required' });
      return;
    }

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

    const waMessageId = await sendTemplateMessage(
      account.phoneNumberId,
      account.accessToken,
      conversation.waId,
      templateName,
      languageCode,
      components
    );
    console.log('[templates.POST send] waMessageId:', waMessageId);

    // Build readable content from template name and components
    let content = `[Template: ${templateName}]`;
    if (components) {
      const bodyComponent = components.find((c: any) => c.type === 'body');
      if (bodyComponent?.parameters) {
        const params = bodyComponent.parameters.map((p: any) => p.text || '').join(', ');
        content += ` ${params}`;
      }
    }

    const metadata = {
      templateName,
      languageCode,
      components: components || null,
    };

    const message = await prisma.message.create({
      data: {
        conversationId,
        waMessageId,
        direction: 'outbound',
        type: 'template',
        content,
        metadata,
        status: 'sent',
        timestamp: new Date(),
      },
    });
    console.log('[templates.POST send] stored message:', JSON.stringify(message));

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    res.json(message);
  } catch (error) {
    console.error('Send template error:', error);
    res.status(500).json({ error: 'Failed to send template' });
  }
});

export default router;
