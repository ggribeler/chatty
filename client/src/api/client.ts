const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('[api.client] API_BASE:', API_BASE);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = options?.method || 'GET';
  console.log(`[api.client] ${method} ${url}`);
  if (options?.body) {
    console.log('[api.client] request body:', options.body);
  }

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    console.error(`[api.client] error: ${response.status} ${response.statusText}`);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[api.client] ${method} ${url} response status:`, response.status, 'body:', JSON.stringify(data));
  return data as T;
}

export interface Account {
  exists: boolean;
  id?: number;
  businessId?: string;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
}

export interface Conversation {
  id: number;
  waId: string;
  profileName: string | null;
  lastMessageAt: string;
  lastMessage: string | null;
}

export type MessageType = 'text' | 'template' | 'interactive' | 'button_reply' | 'list_reply';

export interface Message {
  id: number;
  conversationId: number;
  waMessageId: string;
  direction: 'inbound' | 'outbound';
  type?: MessageType;
  content: string;
  metadata?: any;
  status: string | null;
  timestamp: string;
  createdAt: string;
}

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

export const api = {
  getAccount: () => request<Account>('/api/account'),

  completeSignup: (data: {
    code: string;
    businessId: string;
    wabaId: string;
    phoneNumberId: string;
  }) =>
    request<Account>('/api/auth/signup-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getConversations: () => request<Conversation[]>('/api/conversations'),

  getMessages: (conversationId: number) =>
    request<Message[]>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, content: string) =>
    request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getTemplates: () => request<MessageTemplate[]>('/api/templates'),

  sendTemplate: (data: {
    conversationId: number;
    templateName: string;
    languageCode: string;
    components?: any[];
  }) =>
    request<Message>('/api/templates/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendInteractive: (conversationId: number, interactive: any) =>
    request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ type: 'interactive', interactive }),
    }),
};
