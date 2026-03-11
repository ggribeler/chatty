import { useState } from 'react';

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
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
  );
}
