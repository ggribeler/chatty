import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

declare global {
  interface Window {
    FB: {
      init: (params: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code: string } }) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean; extras: { setup: object; featureType: string; sessionInfoVersion: number } }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3a 50%, #0d2137 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '20px',
  } as const,
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '48px',
    maxWidth: '460px',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
  } as const,
  logo: {
    fontSize: '48px',
    marginBottom: '8px',
    lineHeight: 1,
  } as const,
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  } as const,
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 36px 0',
    lineHeight: 1.5,
  } as const,
  features: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '36px',
    textAlign: 'left' as const,
  } as const,
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '14px',
    lineHeight: 1.4,
  } as const,
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(37, 211, 102, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  } as const,
  button: {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  } as const,
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 25px rgba(37, 211, 102, 0.45)',
  } as const,
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
    lineHeight: 1.5,
  } as const,
} as const;

export default function Setup() {
  const navigate = useNavigate();
  const [buttonHovered, setButtonHovered] = useState(false);
  const signupDataRef = useRef<{
    businessId: string;
    wabaId: string;
    phoneNumberId: string;
  } | null>(null);

  // Log env vars on mount
  useEffect(() => {
    console.log('[Setup] VITE_META_APP_ID:', import.meta.env.VITE_META_APP_ID);
    console.log('[Setup] VITE_EMBEDDED_SIGNUP_CONFIG_ID:', import.meta.env.VITE_EMBEDDED_SIGNUP_CONFIG_ID);
  }, []);

  // Listen for WA_EMBEDDED_SIGNUP event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[Setup] message event — origin:', event.origin, 'data type:', typeof event.data);

      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          const { business_id, waba_id, phone_number_id } = data.data;
          console.log('[Setup] WA_EMBEDDED_SIGNUP data — businessId:', business_id, 'wabaId:', waba_id, 'phoneNumberId:', phone_number_id);
          signupDataRef.current = {
            businessId: business_id,
            wabaId: waba_id,
            phoneNumberId: phone_number_id,
          };
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    const initFB = () => {
      console.log('[Setup] FB SDK initializing...');
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v25.0',
      });
      console.log('[Setup] FB SDK initialized');
    };

    if (window.FB) {
      console.log('[Setup] FB SDK already loaded, initializing immediately');
      initFB();
    } else {
      window.fbAsyncInit = initFB;
    }
  }, []);

  const handleLogin = useCallback(() => {
    console.log('[Setup] handleLogin called');
    window.FB.login(
      (response) => {
        console.log('[Setup] FB.login response — has authResponse:', !!response.authResponse, 'has code:', !!response.authResponse?.code);
        console.log('[Setup] FB.login full response:', JSON.stringify(response));
        if (response.authResponse?.code && signupDataRef.current) {
          console.log('[Setup] calling completeSignup...');
          api.completeSignup({
            code: response.authResponse.code,
            ...signupDataRef.current,
          })
            .then(() => {
              console.log('[Setup] completeSignup succeeded, navigating to /inbox');
              navigate('/inbox');
            })
            .catch((error) => {
              console.error('[Setup] completeSignup failed:', error);
            });
        }
      },
      {
        config_id: import.meta.env.VITE_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: 2,
        },
      }
    );
  }, [navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="rgba(37, 211, 102, 0.15)" />
            <path d="M34 14L24 24M24 24L14 34M24 24L34 34M24 24L14 14" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={styles.title}>Chatty</h1>
        <p style={styles.subtitle}>
          Connect your WhatsApp Business account and start managing conversations in one place.
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span>Receive and reply to WhatsApp messages from your browser</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span>Keep all your conversations organized in one inbox</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span>Get set up in under a minute with embedded signup</span>
          </div>
        </div>

        <button
          onClick={handleLogin}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            ...styles.button,
            ...(buttonHovered ? styles.buttonHover : {}),
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Connect WhatsApp
        </button>

        <p style={styles.footer}>
          Powered by the WhatsApp Cloud API. Your data stays on your server.
        </p>
      </div>
    </div>
  );
}
