import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { Conversation, Message } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import ConversationList from '../components/ConversationList';
import MessageThread from '../components/MessageThread';
import MessageInput from '../components/MessageInput';

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Poll conversations every 3 seconds
  usePolling(
    useCallback(() => {
      api.getConversations().then((data) => {
        console.log('[Inbox] conversation poll — count:', data.length);
        setConversations(data);
      }).catch(console.error);
    }, []),
    3000
  );

  // Poll messages for selected conversation every 3 seconds
  usePolling(
    useCallback(() => {
      if (selectedId) {
        api.getMessages(selectedId).then((data) => {
          console.log('[Inbox] message poll — conversationId:', selectedId, 'count:', data.length);
          setMessages(data);
        }).catch(console.error);
      }
    }, [selectedId]),
    3000
  );

  const handleSelect = (id: number) => {
    console.log('[Inbox] conversation selected:', id);
    setSelectedId(id);
    api.getMessages(id).then(setMessages).catch(console.error);
  };

  const handleSend = async (content: string) => {
    if (!selectedId) return;
    console.log('[Inbox] send attempt — conversationId:', selectedId, 'content:', content);

    // Optimistic append
    const optimisticMessage: Message = {
      id: Date.now(),
      conversationId: selectedId,
      waMessageId: `temp-${Date.now()}`,
      direction: 'outbound',
      type: 'text',
      content,
      metadata: null,
      status: 'sending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await api.sendMessage(selectedId, content);
      console.log('[Inbox] send success — conversationId:', selectedId);
    } catch (error) {
      console.error('[Inbox] send failed:', error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3a 50%, #0d2137 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#ffffff',
      }}
    >
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedId ? (
          <>
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {(conversations.find((c) => c.id === selectedId)?.profileName ||
                  conversations.find((c) => c.id === selectedId)?.waId ||
                  '?'
                ).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {conversations.find((c) => c.id === selectedId)?.profileName ||
                    conversations.find((c) => c.id === selectedId)?.waId}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  WhatsApp
                </div>
              </div>
            </div>
            <MessageThread messages={messages} />
            <MessageInput conversationId={selectedId} onSend={handleSend} />
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '15px' }}>
              Select a conversation to start messaging
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
