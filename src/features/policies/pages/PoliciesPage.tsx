import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Filter,
  Landmark,
  MapPin,
  Palette,
  Search,
  Sparkles,
  TrainFront,
  UserRoundCheck,
} from 'lucide-react';
import { policies } from '../mocks';
import '../styles/policies.css';

const policyIcons = [Building2, BriefcaseBusiness, Landmark, Palette, TrainFront];

function PoliciesPage() {
  return (
    <div className="page policies">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Youth policy</p>
          <h1>청년 정책 추천</h1>
          <p>나에게 맞는 정책을 조건별로 살펴보고 신청 기회를 놓치지 마세요.</p>
        </div>
        <button className="button button--secondary" type="button">
          <UserRoundCheck size={17} />내 조건 수정
        </button>
      </div>

      <section className="policies-profile" aria-label="현재 추천 조건">
        <div className="policies-profile__title">
          <span>
            <Sparkles size={19} />
          </span>
          <div>
            <strong>생존러님을 위한 추천 조건</strong>
            <p>프로필 정보를 기준으로 신청 가능한 정책을 먼저 보여드려요.</p>
          </div>
        </div>
        <div className="policies-profile__conditions">
          <span>만 27세</span>
          <span>서울특별시</span>
          <span>구직 중</span>
        </div>
      </section>

      <section className="policies__filters" aria-label="정책 필터">
        <div className="policies__chips">
          {['전체', '주거·생활', '금융·자산', '취업·창업', '교육·역량', '문화·복지'].map(
            (filter, index) => (
              <button
                className={`chip ${index === 0 ? 'chip--active' : ''}`}
                type="button"
                key={filter}
              >
                {filter}
              </button>
            ),
          )}
        </div>
        <div className="policies__filter-actions">
          <label className="policies__search">
            <Search size={16} />
            <input type="search" placeholder="정책 이름 검색" />
          </label>
          <button className="policies__sort" type="button">
            마감 임박순
            <ChevronDown size={15} />
          </button>
          <button className="icon-button" type="button" aria-label="상세 필터">
            <Filter size={17} />
          </button>
        </div>
      </section>

      <div className="policies__result-meta">
        <p>
          신청 가능성이 높은 정책 <strong>12개</strong>
        </p>
        <span>업데이트 2024.05.12</span>
      </div>

      <section className="policies__list" aria-label="추천 정책 목록">
        {policies.map((policy, index) => {
          const Icon = policyIcons[index];
          return (
            <article className="ui-card policy-card" key={policy.id}>
              <span className={`policy-card__icon policy-card__icon--${policy.tone}`}>
                <Icon size={22} />
              </span>

              <div className="policy-card__body">
                <div className="policy-card__title-row">
                  <span className="status-badge">{policy.tag}</span>
                  <span className="policy-card__category">{policy.category}</span>
                </div>
                <h2>{policy.title}</h2>
                <p>{policy.summary}</p>
                <div className="policy-card__meta">
                  <span>
                    <MapPin size={13} />
                    {policy.region}
                  </span>
                  <span>
                    <UserRoundCheck size={13} />
                    {policy.target}
                  </span>
                  <span>
                    <CircleDollarSign size={13} />
                    {policy.benefit}
                  </span>
                </div>
              </div>

              <div className="policy-card__action">
                <button className="policy-card__bookmark" type="button" aria-label="정책 저장">
                  <Bookmark size={17} />
                </button>
                <span>신청 마감</span>
                <strong>{policy.deadline}</strong>
                <button className="button button--primary" type="button">
                  자세히 보기
                  <ExternalLink size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <button className="policies__more" type="button">
        더 많은 정책 보기
      </button>

      <article className="policies__notice">
        <span>
          <Landmark size={19} />
        </span>
        <div>
          <strong>정책 정보는 공공데이터 연동 후 최신화됩니다.</strong>
          <p>신청 전 반드시 해당 기관의 공고문에서 자격 요건과 마감일을 다시 확인해 주세요.</p>
        </div>
      </article>
    </div>
  );
}

export default PoliciesPage;
