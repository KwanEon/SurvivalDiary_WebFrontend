import { Search, Save, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  getAdminUser,
  getAdminUserExpenses,
  getAdminUsers,
  updateAdminUser,
  type AdminExpense,
  type AdminUser,
} from '../api';
import type { AdminUserDetail, AdminUserUpdateRequest } from '../types';
import AdminToast from './AdminToast';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const interestOptions = [
  { label: '생활비 절약', value: 'LIVING_COST' },
  { label: '월세·주거비', value: 'HOUSING_COST' },
  { label: '정부 정책', value: 'GOVERNMENT_POLICY' },
  { label: '지원금·복지', value: 'BENEFIT' },
  { label: '가계부 관리', value: 'BUDGETING' },
  { label: '식비 관리', value: 'FOOD_COST' },
  { label: '저축·투자', value: 'SAVING_INVESTMENT' },
  { label: '부업·소득', value: 'SIDE_INCOME' },
];

function toUpdateRequest(user: AdminUserDetail): AdminUserUpdateRequest {
  return {
    name: user.name,
    nickname: user.nickname,
    phone: user.phone,
    birthDate: user.birthDate,
    gender: user.gender,
    region: user.region,
    signupInterest: user.signupInterest,
    bio: user.bio,
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [draft, setDraft] = useState<AdminUserUpdateRequest | null>(null);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selectedInterests = new Set(
    (draft?.signupInterest ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  useEffect(() => {
    void loadUsers('');
  }, []);

  async function loadUsers(search = query) {
    setLoading(true);
    setError(null);
    try {
      setUsers((await getAdminUsers(search)).content);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '회원 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectUser(userId: number) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [detail, userExpenses] = await Promise.all([
        getAdminUser(userId),
        getAdminUserExpenses(userId),
      ]);
      setSelectedUser(detail);
      setDraft(toUpdateRequest(detail));
      setExpenses(userExpenses);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '회원 정보를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || !draft || draft.name.trim() === '') return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateAdminUser(selectedUser.userId, {
        ...draft,
        name: draft.name.trim(),
        nickname: optional(draft.nickname ?? ''),
        phone: optional(draft.phone ?? ''),
        region: optional(draft.region ?? ''),
        signupInterest: optional(draft.signupInterest ?? ''),
        bio: optional(draft.bio ?? ''),
      });
      setSelectedUser(updated);
      setDraft(toUpdateRequest(updated));
      setUsers((current) =>
        current.map((user) =>
          user.userId === updated.userId
            ? { ...user, name: updated.name, nickname: updated.nickname }
            : user,
        ),
      );
      setMessage('회원 정보를 저장했습니다.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '회원 정보를 저장하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleInterest(value: string) {
    if (!draft) return;
    const next = new Set(selectedInterests);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setDraft({ ...draft, signupInterest: [...next].join(',') || null });
  }

  return (
    <section className="admin-workspace">
      <div className="admin-workspace__header">
        <div>
          <h2>회원 정보 관리</h2>
          <p>회원을 선택하면 상세 정보와 지출 내역을 확인할 수 있습니다.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers();
          }}
        >
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이메일 또는 닉네임 검색"
          />
          <button type="submit">검색</button>
        </form>
      </div>
      {error && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {error}
        </p>
      )}
      <AdminToast message={message} onClose={() => setMessage(null)} />
      <div className="admin-user-layout">
        <article className="ui-card admin-table-card">
          <table>
            <thead>
              <tr>
                <th>회원</th>
                <th>권한</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className={selectedUser?.userId === user.userId ? 'is-selected' : ''}
                  onClick={() => void selectUser(user.userId)}
                >
                  <td>
                    <strong>{user.nickname ?? user.name}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && <p className="admin-empty">조회된 회원이 없습니다.</p>}
        </article>
        <div className="admin-user-detail">
          {selectedUser && draft ? (
            <>
              <form className="ui-card admin-edit-form" onSubmit={saveUser}>
                <div className="admin-detail-heading">
                  <div>
                    <UserRound size={20} />
                    <h3>회원 상세</h3>
                  </div>
                  <span>{selectedUser.role}</span>
                </div>
                <div className="admin-readonly-grid">
                  <p>
                    <span>이메일</span>
                    <strong>{selectedUser.email}</strong>
                  </p>
                  <p>
                    <span>가입일</span>
                    <strong>{new Date(selectedUser.createdAt).toLocaleString()}</strong>
                  </p>
                </div>
                <div className="admin-form-grid">
                  <label>
                    이름
                    <input
                      required
                      maxLength={50}
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  </label>
                  <label>
                    닉네임
                    <input
                      maxLength={50}
                      value={draft.nickname ?? ''}
                      onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
                    />
                  </label>
                  <label>
                    휴대폰
                    <input
                      maxLength={20}
                      value={draft.phone ?? ''}
                      onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                    />
                  </label>
                  <label>
                    생년월일
                    <input
                      type="date"
                      value={draft.birthDate ?? ''}
                      onChange={(event) =>
                        setDraft({ ...draft, birthDate: event.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    성별
                    <select
                      value={draft.gender ?? ''}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          gender:
                            event.target.value === ''
                              ? null
                              : (event.target.value as 'MALE' | 'FEMALE'),
                        })
                      }
                    >
                      <option value="">미설정</option>
                      <option value="MALE">남성</option>
                      <option value="FEMALE">여성</option>
                    </select>
                  </label>
                  <label>
                    지역
                    <input
                      maxLength={50}
                      value={draft.region ?? ''}
                      onChange={(event) => setDraft({ ...draft, region: event.target.value })}
                    />
                  </label>
                  <fieldset className="admin-form-grid__wide admin-interest-field">
                    <legend>관심사</legend>
                    <div className="admin-interest-tabs">
                      {interestOptions.map((interest) => (
                        <button
                          type="button"
                          className={selectedInterests.has(interest.value) ? 'is-selected' : ''}
                          aria-pressed={selectedInterests.has(interest.value)}
                          onClick={() => toggleInterest(interest.value)}
                          key={interest.value}
                        >
                          {interest.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="admin-form-grid__wide">
                    소개
                    <textarea
                      maxLength={500}
                      rows={4}
                      value={draft.bio ?? ''}
                      onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                    />
                  </label>
                </div>
                <button
                  className="button button--primary admin-save-button"
                  type="submit"
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? '저장 중...' : '회원 정보 저장'}
                </button>
              </form>
              <article className="ui-card admin-expenses">
                <div className="ui-card__header">
                  <h2>
                    <WalletCards size={17} /> 회원별 지출
                  </h2>
                </div>
                {expenses.length ? (
                  <ul>
                    {expenses.map((expense) => (
                      <li key={expense.expenseId}>
                        <span>
                          {expense.title}
                          <small>{new Date(expense.spentAt).toLocaleDateString()}</small>
                        </span>
                        <strong>{money.format(expense.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-empty">지출 내역이 없습니다.</p>
                )}
              </article>
            </>
          ) : (
            <div className="ui-card admin-selection-placeholder">
              <UserRound size={28} />
              <p>상세 정보를 확인할 회원을 선택해 주세요.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
