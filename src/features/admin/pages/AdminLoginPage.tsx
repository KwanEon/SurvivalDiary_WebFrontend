import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { loginAdmin } from '../api';
import '../styles/admin-login.css';

interface AdminLoginPageProps {
  onAuthenticated: () => void;
}

export default function AdminLoginPage({ onAuthenticated }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginAdmin(email.trim(), password);
      onAuthenticated();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-icon" aria-hidden="true">
          <ShieldCheck size={34} strokeWidth={2} />
        </div>
        <p className="admin-login-eyebrow">Survival Diary</p>
        <h1 id="admin-login-title">관리자 로그인</h1>
        <p className="admin-login-description">관리자 계정으로 로그인해 주세요.</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">이메일</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? '확인 중...' : '관리자 로그인'}
          </button>
        </form>

        <Link href="/" className="admin-login-back">
          <ArrowLeft size={17} aria-hidden="true" />
          메인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
