import { Conversation } from '../api/client';

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <div style={{ width: '300px', borderRight: '1px solid #ddd', overflowY: 'auto', height: '100vh' }}>
      <h2 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #ddd' }}>Conversations</h2>
      {conversations.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: selectedId === c.id ? '#e3f2fd' : 'transparent',
            borderBottom: '1px solid #eee',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{c.profileName || c.waId}</div>
          <div style={{ fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.lastMessage || 'No messages'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(c.lastMessageAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
