import type { Conversation } from '../api/client';

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <div
      style={{
        width: '340px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        overflowY: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="rgba(37, 211, 102, 0.15)" />
          <path d="M34 14L24 24M24 24L14 34M24 24L34 34M24 24L14 14" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.3px',
          }}
        >
          Chatty
        </h2>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'rgba(255, 255, 255, 0.35)',
            padding: '4px 8px',
          }}
        >
          Conversations ({conversations.length})
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.map((c) => {
          const isSelected = selectedId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                padding: '14px 24px',
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(37, 211, 102, 0.1)'
                  : 'transparent',
                borderLeft: isSelected
                  ? '3px solid #25D366'
                  : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isSelected
                      ? 'linear-gradient(135deg, #25D366, #128C7E)'
                      : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    flexShrink: 0,
                  }}
                >
                  {(c.profileName || c.waId).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                      }}
                    >
                      {c.profileName || c.waId}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.3)',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.lastMessage || 'No messages yet'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
