import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Home,
  MapPinned,
  Menu,
  MessageCircleMore,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import './app-shell.css';
import { useAuth } from '../../features/auth/AuthContext';

const primaryNavigation = [
  { label: '홈', to: '/', icon: Home, end: true },
  { label: '지출 등록', to: '/expenses/new', icon: PlusCircle },
  { label: '지출 통계', to: '/expenses/statistics', icon: BarChart3 },
  { label: '정책 추천', to: '/policies', icon: Sparkles },
  { label: '절약 지도', to: '/map', icon: MapPinned },
  { label: '커뮤니티', to: '/community', icon: MessageCircleMore },
];

const futureNavigation = [
  { label: '마이페이지', icon: UserRound },
  { label: '설정', icon: Settings },
];

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMenuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src="/brand/app-icon.png" alt="" aria-hidden="true" />
          <div>
            <strong>생존일기</strong>
            <span>오늘도 야무지게</span>
          </div>
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

          <span className="sidebar__section-label sidebar__section-label--secondary">계정</span>
          {futureNavigation.map(({ label, icon: Icon }) => (
            <button className="sidebar__future-link" type="button" key={label}>
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
              <small>준비 중</small>
            </button>
          ))}
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
            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar__actions">
            <button className="icon-button" type="button" aria-label="도움말">
              <CircleHelp size={18} />
            </button>
            <button className="icon-button topbar__notification" type="button" aria-label="알림">
              <Bell size={18} />
              <span />
            </button>
            <button className="topbar__profile" type="button" onClick={() => void logout()} aria-label="로그아웃">
              <span className="topbar__avatar">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" />
                ) : (
                  (user?.nickname ?? user?.name ?? '생').slice(0, 1)
                )}
              </span>
              <span className="topbar__profile-copy">
                <strong>{user?.nickname ?? user?.name}</strong>
                <small>로그아웃</small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
