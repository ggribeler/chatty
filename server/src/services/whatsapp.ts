const GRAPH_API_URL = 'https://graph.facebook.com/v25.0';

export async function exchangeCodeForToken(code: string): Promise<string> {
  console.log('[whatsapp.exchangeCodeForToken] code:', code);
  const url = `${GRAPH_API_URL}/oauth/access_token` +
    `?client_id=${process.env.META_APP_ID}` +
    `&client_secret=${process.env.META_APP_SECRET}` +
    `&code=${code}`;
  console.log('[whatsapp.exchangeCodeForToken] URL:', url);

  const response = await fetch(url);
  console.log('[whatsapp.exchangeCodeForToken] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.exchangeCodeForToken] error response:', error);
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  console.log('[whatsapp.exchangeCodeForToken] access_token:', data.access_token);
  return data.access_token;
}

export async function subscribeApp(wabaId: string, accessToken: string): Promise<void> {
  const url = `${GRAPH_API_URL}/${wabaId}/subscribed_apps`;
  console.log('[whatsapp.subscribeApp] wabaId:', wabaId);
  console.log('[whatsapp.subscribeApp] URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('[whatsapp.subscribeApp] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.subscribeApp] error response:', error);
    throw new Error(`App subscription failed: ${error}`);
  }

  const body = await response.json();
  console.log('[whatsapp.subscribeApp] response body:', JSON.stringify(body));
}

export async function registerPhoneNumber(phoneNumberId: string, accessToken: string): Promise<void> {
  const url = `${GRAPH_API_URL}/${phoneNumberId}/register`;
  const requestBody = {
    messaging_product: 'whatsapp',
    pin: '123456',
  };
  console.log('[whatsapp.registerPhoneNumber] phoneNumberId:', phoneNumberId);
  console.log('[whatsapp.registerPhoneNumber] URL:', url);
  console.log('[whatsapp.registerPhoneNumber] request body:', JSON.stringify(requestBody));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  console.log('[whatsapp.registerPhoneNumber] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.registerPhoneNumber] error response:', error);
    throw new Error(`Phone registration failed: ${error}`);
  }

  const body = await response.json();
  console.log('[whatsapp.registerPhoneNumber] response body:', JSON.stringify(body));
}

export async function getPhoneNumberDetails(
  phoneNumberId: string,
  accessToken: string
): Promise<{ displayPhoneNumber: string }> {
  const url = `${GRAPH_API_URL}/${phoneNumberId}?fields=display_phone_number`;
  console.log('[whatsapp.getPhoneNumberDetails] phoneNumberId:', phoneNumberId);
  console.log('[whatsapp.getPhoneNumberDetails] URL:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('[whatsapp.getPhoneNumberDetails] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.getPhoneNumberDetails] error response:', error);
    throw new Error(`Phone number fetch failed: ${error}`);
  }

  const data = (await response.json()) as { display_phone_number: string };
  console.log('[whatsapp.getPhoneNumberDetails] response body:', JSON.stringify(data));
  return { displayPhoneNumber: data.display_phone_number };
}

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<string> {
  const url = `${GRAPH_API_URL}/${phoneNumberId}/messages`;
  const requestBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };
  console.log('[whatsapp.sendTextMessage] phoneNumberId:', phoneNumberId);
  console.log('[whatsapp.sendTextMessage] to:', to);
  console.log('[whatsapp.sendTextMessage] text:', text);
  console.log('[whatsapp.sendTextMessage] URL:', url);
  console.log('[whatsapp.sendTextMessage] request body:', JSON.stringify(requestBody));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  console.log('[whatsapp.sendTextMessage] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.sendTextMessage] error response:', error);
    throw new Error(`Send message failed: ${error}`);
  }

  const data = (await response.json()) as { messages: { id: string }[] };
  console.log('[whatsapp.sendTextMessage] response body:', JSON.stringify(data));
  const waMessageId = data.messages[0].id;
  console.log('[whatsapp.sendTextMessage] waMessageId:', waMessageId);
  return waMessageId;
}

export async function getMessageTemplates(
  wabaId: string,
  accessToken: string
): Promise<any[]> {
  const url = `${GRAPH_API_URL}/${wabaId}/message_templates?fields=id,name,language,status,category,components`;
  console.log('[whatsapp.getMessageTemplates] wabaId:', wabaId);
  console.log('[whatsapp.getMessageTemplates] URL:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('[whatsapp.getMessageTemplates] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.getMessageTemplates] error response:', error);
    throw new Error(`Fetch templates failed: ${error}`);
  }

  const data = (await response.json()) as { data: any[] };
  console.log('[whatsapp.getMessageTemplates] total templates:', data.data.length);
  const approved = data.data.filter((t: any) => t.status === 'APPROVED');
  console.log('[whatsapp.getMessageTemplates] approved templates:', approved.length);
  return approved;
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string,
  components?: any[]
): Promise<string> {
  const url = `${GRAPH_API_URL}/${phoneNumberId}/messages`;
  const requestBody: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };
  if (components) {
    requestBody.template.components = components;
  }
  console.log('[whatsapp.sendTemplateMessage] phoneNumberId:', phoneNumberId);
  console.log('[whatsapp.sendTemplateMessage] to:', to);
  console.log('[whatsapp.sendTemplateMessage] templateName:', templateName);
  console.log('[whatsapp.sendTemplateMessage] request body:', JSON.stringify(requestBody));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  console.log('[whatsapp.sendTemplateMessage] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.sendTemplateMessage] error response:', error);
    throw new Error(`Send template message failed: ${error}`);
  }

  const data = (await response.json()) as { messages: { id: string }[] };
  console.log('[whatsapp.sendTemplateMessage] response body:', JSON.stringify(data));
  const waMessageId = data.messages[0].id;
  console.log('[whatsapp.sendTemplateMessage] waMessageId:', waMessageId);
  return waMessageId;
}

export async function sendInteractiveMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  interactive: any
): Promise<string> {
  const url = `${GRAPH_API_URL}/${phoneNumberId}/messages`;
  const requestBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive,
  };
  console.log('[whatsapp.sendInteractiveMessage] phoneNumberId:', phoneNumberId);
  console.log('[whatsapp.sendInteractiveMessage] to:', to);
  console.log('[whatsapp.sendInteractiveMessage] request body:', JSON.stringify(requestBody));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  console.log('[whatsapp.sendInteractiveMessage] response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('[whatsapp.sendInteractiveMessage] error response:', error);
    throw new Error(`Send interactive message failed: ${error}`);
  }

  const data = (await response.json()) as { messages: { id: string }[] };
  console.log('[whatsapp.sendInteractiveMessage] response body:', JSON.stringify(data));
  const waMessageId = data.messages[0].id;
  console.log('[whatsapp.sendInteractiveMessage] waMessageId:', waMessageId);
  return waMessageId;
}
