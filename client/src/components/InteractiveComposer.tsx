import { useState } from 'react';
import { api } from '../api/client';

interface Props {
  conversationId: number;
  onClose: () => void;
  onSent: () => void;
}

type TabType = 'buttons' | 'cta' | 'list';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#1a1f3a',
  borderRadius: '16px',
  width: '520px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.5)',
  marginBottom: '4px',
  display: 'block',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '14px',
};

export default function InteractiveComposer({ conversationId, onClose, onSent }: Props) {
  const [tab, setTab] = useState<TabType>('buttons');
  const [sending, setSending] = useState(false);

  // Shared fields
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Quick Reply Buttons
  const [buttons, setButtons] = useState<string[]>(['']);

  // CTA URL
  const [ctaDisplayText, setCtaDisplayText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // List
  const [listButtonLabel, setListButtonLabel] = useState('View options');
  const [sections, setSections] = useState<Array<{
    title: string;
    rows: Array<{ title: string; description: string }>;
  }>>([{ title: '', rows: [{ title: '', description: '' }] }]);

  const handleSend = async () => {
    if (!bodyText.trim()) return;
    setSending(true);

    try {
      let interactive: any;

      if (tab === 'buttons') {
        const validButtons = buttons.filter((b) => b.trim());
        if (validButtons.length === 0) return;
        interactive = {
          type: 'button',
          ...(headerText && { header: { type: 'text', text: headerText } }),
          body: { text: bodyText },
          ...(footerText && { footer: { text: footerText } }),
          action: {
            buttons: validButtons.map((text, i) => ({
              type: 'reply',
              reply: { id: `btn_${i}`, title: text },
            })),
          },
        };
      } else if (tab === 'cta') {
        if (!ctaDisplayText.trim() || !ctaUrl.trim()) return;
        interactive = {
          type: 'cta_url',
          ...(headerText && { header: { type: 'text', text: headerText } }),
          body: { text: bodyText },
          ...(footerText && { footer: { text: footerText } }),
          action: {
            name: 'cta_url',
            parameters: {
              display_text: ctaDisplayText,
              url: ctaUrl,
            },
          },
        };
      } else {
        const validSections = sections
          .filter((s) => s.rows.some((r) => r.title.trim()))
          .map((s) => ({
            ...(s.title && { title: s.title }),
            rows: s.rows
              .filter((r) => r.title.trim())
              .map((r, i) => ({
                id: `row_${i}`,
                title: r.title,
                ...(r.description && { description: r.description }),
              })),
          }));
        if (validSections.length === 0) return;
        interactive = {
          type: 'list',
          ...(headerText && { header: { type: 'text', text: headerText } }),
          body: { text: bodyText },
          ...(footerText && { footer: { text: footerText } }),
          action: {
            button: listButtonLabel || 'View options',
            sections: validSections,
          },
        };
      }

      await api.sendInteractive(conversationId, interactive);
      onSent();
      onClose();
    } catch (error) {
      console.error('Send interactive failed:', error);
    } finally {
      setSending(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #25D366' : '2px solid transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Interactive Message</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button style={tabStyle(tab === 'buttons')} onClick={() => setTab('buttons')}>Quick Reply</button>
          <button style={tabStyle(tab === 'cta')} onClick={() => setTab('cta')}>CTA URL</button>
          <button style={tabStyle(tab === 'list')} onClick={() => setTab('list')}>List Menu</button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Shared fields */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Header (optional)</label>
            <input style={inputStyle} placeholder="Header text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Body *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Message body text"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Footer (optional)</label>
            <input style={inputStyle} placeholder="Footer text" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
          </div>

          {/* Tab-specific fields */}
          {tab === 'buttons' && (
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                Buttons (1-3, max 20 chars)
              </div>
              {buttons.map((btn, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder={`Button ${i + 1}`}
                    maxLength={20}
                    value={btn}
                    onChange={(e) => {
                      const next = [...buttons];
                      next[i] = e.target.value;
                      setButtons(next);
                    }}
                  />
                  {buttons.length > 1 && (
                    <button
                      onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {buttons.length < 3 && (
                <button
                  onClick={() => setButtons([...buttons, ''])}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    width: '100%',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  + Add button
                </button>
              )}
            </div>
          )}

          {tab === 'cta' && (
            <div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Button text *</label>
                <input style={inputStyle} placeholder="e.g., Visit website" value={ctaDisplayText} onChange={(e) => setCtaDisplayText(e.target.value)} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>URL *</label>
                <input style={inputStyle} placeholder="https://..." value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
              </div>
            </div>
          )}

          {tab === 'list' && (
            <div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Menu button label</label>
                <input style={inputStyle} placeholder="View options" value={listButtonLabel} onChange={(e) => setListButtonLabel(e.target.value)} />
              </div>
              {sections.map((section, si) => (
                <div key={si} style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      style={{ ...inputStyle, fontWeight: 600 }}
                      placeholder={`Section ${si + 1} title`}
                      value={section.title}
                      onChange={(e) => {
                        const next = [...sections];
                        next[si] = { ...next[si], title: e.target.value };
                        setSections(next);
                      }}
                    />
                    {sections.length > 1 && (
                      <button
                        onClick={() => setSections(sections.filter((_, j) => j !== si))}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px', marginLeft: '8px' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {section.rows.map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', gap: '8px', marginBottom: '6px', marginLeft: '12px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Row title"
                        value={row.title}
                        onChange={(e) => {
                          const next = [...sections];
                          next[si].rows[ri] = { ...next[si].rows[ri], title: e.target.value };
                          setSections(next);
                        }}
                      />
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Description (optional)"
                        value={row.description}
                        onChange={(e) => {
                          const next = [...sections];
                          next[si].rows[ri] = { ...next[si].rows[ri], description: e.target.value };
                          setSections(next);
                        }}
                      />
                      {section.rows.length > 1 && (
                        <button
                          onClick={() => {
                            const next = [...sections];
                            next[si] = { ...next[si], rows: next[si].rows.filter((_, j) => j !== ri) };
                            setSections(next);
                          }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px' }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const next = [...sections];
                      next[si] = { ...next[si], rows: [...next[si].rows, { title: '', description: '' }] };
                      setSections(next);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: '12px',
                      padding: '4px 0',
                    }}
                  >
                    + Add row
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSections([...sections, { title: '', rows: [{ title: '', description: '' }] }])}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '8px',
                  width: '100%',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                + Add section
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleSend}
            disabled={sending || !bodyText.trim()}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: sending || !bodyText.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: sending || !bodyText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Sending...' : 'Send Interactive'}
          </button>
        </div>
      </div>
    </div>
  );
}
