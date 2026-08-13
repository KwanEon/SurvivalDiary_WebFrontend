import { Eye, Flame, Heart, MessageCircle, PenLine, Search, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getCommunityPosts, getPopularCommunityPosts } from '../api';
import type { CommunityPost } from '../types';
import '../styles/community.css';

const categories = [
  { label: '전체', value: undefined },
  { label: '자유게시판', value: 'FREE' },
  { label: '정보 공유', value: 'INFO' },
  { label: '절약 인증', value: 'CERTIFICATION' },
  { label: '질문', value: 'QUESTION' },
];

function toBackendCategory(category: string | undefined) {
  return ({ FREE: '자유게시판', INFO: '정보 공유', CERTIFICATION: '절약 인증', QUESTION: '질문' } as Record<string, string>)[category ?? ''] ?? category;
}

function getThumbnailUrl(post: CommunityPost) {
  if (post.imageUrls[0]) return post.imageUrls[0];
  const document = new DOMParser().parseFromString(post.content, 'text/html');
  return document.querySelector('img')?.getAttribute('src') ?? null;
}

function getListPreview(content: string) {
  const document = new DOMParser().parseFromString(content, 'text/html');
  document.querySelectorAll('img').forEach((image) => image.remove());
  const text = (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text.split(/[.!?\n]/)[0]?.trim() ?? '';
}

function CommunityThumbnail({ post }: { post: CommunityPost }) {
  const thumbnailUrl = getThumbnailUrl(post);
  return <div className="community-post__thumbnail community-post__thumbnail--market" aria-hidden="true">
    {thumbnailUrl ? <img src={thumbnailUrl} alt="" /> : <strong>절약</strong>}
  </div>;
}

function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getCommunityPosts(toBackendCategory(category), page, pageSize, controller.signal)
      .then((response) => {
        setPosts(response.content.filter((post) => post.authorRole !== 'ADMIN'));
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError('게시글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    getPopularCommunityPosts(5, controller.signal)
      .then((response) => {
        const visiblePosts = response.content.filter((post) => post.authorRole !== 'ADMIN');
        if (visiblePosts.length > 0) setPopularPosts(visiblePosts);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        // The fallback below keeps the ranking visible while the backend endpoint is unavailable.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (popularPosts.length > 0 || posts.length === 0) return;
    setPopularPosts([...posts]
      .sort((left, right) => (right.likeCount * 3 + right.commentCount * 2) - (left.likeCount * 3 + left.commentCount * 2))
      .slice(0, 5));
  }, [posts, popularPosts.length]);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchedPosts = !normalized ? posts : posts.filter((post) =>
      `${post.title} ${post.content} ${post.hashtags.join(' ')}`.toLowerCase().includes(normalized),
    );
    return [...matchedPosts].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [posts, query]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 2, Math.max(totalPages - 5, 0)));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <div className="page community">
      <div className="page-heading">
        <div>
          <h1>커뮤니티</h1>
          <p>생존일기를 발견하고 절약 정보와 경험을 나눠보세요.</p>
        </div>
        <Link className="button button--primary" href="/community/new">
          <PenLine size={17} /> 글 작성하기
        </Link>
      </div>

      <section className="community-highlight">
        <div className="community-highlight__icon"><Sparkles size={22} /></div>
        <div>
          <span>이번 주 절약 미션</span>
          <strong>배달 대신 직접 요리하고 인증하기</strong>
          <p>작은 실천을 기록하고 다른 생존일기 회원들과 공유해 보세요.</p>
        </div>
      </section>

      <section className="community__toolbar" aria-label="게시글 필터">
        <div className="community__categories">
          {categories.map((item) => (
            <button
              className={`chip ${category === item.value ? 'chip--active' : ''}`}
              type="button"
              key={item.label}
              onClick={() => { setCategory(item.value); setPage(0); }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="community__tools">
        <label className="community__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="게시글 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="community__page-size">보기 <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}><option value={10}>10개</option><option value={30}>30개</option><option value={60}>60개</option></select></label>
        </div>
      </section>

      <div className="community__layout">
        <section className="ui-card community-posts" aria-label="커뮤니티 게시글">
          <div className="community-posts__header">
            <p>게시글 <strong>{query.trim() ? filteredPosts.length : totalElements}</strong></p>
            <span>서로 존중하는 대화를 나눠주세요.</span>
          </div>

          {loading && <p className="community-posts__state">게시글을 불러오는 중이에요.</p>}
          {!loading && error && <p className="community-posts__state">{error}</p>}
          {!loading && !error && filteredPosts.length === 0 && (
            <p className="community-posts__state">조건에 맞는 게시글이 없어요.</p>
          )}
          {!loading && !error && filteredPosts.map((post) => (
            <Link className="community-post" href={`/community/${post.postId}`} key={post.postId}>
              <div className="community-post__content">
                <div className="community-post__author">
                  <span>{(post.nickname ?? post.author).slice(0, 1)}</span>
                  <div>
                    <strong>{post.nickname ?? post.author}</strong>
                    <small>{post.category} · {new Date(post.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
                <h2>{post.title}</h2>
                <p>{getListPreview(post.content)}</p>
                <div className="community-post__tags">
                  {post.hashtags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
                <div className="community-post__stats">
                  <span className="community-post__like"><Heart size={14} />{post.likeCount}</span>
                  <span><MessageCircle size={14} />{post.commentCount}</span>
                  <span><Eye size={14} />조회</span>
                </div>
              </div>
              <CommunityThumbnail post={post} />
            </Link>
          ))}
          {!loading && !error && !query.trim() && totalPages > 1 && <nav className="community-pagination" aria-label="게시글 페이지 이동"><button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>이전</button>{pageNumbers.map((pageNumber) => <button type="button" className={pageNumber === page ? 'community-pagination__current' : ''} aria-current={pageNumber === page ? 'page' : undefined} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber + 1}</button>)}<button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}>다음</button></nav>}
        </section>

        <aside className="community__aside">
          <article className="ui-card community-ranking">
            <div className="ui-card__header"><h2><Flame size={17} /> 인기 게시글</h2></div>
            {popularPosts.length > 0 && <ol>{popularPosts.map((post, index) => <li key={post.postId}><span>{index + 1}</span><Link href={`/community/${post.postId}`}><p>{post.title}</p><small>좋아요 {post.likeCount} · 댓글 {post.commentCount}</small></Link></li>)}</ol>}
            <div className="ui-card__header"><h2><Flame size={17} /> 인기 게시글</h2></div>
            <p className="community-posts__state">인기 게시글은 준비 중이에요.</p>
          </article>
          <article className="ui-card community-topics">
            <div className="ui-card__header"><h2><TrendingUp size={17} /> 인기 주제</h2></div>
            <div>{['#청년정책', '#절약인증', '#공공시설', '#생활비절약'].map((topic) => <button type="button" key={topic} onClick={() => setQuery(topic.slice(1))}>{topic}</button>)}</div>
          </article>
          <article className="community-guide">
            <strong>커뮤니티 이용 안내</strong>
            <p>광고, 개인정보 노출, 비방 게시글은 관리자에 의해 숨김 처리될 수 있어요.</p>
          </article>
        </aside>
      </div>
    </div>
  );
}

export default CommunityPage;
