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
