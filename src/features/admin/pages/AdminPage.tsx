import { BarChart3, FileText, MapPinned, MessageCircleMore, Search, ShieldCheck, UsersRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { answerAdminPost, deleteAdminPost, getAdminPosts, getAdminUserExpenses, getAdminUsers, type AdminExpense, type AdminUser } from '../api';
import type { CommunityPost } from '../../community/types';
import '../styles/admin.css';

type AdminTab = 'overview' | 'users' | 'community' | 'policies' | 'map';
const tabs: Array<{ id: AdminTab; label: string; icon: typeof UsersRound }> = [
  { id: 'overview', label: '운영 현황', icon: BarChart3 }, { id: 'users', label: '회원·지출', icon: UsersRound }, { id: 'community', label: '커뮤니티·문의', icon: MessageCircleMore }, { id: 'policies', label: '정책 관리', icon: FileText }, { id: 'map', label: '지도 관리', icon: MapPinned },
];
const money = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [answer, setAnswer] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tab === 'users') void loadUsers(); }, [tab]);
  useEffect(() => { if (tab === 'community') void loadPosts(); }, [tab]);
  const loadUsers = async (search = query) => { setLoading(true); try { const response = await getAdminUsers(search); setUsers(response.content); } finally { setLoading(false); } };
  const loadPosts = async () => { setLoading(true); try { setPosts((await getAdminPosts()).content); } finally { setLoading(false); } };
  const selectUser = async (user: AdminUser) => { setSelectedUser(user); setExpenses(await getAdminUserExpenses(user.userId)); };
  const submitAnswer = async (postId: number) => { const content = answer[postId]?.trim(); if (!content) return; await answerAdminPost(postId, content); setAnswer((current) => ({ ...current, [postId]: '' })); };
  const removePost = async (postId: number) => { if (!window.confirm('게시글을 삭제할까요?')) return; await deleteAdminPost(postId); setPosts((current) => current.filter((post) => post.postId !== postId)); };

  return <div className="page admin-page">
    <div className="page-heading"><div><p className="page-heading__eyebrow">Admin</p><h1>관리자 센터</h1><p>회원, 지출, 정책, 지도, 커뮤니티와 문의를 운영합니다.</p></div><span className="admin-page__badge"><ShieldCheck size={16} /> 관리자 전용</span></div>
    <div className="admin-console"><aside className="admin-sidebar"><strong>관리 메뉴</strong><nav className="admin-tabs" aria-label="관리자 메뉴">{tabs.map(({ id, label, icon: Icon }) => <button type="button" className={tab === id ? 'admin-tabs__active' : ''} onClick={() => setTab(id)} key={id}><Icon size={16} />{label}</button>)}</nav></aside><main className="admin-console__content">
    {tab === 'overview' && <section className="admin-page__menu">{tabs.slice(1).map(({ id, label, icon: Icon }) => <button className="ui-card admin-menu-card" type="button" onClick={() => setTab(id)} key={id}><span><Icon size={22} /></span><h2>{label}</h2><p>{id === 'users' ? '회원 목록과 회원별 지출 내역을 확인합니다.' : id === 'community' ? '전체 게시글을 관리하고 질문에 답변합니다.' : id === 'policies' ? '정책 외부 데이터의 노출 운영 기능을 준비합니다.' : '공공 지도 데이터와 직접 등록 장소를 관리합니다.'}</p></button>)}</section>}
    {tab === 'users' && <section className="admin-workspace"><div className="admin-workspace__header"><h2>회원 및 지출 관리</h2><form onSubmit={(event) => { event.preventDefault(); void loadUsers(); }}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이메일 또는 닉네임 검색" /><button type="submit">검색</button></form></div><div className="admin-workspace__grid"><article className="ui-card admin-table-card"><table><thead><tr><th>회원</th><th>권한</th><th>가입일</th></tr></thead><tbody>{users.map((user) => <tr key={user.userId} className={selectedUser?.userId === user.userId ? 'is-selected' : ''} onClick={() => void selectUser(user)}><td><strong>{user.nickname ?? user.name}</strong><small>{user.email}</small></td><td>{user.role}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!loading && users.length === 0 && <p className="admin-empty">조회된 회원이 없습니다.</p>}</article><article className="ui-card admin-expenses"><div className="ui-card__header"><h2><WalletCards size={17} /> 회원별 지출</h2></div>{selectedUser ? <><strong>{selectedUser.nickname ?? selectedUser.name}</strong>{expenses.length ? <ul>{expenses.map((expense) => <li key={expense.expenseId}><span>{expense.title}<small>{new Date(expense.spentAt).toLocaleDateString()}</small></span><strong>{money.format(expense.amount)}</strong></li>)}</ul> : <p className="admin-empty">지출 내역이 없습니다.</p>}</> : <p className="admin-empty">회원을 선택하면 지출 내역이 표시됩니다.</p>}</article></div></section>}
    {tab === 'community' && <section className="admin-workspace"><div className="admin-workspace__header"><h2>커뮤니티 및 질문 관리</h2><button type="button" onClick={() => void loadPosts()}>새로고침</button></div><div className="admin-post-list">{posts.map((post) => <article className="ui-card admin-post" key={post.postId}><div><span>{post.category}</span><h2>{post.title}</h2><p>{post.nickname ?? post.author} · {new Date(post.createdAt).toLocaleString()}</p></div><button type="button" className="button button--soft" onClick={() => void removePost(post.postId)}>삭제</button>{post.category === '질문' && <div className="admin-answer"><input value={answer[post.postId] ?? ''} onChange={(event) => setAnswer((current) => ({ ...current, [post.postId]: event.target.value }))} placeholder="관리자 답변을 입력하세요" maxLength={1000} /><button type="button" className="button button--primary" onClick={() => void submitAnswer(post.postId)}>답변 등록</button></div>}</article>)}</div>{!loading && posts.length === 0 && <p className="admin-empty">관리할 게시글이 없습니다.</p>}</section>}
    {(tab === 'policies' || tab === 'map') && <section className="ui-card admin-notice"><h2>{tab === 'policies' ? '정책 관리 준비' : '지도 관리 준비'}</h2><p>{tab === 'policies' ? '현재 정책은 외부 청년정책 API에서 실시간으로 조회됩니다. 관리자 노출 설정과 직접 등록 정책을 위한 운영 데이터 구조를 다음 단계에서 추가합니다.' : '현재 지도 정보는 공공데이터 API에서 조회됩니다. 장소 직접 등록, 수정, 비노출 처리를 위해 관리용 장소 데이터를 별도로 추가합니다.'}</p></section>}</main></div>
  </div>;
}

export default AdminPage;
