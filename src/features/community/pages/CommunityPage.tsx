import {
  ChevronDown,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  PenLine,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { communityPosts } from '../mocks';
import '../styles/community.css';

function CommunityPage() {
  return (
    <div className="page community">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Community</p>
          <h1>커뮤니티</h1>
          <p>생존러들이 발견한 알뜰한 정보와 절약 경험을 나눠 보세요.</p>
        </div>
        <button className="button button--primary" type="button">
          <PenLine size={17} />글 작성하기
        </button>
      </div>

      <section className="community-highlight">
        <div className="community-highlight__icon">
          <Sparkles size={22} />
        </div>
        <div>
          <span>이번 주 절약 미션</span>
          <strong>배달 대신 직접 요리하고 인증하기</strong>
          <p>현재 128명의 생존러가 참여 중이에요.</p>
        </div>
        <button className="button button--soft" type="button">
          미션 보기
        </button>
      </section>

      <section className="community__toolbar" aria-label="게시판 필터">
        <div className="community__categories">
          {['전체', '자유게시판', '정보 공유', '절약 인증', '질문'].map((category, index) => (
            <button
              className={`chip ${index === 0 ? 'chip--active' : ''}`}
              type="button"
              key={category}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="community__tools">
          <label className="community__search">
            <Search size={16} />
            <input type="search" placeholder="게시글 검색" />
          </label>
          <button className="community__sort" type="button">
            최신순
            <ChevronDown size={15} />
          </button>
        </div>
      </section>

      <div className="community__layout">
        <section className="ui-card community-posts" aria-label="커뮤니티 게시글">
          <div className="community-posts__header">
            <p>
              전체 게시글 <strong>1,248</strong>
            </p>
            <span>서로 존중하는 대화를 부탁드려요.</span>
          </div>

          {communityPosts.map((post) => (
            <article className="community-post" key={post.id}>
              <div className="community-post__content">
                <div className="community-post__author">
                  <span>{post.avatar}</span>
                  <div>
                    <strong>{post.author}</strong>
                    <small>
                      {post.category} · {post.time}
                    </small>
                  </div>
                </div>

                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>

                <div className="community-post__tags">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>

                <div className="community-post__stats">
                  <span className="community-post__like">
                    <Heart size={14} />
                    {post.likes}
                  </span>
                  <span>
                    <MessageCircle size={14} />
                    {post.comments}
                  </span>
                  <span>
                    <Eye size={14} />
                    {post.views}
                  </span>
                </div>
              </div>

              <div
                className={`community-post__thumbnail community-post__thumbnail--${post.thumbnail}`}
                aria-label={`${post.title} 썸네일`}
              >
                {post.thumbnail === 'market' && (
                  <div className="community-thumbnail-market">
                    <span>SALE</span>
                    <strong>50%</strong>
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {post.thumbnail === 'meal' && (
                  <div className="community-thumbnail-meal">
                    <span>🥗</span>
                    <span>🍳</span>
                    <span>🍚</span>
                  </div>
                )}
                {post.thumbnail === 'house' && (
                  <div className="community-thumbnail-house">
                    <span>🏠</span>
                    <i>₩</i>
                  </div>
                )}
                {post.thumbnail === 'coffee' && (
                  <div className="community-thumbnail-coffee">
                    <span>☕</span>
                    <strong>-400원</strong>
                  </div>
                )}
              </div>
            </article>
          ))}

          <button className="community-posts__more" type="button">
            게시글 더 보기
          </button>
        </section>

        <aside className="community__aside">
          <article className="ui-card community-ranking">
            <div className="ui-card__header">
              <h2>
                <Flame size={17} />
                지금 인기 있는 글
              </h2>
            </div>
            <ol>
              <li>
                <span>1</span>
                <p>저렴하고 든든한 일주일 식단표</p>
                <small>댓글 31</small>
              </li>
              <li>
                <span>2</span>
                <p>이번 달 청년 지원금 일정 모음</p>
                <small>댓글 24</small>
              </li>
              <li>
                <span>3</span>
                <p>서울 무료 공부 공간 추천</p>
                <small>댓글 18</small>
              </li>
            </ol>
          </article>

          <article className="ui-card community-topics">
            <div className="ui-card__header">
              <h2>
                <TrendingUp size={17} />
                인기 주제
              </h2>
            </div>
            <div>
              {['#청년정책', '#무지출챌린지', '#자취요리', '#공공시설', '#카페할인'].map(
                (topic) => (
                  <button type="button" key={topic}>
                    {topic}
                  </button>
                ),
              )}
            </div>
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
