import type { Message } from '../api/client';

const badgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '10px',
  background: color,
  color: '#ffffff',
  marginBottom: '6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
});

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '8px',
};

const renderedButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '13px',
  textAlign: 'center' as const,
  cursor: 'default',
};

const headerFooterStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.5)',
  marginBottom: '4px',
};

export function TemplateMessageBubble({ message }: { message: Message }) {
  const metadata = message.metadata;
  const buttons = metadata?.components
    ?.find((c: any) => c.type === 'BUTTONS' || c.type === 'buttons')
    ?.buttons;

  return (
    <div>
      <span style={badgeStyle('rgba(139, 92, 246, 0.8)')}>Template</span>
      {metadata?.header && (
        <div style={{ ...headerFooterStyle, fontWeight: 600 }}>{metadata.header}</div>
      )}
      <div>{message.content}</div>
      {metadata?.footer && (
        <div style={{ ...headerFooterStyle, marginTop: '4px', marginBottom: 0 }}>{metadata.footer}</div>
      )}
      {buttons && buttons.length > 0 && (
        <div style={buttonContainerStyle}>
          {buttons.map((btn: any, i: number) => (
            <div key={i} style={renderedButtonStyle}>
              {btn.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InteractiveMessageBubble({ message }: { message: Message }) {
  const metadata = message.metadata;
  const interactiveType = metadata?.type;

  return (
    <div>
      <span style={badgeStyle('rgba(59, 130, 246, 0.8)')}>Interactive</span>
      {metadata?.header?.text && (
        <div style={{ ...headerFooterStyle, fontWeight: 600 }}>{metadata.header.text}</div>
      )}
      <div>{metadata?.body?.text || message.content}</div>
      {metadata?.footer?.text && (
        <div style={{ ...headerFooterStyle, marginTop: '4px', marginBottom: 0 }}>{metadata.footer.text}</div>
      )}
      {interactiveType === 'button' && metadata?.action?.buttons && (
        <div style={buttonContainerStyle}>
          {metadata.action.buttons.map((btn: any, i: number) => (
            <div key={i} style={renderedButtonStyle}>
              {btn.reply?.title || btn.title}
            </div>
          ))}
        </div>
      )}
      {interactiveType === 'cta_url' && metadata?.action?.parameters && (
        <div style={buttonContainerStyle}>
          <div style={{ ...renderedButtonStyle, color: '#60a5fa' }}>
            {metadata.action.parameters.display_text} ↗
          </div>
        </div>
      )}
      {interactiveType === 'list' && metadata?.action?.sections && (
        <div style={buttonContainerStyle}>
          <div style={{ ...renderedButtonStyle, color: '#60a5fa' }}>
            {metadata.action.button || 'View options'} ▾
          </div>
        </div>
      )}
    </div>
  );
}

export function ButtonReplyBubble({ message }: { message: Message }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
        Replied to button
      </div>
      <div>{message.content}</div>
    </div>
  );
}

export function ListReplyBubble({ message }: { message: Message }) {
  const metadata = message.metadata;
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
        Selected from list
      </div>
      <div>{message.content}</div>
      {metadata?.description && (
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
          {metadata.description}
        </div>
      )}
    </div>
  );
}
