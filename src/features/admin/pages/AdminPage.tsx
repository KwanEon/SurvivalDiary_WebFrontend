import {
  BarChart3,
  FileText,
  MapPinned,
  MessageCircleMore,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import AdminCommunityManagement from '../components/AdminCommunityManagement';
import AdminUserManagement from '../components/AdminUserManagement';
import '../styles/admin.css';
import '../styles/admin-management.css';

type AdminTab = 'overview' | 'users' | 'community' | 'policies' | 'map';

const tabs: Array<{ id: AdminTab; label: string; icon: typeof UsersRound }> = [
  { id: 'overview', label: '운영 현황', icon: BarChart3 },
  { id: 'users', label: '회원·지출', icon: UsersRound },
  { id: 'community', label: '커뮤니티·문의', icon: MessageCircleMore },
  { id: 'policies', label: '정책 관리', icon: FileText },
  { id: 'map', label: '지도 관리', icon: MapPinned },
];

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');

  return (
    <div className="page admin-page">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Admin</p>
          <h1>관리자 센터</h1>
          <p>회원, 지출, 정책, 지도, 커뮤니티와 문의를 운영합니다.</p>
        </div>
        <span className="admin-page__badge">
          <ShieldCheck size={16} /> 관리자 전용
        </span>
      </div>
      <div className="admin-console">
        <aside className="admin-sidebar">
          <strong>관리 메뉴</strong>
          <nav className="admin-tabs" aria-label="관리자 메뉴">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                className={tab === id ? 'admin-tabs__active' : ''}
                onClick={() => setTab(id)}
                key={id}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="admin-console__content">
          {tab === 'overview' && (
            <section className="admin-page__menu">
              {tabs.slice(1).map(({ id, label, icon: Icon }) => (
                <button
                  className="ui-card admin-menu-card"
                  type="button"
                  onClick={() => setTab(id)}
                  key={id}
                >
                  <span>
                    <Icon size={22} />
                  </span>
                  <h2>{label}</h2>
                  <p>
                    {id === 'users'
                      ? '회원 상세 정보와 회원별 지출 내역을 확인하고 수정합니다.'
                      : id === 'community'
                        ? '전체 게시글을 상세 조회하고 수정·삭제하거나 질문에 답변합니다.'
                        : id === 'policies'
                          ? '정책 외부 데이터의 노출 운영 기능을 준비합니다.'
                          : '공공 지도 데이터와 직접 등록 장소를 관리합니다.'}
                  </p>
                </button>
              ))}
            </section>
          )}
          {tab === 'users' && <AdminUserManagement />}
          {tab === 'community' && <AdminCommunityManagement />}
          {(tab === 'policies' || tab === 'map') && (
            <section className="ui-card admin-notice">
              <h2>{tab === 'policies' ? '정책 관리 준비' : '지도 관리 준비'}</h2>
              <p>
                {tab === 'policies'
                  ? '현재 정책은 외부 청년정책 API에서 실시간으로 조회됩니다. 관리자 노출 설정과 직접 등록 정책을 위한 운영 데이터 구조를 다음 단계에서 추가합니다.'
                  : '현재 지도 정보는 공공데이터 API에서 조회됩니다. 장소 직접 등록, 수정, 비노출 처리를 위해 관리용 장소 데이터를 별도로 추가합니다.'}
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
