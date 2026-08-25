import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Home,
  LogOut,
  MapPinned,
  Menu,
  MessageCircleMore,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import './app-shell.css';
import { useAuth } from '../../features/auth/AuthContext';
import ProfileAvatar from '../components/ProfileAvatar';

const primaryNavigation = [
  { label: '홈', to: '/', icon: Home, end: true },
  { label: '지출 등록', to: '/expenses/new', icon: PlusCircle },
  { label: '지출 통계', to: '/expenses/statistics', icon: BarChart3 },
  { label: '정책 추천', to: '/policies', icon: Sparkles },
  { label: '절약 지도', to: '/map', icon: MapPinned },
  { label: '커뮤니티', to: '/community', icon: MessageCircleMore },
];

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  const confirmLogout = async () => {
    setIsAccountMenuOpen(false);
    if (!window.confirm('현재 계정에서 로그아웃할까요?')) return;
    await logout();
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMenuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <Link className="sidebar__brand-link" href="/" aria-label="생존일기 홈으로 이동">
          <img src="/brand/app-icon.png" alt="" aria-hidden="true" />
          <div>
            <strong>생존일기</strong>
            <span>오늘도 야무지게</span>
          </div>
          </Link>
          <button
            className="sidebar__close"
            type="button"
            aria-label="메뉴 닫기"
            onClick={closeMenu}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="주요 메뉴">
          <span className="sidebar__section-label">서비스</span>
          {primaryNavigation.map(({ label, to, icon: Icon, end }) => {
            const isActive = end ? location === to : location.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                onClick={closeMenu}
                className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__tip">
          <span className="sidebar__tip-icon">
            <BookOpen size={18} />
          </span>
          <div>
            <strong>오늘도 수고했어요!</strong>
            <p>작은 절약이 큰 변화를 만들어요.</p>
          </div>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="메뉴 닫기"
          onClick={closeMenu}
        />
      )}

      <div className="app-shell__content">
        <header className="topbar">
          <button
            className="topbar__menu"
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="topbar__search">
            <Search size={17} />
            <span>정책, 장소, 게시글 검색</span>
            <kbd>검색</kbd>
          </div>

          <div className="topbar__actions">
            {user?.role === 'ADMIN' && <Link className="topbar__admin-link" href="/admin"><ShieldCheck size={17} /> 관리자</Link>}
            <button className="icon-button" type="button" aria-label="도움말">
              <CircleHelp size={18} />
            </button>
            <button className="icon-button topbar__notification" type="button" aria-label="알림">
              <Bell size={18} />
              <span />
            </button>
            <div className="topbar__account" ref={accountMenuRef}>
              <button
                className="topbar__profile"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                aria-label="회원 메뉴 열기"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
              >
                <ProfileAvatar
                  className="topbar__avatar"
                  imageUrl={user?.profileImageUrl}
                  name={user?.nickname ?? user?.name}
                />
                <span className="topbar__profile-copy">
                  <strong>{user?.nickname ?? user?.name}</strong>
                  <small>내 계정</small>
                </span>
                <ChevronDown className={isAccountMenuOpen ? 'is-open' : ''} size={15} />
              </button>

              {isAccountMenuOpen && (
                <div className="topbar-account-menu" role="menu">
                  <div className="topbar-account-menu__identity">
                    <strong>{user?.nickname ?? user?.name}</strong>
                    <span>{user?.email ?? '생존일기 회원'}</span>
                  </div>
                  <Link className="topbar-account-menu__item" href="/profile" role="menuitem">
                    <UserRound size={17} />
                    <span>
                      <strong>마이페이지</strong>
                      <small>내 정보 확인 및 수정</small>
                    </span>
                  </Link>
                  <button
                    className="topbar-account-menu__item topbar-account-menu__item--danger"
                    type="button"
                    role="menuitem"
                    onClick={() => void confirmLogout()}
                  >
                    <LogOut size={17} />
                    <span>
                      <strong>로그아웃</strong>
                      <small>현재 계정에서 나가기</small>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
