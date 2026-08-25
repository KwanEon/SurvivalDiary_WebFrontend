import { useState, type FormEvent } from 'react';
import { Redirect, Link, useLocation } from 'wouter';
import { useAuth } from '../AuthContext';
import { loginWithEmail } from '../api';
import { startSocialLogin, type SocialProvider } from '../oauth';
import '../styles/auth.css';

export default function LoginPage() {
  const { user, isLoading, completeLogin } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const requestedPath = new URLSearchParams(window.location.search).get('returnTo') ?? '/';
  const returnTo = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  if (!isLoading && user) return <Redirect to={returnTo} />;

  const login = (provider: SocialProvider) => {
    try {
      setError('');
      startSocialLogin(provider, returnTo);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인을 시작하지 못했습니다.');
    }
  };

  const submitEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      await completeLogin();
      navigate(returnTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <img className="auth-card__logo" src="/brand/app-icon.png" alt="" />
        <p className="auth-card__eyebrow">오늘을 버티고 내일을 준비하는</p>
        <h1 id="login-title">생존일기</h1>
        <p className="auth-card__description">로그인하고 지출 관리와 맞춤 청년 정책을 한곳에서 확인하세요.</p>
        {new URLSearchParams(window.location.search).get('signup') === 'success' && (
          <p className="auth-card__success" role="status">회원가입이 완료됐어요. 로그인해 주세요.</p>
        )}

        <form className="auth-form" onSubmit={submitEmailLogin}>
          <label>
            <span>이메일</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="email@example.com" required />
          </label>
          <label>
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="비밀번호 입력" required />
          </label>
          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <Link href="/signup" className="auth-card__signup">아직 계정이 없나요? 회원가입</Link>

        <div className="auth-divider"><span>간편 로그인</span></div>
        <div className="social-icons" aria-label="SNS 로그인">
          <button type="button" className="social-icon social-icon--kakao" onClick={() => login('kakao')} aria-label="카카오로 로그인">K</button>
          <button type="button" className="social-icon social-icon--naver" onClick={() => login('naver')} aria-label="네이버로 로그인">N</button>
        </div>

        {error && <p className="auth-card__error" role="alert">{error}</p>}
        <p className="auth-card__terms">로그인하면 서비스 이용약관과 개인정보 처리방침에 동의한 것으로 간주합니다.</p>
      </section>
    </main>
  );
}
