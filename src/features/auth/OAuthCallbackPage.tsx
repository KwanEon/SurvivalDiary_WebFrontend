import { useEffect, useState } from 'react';
import { exchangeSocialCode, saveSession, type SocialProvider } from './api';
import { callbackUri, consumeAndValidateState } from './oauth';
import './auth.css';

interface OAuthCallbackPageProps {
  provider: SocialProvider;
}

export default function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get('code') || '';
    const state = query.get('state') || '';
    const providerError = query.get('error_description') || query.get('error');

    if (providerError) {
      setError(providerError);
      return;
    }
    if (!code || !consumeAndValidateState(provider, state)) {
      setError('SNS 로그인 요청을 확인할 수 없습니다. 처음부터 다시 시도해 주세요.');
      return;
    }

    exchangeSocialCode(provider, code, callbackUri(provider), state)
      .then((tokens) => {
        saveSession(tokens);
        window.location.replace('/');
      })
      .catch((callbackError: unknown) => {
        setError(callbackError instanceof Error ? callbackError.message : 'SNS 로그인에 실패했습니다.');
      });
  }, [provider]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{error ? '로그인 실패' : '로그인 처리 중'}</h1>
        <p>{error || 'SNS 인증 정보를 생존일기 계정과 연결하고 있습니다.'}</p>
        {error && <a className="auth-card__retry" href="/">다시 로그인하기</a>}
      </section>
    </main>
  );
}
