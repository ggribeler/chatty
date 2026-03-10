import type { Message } from '../api/client';

interface Props {
  messages: Message[];
}

export default function MessageThread({ messages }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            alignSelf: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
            backgroundColor: m.direction === 'outbound' ? '#dcf8c6' : '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '8px 12px',
            maxWidth: '60%',
          }}
        >
          <div>{m.content}</div>
          <div style={{ fontSize: '11px', color: '#999', textAlign: 'right', marginTop: '4px' }}>
            {new Date(m.timestamp).toLocaleTimeString()}
            {m.direction === 'outbound' && m.status ? ` · ${m.status}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
