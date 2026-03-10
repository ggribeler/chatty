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
    console.log('[auth.signup-complete] received body:', JSON.stringify({ code, businessId, wabaId, phoneNumberId }));

    if (!code || !businessId || !wabaId || !phoneNumberId) {
      console.log('[auth.signup-complete] validation failed, received:', JSON.stringify(req.body));
      res.status(400).json({ error: 'Missing required fields: code, businessId, wabaId, phoneNumberId' });
      return;
    }

    // 1. Exchange code for access token
    console.log('[auth.signup-complete] step 1: exchanging code for token...');
    const accessToken = await exchangeCodeForToken(code);
    console.log('[auth.signup-complete] step 1 complete, accessToken:', accessToken);

    // 2. Subscribe app to WABA
    console.log('[auth.signup-complete] step 2: subscribing app to WABA...');
    await subscribeApp(wabaId, accessToken);
    console.log('[auth.signup-complete] step 2 complete');

    // 3. Register phone number
    console.log('[auth.signup-complete] step 3: registering phone number...');
    await registerPhoneNumber(phoneNumberId, accessToken);
    console.log('[auth.signup-complete] step 3 complete');

    // 4. Get phone number display info
    console.log('[auth.signup-complete] step 4: getting phone number details...');
    const { displayPhoneNumber } = await getPhoneNumberDetails(phoneNumberId, accessToken);
    console.log('[auth.signup-complete] step 4 complete, displayPhoneNumber:', displayPhoneNumber);

    // 5. Store account
    console.log('[auth.signup-complete] step 5: storing account in DB...');
    const account = await prisma.account.create({
      data: {
        businessId,
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        accessToken,
      },
    });
    console.log('[auth.signup-complete] step 5 complete, stored account:', JSON.stringify(account));

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
