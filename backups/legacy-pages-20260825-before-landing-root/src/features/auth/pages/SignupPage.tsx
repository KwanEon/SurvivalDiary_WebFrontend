import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { loginWithEmail, signup } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/auth.css';

const interestOptions = [
  ['LIVING_COST', '생활비 절약'],
  ['HOUSING_COST', '월세·주거비'],
  ['GOVERNMENT_POLICY', '정부 정책'],
  ['BENEFIT', '지원금·복지'],
  ['BUDGETING', '가계부 관리'],
  ['FOOD_COST', '식비 관리'],
  ['SAVING_INVESTMENT', '저축·투자'],
  ['SIDE_INCOME', '부업·소득'],
] as const;

interface SignupForm {
  nickname: string;
  email: string;
  password: string;
  birthDate: string;
  gender: '' | 'MALE' | 'FEMALE';
  phone: string;
  signupInterests: string[];
}

const initialForm: SignupForm = {
  nickname: '',
  email: '',
  password: '',
  birthDate: '',
  gender: '',
  phone: '',
  signupInterests: [],
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { completeLogin } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof SignupForm>(field: K, value: SignupForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const toggleInterest = (value: string) => {
    update(
      'signupInterests',
      form.signupInterests.includes(value)
        ? form.signupInterests.filter((interest) => interest !== value)
        : [...form.signupInterests, value],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.gender) {
      setError('성별을 선택해 주세요.');
      return;
    }
    if (form.signupInterests.length === 0) {
      setError('관심사를 1개 이상 선택해 주세요.');
      return;
    }
    if (!/^010-\d{4}-\d{4}$/.test(form.phone)) {
      setError('휴대전화 번호를 010-0000-0000 형식으로 입력해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const phone = form.phone.replace(/\D/g, '');
      await signup({ ...form, phone, gender: form.gender });
      await loginWithEmail(form.email, form.password);
      await completeLogin();
      navigate('/', { replace: true });
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--signup" aria-labelledby="signup-title">
        <h1 id="signup-title">회원가입</h1>
        <p className="auth-card__description">앱과 동일한 정보를 입력하면 맞춤 서비스를 바로 시작할 수 있어요.</p>

        <form className="auth-form" onSubmit={submit}>
          <label><span>닉네임</span><input type="text" required maxLength={50} autoComplete="nickname" value={form.nickname} onChange={(e) => update('nickname', e.target.value)} placeholder="서비스에서 사용할 이름" /></label>
          <label><span>이메일</span><input type="email" required autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value.trim())} placeholder="email@example.com" /></label>
          <label><span>비밀번호</span><input type="password" required maxLength={64} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="비밀번호 입력" /></label>
          <label><span>생년월일</span><input type="date" required max={new Date().toISOString().slice(0, 10)} value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} /></label>

          <fieldset className="auth-fieldset">
            <legend>성별</legend>
            <div className="auth-choice-row">
              <label className={`auth-choice ${form.gender === 'MALE' ? 'auth-choice--selected' : ''}`}><input type="radio" name="gender" value="MALE" checked={form.gender === 'MALE'} onChange={() => update('gender', 'MALE')} />남성</label>
              <label className={`auth-choice ${form.gender === 'FEMALE' ? 'auth-choice--selected' : ''}`}><input type="radio" name="gender" value="FEMALE" checked={form.gender === 'FEMALE'} onChange={() => update('gender', 'FEMALE')} />여성</label>
            </div>
          </fieldset>

          <fieldset className="auth-fieldset">
            <legend>관심사 <small>1개 이상</small></legend>
            <div className="auth-interest-grid">
              {interestOptions.map(([value, label]) => (
                <label key={value} className={`auth-choice ${form.signupInterests.includes(value) ? 'auth-choice--selected' : ''}`}>
                  <input type="checkbox" checked={form.signupInterests.includes(value)} onChange={() => toggleInterest(value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            <span>휴대전화 번호</span>
            <input
              type="tel"
              required
              minLength={13}
              maxLength={13}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="숫자만 입력해 주세요"
              value={form.phone}
              onChange={(e) => update('phone', formatPhone(e.target.value))}
            />
          </label>
          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>{isSubmitting ? '가입하고 로그인 중...' : '회원가입'}</button>
        </form>

        {error && <p className="auth-card__error" role="alert">{error}</p>}
        <Link href="/login" className="auth-card__signup">이미 계정이 있나요? 로그인</Link>
      </section>
    </main>
  );
}
