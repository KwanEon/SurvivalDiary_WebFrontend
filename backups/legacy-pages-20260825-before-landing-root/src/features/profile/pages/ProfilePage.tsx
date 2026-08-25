import {
  CalendarDays,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../auth/AuthContext';
import ProfileAvatar from '../../../shared/components/ProfileAvatar';
import '../styles/profile.css';

function joinedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '확인 불가';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refreshProfile = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      await refreshUser();
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : '회원 정보를 불러오지 못했어요.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const confirmLogout = async () => {
    if (!window.confirm('현재 계정에서 로그아웃할까요?')) return;
    await logout();
    setLocation('/login');
  };

  if (!user) return null;

  return (
    <div className="page profile-page">
      <div className="page-heading profile-page__heading">
        <div>
          <h1>마이페이지</h1>
          <p>내 정보와 프로필 사진을 한곳에서 관리해요.</p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          disabled={refreshing}
          onClick={() => void refreshProfile()}
        >
          <RefreshCw className={refreshing ? 'spin' : ''} size={17} />
          {refreshing ? '새로 고침 중' : '새로 고침'}
        </button>
      </div>

      {error && (
        <div className="profile-message profile-message--error" role="alert">
          {error}
        </div>
      )}

      <section className="profile-hero">
        <ProfileAvatar
          className="profile-avatar profile-avatar--hero"
          imageUrl={user.profileImageUrl}
          name={user.name}
        />
        <div className="profile-hero__copy">
          <h2>{user.name}</h2>
          <p>{user.email ?? '이메일 미등록'}</p>
          {user.bio && <blockquote>{user.bio}</blockquote>}
        </div>
        <Link className="button profile-hero__edit" href="/profile/edit">
          <PencilLine size={17} /> 회원 정보 수정
        </Link>
      </section>

      <div className="profile-page__grid">
        <section className="ui-card profile-section" aria-labelledby="profile-account-title">
          <div className="profile-section__heading">
            <div>
              <h2 id="profile-account-title">계정 관리</h2>
            </div>
          </div>
          <div className="profile-menu-list">
            <Link className="profile-menu-item" href="/profile/edit">
              <span className="profile-menu-item__icon">
                <UserRound size={19} />
              </span>
              <span>
                <strong>회원 정보 수정</strong>
                <small>이름, 연락처, 프로필 사진을 관리해요</small>
              </span>
              <ChevronRight size={18} />
            </Link>
            <button
              className="profile-menu-item profile-menu-item--danger"
              type="button"
              onClick={() => void confirmLogout()}
            >
              <span className="profile-menu-item__icon">
                <LogOut size={19} />
              </span>
              <span>
                <strong>로그아웃</strong>
                <small>현재 계정에서 안전하게 나가요</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="ui-card profile-section" aria-labelledby="profile-info-title">
          <div className="profile-section__heading">
            <div>
              <h2 id="profile-info-title">내 정보</h2>
            </div>
          </div>
          <dl className="profile-info-list">
            <div>
              <dt>
                <Mail size={16} /> 이메일
              </dt>
              <dd>{user.email ?? '미등록'}</dd>
            </div>
            <div>
              <dt>
                <Phone size={16} /> 휴대폰
              </dt>
              <dd>{user.phone || '미등록'}</dd>
            </div>
            <div>
              <dt>
                <MapPin size={16} /> 지역
              </dt>
              <dd>{user.region || '미등록'}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={16} /> 가입일
              </dt>
              <dd>{joinedDate(user.createdAt)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
