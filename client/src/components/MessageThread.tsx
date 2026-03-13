import { useEffect, useRef } from 'react';
import type { Message } from '../api/client';
import {
  TemplateMessageBubble,
  InteractiveMessageBubble,
  ButtonReplyBubble,
  ListReplyBubble,
} from './MessageBubbles';

interface Props {
  messages: Message[];
}

function renderMessageContent(m: Message) {
  switch (m.type) {
    case 'template':
      return <TemplateMessageBubble message={m} />;
    case 'interactive':
      return <InteractiveMessageBubble message={m} />;
    case 'button_reply':
      return <ButtonReplyBubble message={m} />;
    case 'list_reply':
      return <ListReplyBubble message={m} />;
    default:
      return <div>{m.content}</div>;
  }
}

export default function MessageThread({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'transparent',
      }}
    >
      {messages.map((m) => {
        const isOutbound = m.direction === 'outbound';
        return (
          <div
            key={m.id}
            style={{
              alignSelf: isOutbound ? 'flex-end' : 'flex-start',
              maxWidth: '65%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: isOutbound
                  ? 'linear-gradient(135deg, #25D366, #128C7E)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: isOutbound ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: isOutbound
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                padding: '10px 16px',
                fontSize: '14px',
                lineHeight: 1.5,
                boxShadow: isOutbound
                  ? '0 2px 8px rgba(37, 211, 102, 0.2)'
                  : '0 1px 4px rgba(0, 0, 0, 0.15)',
              }}
            >
              {renderMessageContent(m)}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.3)',
                marginTop: '4px',
                textAlign: isOutbound ? 'right' : 'left',
                padding: '0 4px',
              }}
            >
              {new Date(m.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {isOutbound && m.status ? ` · ${m.status}` : ''}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
