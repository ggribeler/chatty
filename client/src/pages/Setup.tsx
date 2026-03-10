import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

declare global {
  interface Window {
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code: string } }) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean; extras: { setup: object; featureType: string; sessionInfoVersion: number } }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

export default function Setup() {
  const navigate = useNavigate();
  const signupDataRef = useRef<{
    businessId: string;
    wabaId: string;
    phoneNumberId: string;
  } | null>(null);

  // Listen for WA_EMBEDDED_SIGNUP event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v22.0',
      });
    };
  }, []);

  const handleLogin = useCallback(() => {
    window.FB.login(
      async (response) => {
        if (response.authResponse?.code && signupDataRef.current) {
          try {
            await api.completeSignup({
              code: response.authResponse.code,
              ...signupDataRef.current,
            });
            navigate('/inbox');
          } catch (error) {
            console.error('Signup failed:', error);
          }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Chatty</h1>
      <p>Connect your WhatsApp Business account to get started.</p>
      <button onClick={handleLogin} style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}>
        Connect WhatsApp
      </button>
    </div>
  );
}
