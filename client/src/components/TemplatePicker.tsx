import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { MessageTemplate } from '../api/client';

interface Props {
  conversationId: number;
  onClose: () => void;
  onSent: () => void;
}

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

export default function TemplatePicker({ conversationId, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MessageTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getBodyText = (template: MessageTemplate): string => {
    const body = template.components.find((c) => c.type === 'BODY' || c.type === 'body');
    return body?.text || '';
  };

  const getVariableSlots = (template: MessageTemplate): string[] => {
    const body = getBodyText(template);
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    return [...new Set(matches)];
  };

  const getPreviewText = (): string => {
    if (!selected) return '';
    let text = getBodyText(selected);
    for (const [slot, value] of Object.entries(variables)) {
      text = text.replace(slot, value || slot);
    }
    return text;
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const slots = getVariableSlots(selected);
      let components: any[] | undefined;
      if (slots.length > 0) {
        components = [
          {
            type: 'body',
            parameters: slots.map((slot) => ({
              type: 'text',
              text: variables[slot] || '',
            })),
          },
        ];
      }
      await api.sendTemplate({
        conversationId,
        templateName: selected.name,
        languageCode: selected.language,
        components,
      });
      onSent();
      onClose();
    } catch (error) {
      console.error('Send template failed:', error);
    } finally {
      setSending(false);
    }
  };

  if (selected) {
    const slots = getVariableSlots(selected);
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: 0,
                  }}
                >
                  ←
                </button>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{selected.name}</h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', marginLeft: '30px' }}>
              {selected.language} · {selected.category}
            </div>
          </div>

          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {slots.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Variables</div>
                {slots.map((slot) => (
                  <div key={slot} style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', display: 'block' }}>
                      {slot}
                    </label>
                    <input
                      style={inputStyle}
                      placeholder={`Value for ${slot}`}
                      value={variables[slot] || ''}
                      onChange={(e) => setVariables((v) => ({ ...v, [slot]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Preview</div>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {getPreviewText()}
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: sending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #25D366, #128C7E)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Sending...' : 'Send Template'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Message Templates</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No approved templates found</div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelected(t);
                  setVariables({});
                }}
                style={{
                  padding: '14px 24px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                  {t.language} · {t.category}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                  {getBodyText(t).substring(0, 100)}{getBodyText(t).length > 100 ? '...' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
