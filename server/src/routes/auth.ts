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
