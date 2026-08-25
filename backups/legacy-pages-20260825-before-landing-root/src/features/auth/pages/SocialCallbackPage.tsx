import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { exchangeSocialCode } from '../api';
import { useAuth } from '../AuthContext';
import { getCallbackUrl, type SocialProvider } from '../oauth';
import '../styles/auth.css';

export default function SocialCallbackPage({ provider }: { provider: SocialProvider }) {
  const [, navigate] = useLocation();
  const { completeLogin } = useAuth();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state') ?? undefined;
    const providerError = params.get('error') ?? params.get('error_description');
    const expectedState = sessionStorage.getItem(`auth:${provider}State`);

    if (providerError || !code) {
      setError('SNS 로그인이 취소되었거나 인증 정보를 받지 못했습니다.');
      return;
    }
    if (!state || state !== expectedState) {
      setError('로그인 요청을 확인할 수 없습니다. 다시 시도해 주세요.');
      return;
    }

    void exchangeSocialCode(provider, code, getCallbackUrl(provider), state)
      .then(completeLogin)
      .then(() => {
        sessionStorage.removeItem(`auth:${provider}State`);
        const returnTo = sessionStorage.getItem('auth:returnTo') ?? '/';
        sessionStorage.removeItem('auth:returnTo');
        navigate(returnTo, { replace: true });
      })
      .catch((callbackError) => {
        setError(callbackError instanceof Error ? callbackError.message : '로그인에 실패했습니다.');
      });
  }, [completeLogin, navigate, provider]);

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--callback">
        {error ? (
          <>
            <h1>로그인하지 못했어요</h1>
            <p className="auth-card__error" role="alert">{error}</p>
            <button type="button" className="auth-card__retry" onClick={() => navigate('/login', { replace: true })}>
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <h1>로그인하고 있어요</h1>
            <p>잠시만 기다려 주세요.</p>
          </>
        )}
      </section>
    </main>
  );
}
