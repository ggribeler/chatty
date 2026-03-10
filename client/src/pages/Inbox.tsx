import { useState, useCallback } from 'react';
import { api, Conversation, Message } from '../api/client';
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
      api.getConversations().then(setConversations).catch(console.error);
    }, []),
    3000
  );

  // Poll messages for selected conversation every 3 seconds
  usePolling(
    useCallback(() => {
      if (selectedId) {
        api.getMessages(selectedId).then(setMessages).catch(console.error);
      }
    }, [selectedId]),
    3000
  );

  const handleSelect = (id: number) => {
    setSelectedId(id);
    api.getMessages(id).then(setMessages).catch(console.error);
  };

  const handleSend = async (content: string) => {
    if (!selectedId) return;

    // Optimistic append
    const optimisticMessage: Message = {
      id: Date.now(),
      conversationId: selectedId,
      waMessageId: `temp-${Date.now()}`,
      direction: 'outbound',
      content,
      status: 'sending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await api.sendMessage(selectedId, content);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedId ? (
          <>
            <MessageThread messages={messages} />
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#999' }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
