import { useState } from 'react';
import TemplatePicker from './TemplatePicker';
import InteractiveComposer from './InteractiveComposer';

interface Props {
  conversationId: number;
  onSend: (content: string) => void;
}

const iconButtonStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'rgba(255, 255, 255, 0.5)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: 0,
};

export default function MessageInput({ conversationId, onSend }: Props) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showInteractiveComposer, setShowInteractiveComposer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <button
          type="button"
          title="Send template"
          style={iconButtonStyle}
          onClick={() => setShowTemplatePicker(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>

        <button
          type="button"
          title="Send interactive message"
          style={iconButtonStyle}
          onClick={() => setShowInteractiveComposer(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '24px',
            border: focused
              ? '1px solid rgba(37, 211, 102, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: focused
              ? '0 0 0 3px rgba(37, 211, 102, 0.1)'
              : 'none',
          }}
        />
        <button
          type="submit"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: text.trim()
              ? 'linear-gradient(135deg, #25D366, #128C7E)'
              : 'rgba(255, 255, 255, 0.08)',
            color: text.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            boxShadow: text.trim()
              ? '0 2px 10px rgba(37, 211, 102, 0.3)'
              : 'none',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      {showTemplatePicker && (
        <TemplatePicker
          conversationId={conversationId}
          onClose={() => setShowTemplatePicker(false)}
          onSent={() => {}}
        />
      )}

      {showInteractiveComposer && (
        <InteractiveComposer
          conversationId={conversationId}
          onClose={() => setShowInteractiveComposer(false)}
          onSent={() => {}}
        />
      )}
    </>
  );
}
