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

  const data = (await response.json()) as { access_token: string };
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

  const data = (await response.json()) as { display_phone_number: string };
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

  const data = (await response.json()) as { messages: { id: string }[] };
  return data.messages[0].id;
}
