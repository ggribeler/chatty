const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
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

export interface Message {
  id: number;
  conversationId: number;
  waMessageId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: string | null;
  timestamp: string;
  createdAt: string;
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
};
