import { useState } from 'react';
import { startSocialLogin } from './oauth';
import type { SocialProvider } from './api';
import './auth.css';

export default function LoginPage() {
  const [error, setError] = useState('');

  const login = (provider: SocialProvider) => {
    try {
      setError('');
      startSocialLogin(provider);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'SNS 로그인을 시작하지 못했습니다.');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img src="/brand/app-icon.png" alt="" className="auth-card__logo" />
        <h1>생존일기</h1>
        <p>간편하게 로그인하고 나의 절약 기록을 이어가세요.</p>
        <div className="auth-card__actions">
          <button className="auth-button auth-button--kakao" type="button" onClick={() => login('kakao')}>
            카카오로 계속하기
          </button>
          <button className="auth-button auth-button--naver" type="button" onClick={() => login('naver')}>
            네이버로 계속하기
          </button>
        </div>
        {error && <p className="auth-card__error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
