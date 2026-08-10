import {
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  GraduationCap,
  Landmark,
  MapPin,
  Search,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ApiError } from '../../auth';
import { getPolicyPreference, getPolicyRecommendations } from '../api';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import {
  POLICY_CATEGORY_OPTIONS,
  educationStatusLabel,
  regionLabel,
  workStatusLabel,
} from '../options';
import type {
  PolicyApplicationPeriodType,
  PolicyCategory,
  PolicyPreference,
  PolicySummary,
  PolicySupportAmountType,
} from '../types';
import '../styles/policies.css';

const CATEGORY_VISUALS = {
  EMPLOYMENT: { icon: BriefcaseBusiness, tone: 'purple', label: '일자리' },
  HOUSING: { icon: Building2, tone: 'coral', label: '주거' },
  EDUCATION: { icon: GraduationCap, tone: 'blue', label: '교육' },
  WELFARE_CULTURE: { icon: Landmark, tone: 'mint', label: '복지·문화' },
  PARTICIPATION_RIGHTS: { icon: UsersRound, tone: 'yellow', label: '참여·권리' },
} as const;

const CATEGORY_VALUES = new Set<PolicyCategory>(
  POLICY_CATEGORY_OPTIONS.map((option) => option.value),
);

function readFilters() {
  const params = new URLSearchParams(window.location.search);
  const categoryValue = params.get('category');
  return {
    category:
      categoryValue && CATEGORY_VALUES.has(categoryValue as PolicyCategory)
        ? (categoryValue as PolicyCategory)
        : null,
    keyword: (params.get('keyword') ?? '').trim().slice(0, 50),
  };
}

function writeFilters(category: PolicyCategory | null, keyword: string, replace = false) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (keyword) params.set('keyword', keyword);
  const nextUrl = `/policies${params.size > 0 ? `?${params.toString()}` : ''}`;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', nextUrl);
}

function formatSupportAmount(amount: number, type: PolicySupportAmountType | null) {
  const formatted = `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
  switch (type) {
    case 'MAXIMUM':
      return `최대 ${formatted}`;
    case 'MONTHLY':
      return `월 ${formatted}`;
    case 'MONTHLY_MAXIMUM':
      return `월 최대 ${formatted}`;
    default:
      return formatted;
  }
}

function supportLabel(policy: PolicySummary) {
  if (policy.supportAmount !== null) {
    return formatSupportAmount(policy.supportAmount, policy.supportAmountType);
  }
  return policy.supportText || '지원 내용 확인';
}

function periodLabel(type: PolicyApplicationPeriodType, endDate: string | null, raw: string) {
  if (endDate) return endDate;
  switch (type) {
    case 'ALWAYS':
      return '상시 신청';
    case 'CLOSED':
      return '신청 마감';
    case 'UNTIL_BUDGET':
      return '예산 소진 시까지';
    default:
      return raw || '기간 확인 필요';
  }
}

function isPresent(value: string | null): value is string {
  return Boolean(value);
}

function mergePolicies(current: PolicySummary[], incoming: PolicySummary[]) {
  const byId = new Map(current.map((policy) => [policy.policyId, policy]));
  incoming.forEach((policy) => byId.set(policy.policyId, policy));
  return [...byId.values()];
}

function PoliciesPage() {
  const [, navigate] = useLocation();
  const initialFilters = readFilters();
  const [category, setCategory] = useState<PolicyCategory | null>(initialFilters.category);
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [keywordDraft, setKeywordDraft] = useState(initialFilters.keyword);
  const [preference, setPreference] = useState<PolicyPreference | null>(null);
  const [preferenceLoading, setPreferenceLoading] = useState(true);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [preferenceReloadKey, setPreferenceReloadKey] = useState(0);
  const [items, setItems] = useState<PolicySummary[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [checkedPages, setCheckedPages] = useState(0);
  const [partialResult, setPartialResult] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<unknown>(null);
  const [listReloadKey, setListReloadKey] = useState(0);
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      const filters = readFilters();
      setCategory(filters.category);
      setKeyword(filters.keyword);
      setKeywordDraft(filters.keyword);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPreferenceLoading(true);
    setPreferenceError(null);

    void getPolicyPreference(controller.signal)
      .then(setPreference)
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setPreferenceError(policyErrorMessage(error, '정책 추천 조건을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreferenceLoading(false);
      });

    return () => controller.abort();
  }, [preferenceReloadKey]);

  useEffect(() => {
    if (!preference?.saved) {
      setItems([]);
      setNextPage(null);
      setCheckedPages(0);
      return;
    }

    const controller = new AbortController();
    setListLoading(true);
    setListError(null);
    setMoreError(null);
    setItems([]);
    setNextPage(null);

    void getPolicyRecommendations(
      { category, keyword: keyword || null, page: 1, size: 20 },
      controller.signal,
    )
      .then((response) => {
        setItems(response.items);
        setNextPage(response.nextPage);
        setCheckedPages(response.checkedProviderPages);
        setPartialResult(response.partialResult);
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setListError(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });

    return () => controller.abort();
  }, [category, keyword, listReloadKey, preference?.saved]);

  const applyFilters = (nextCategory: PolicyCategory | null, nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim().slice(0, 50);
    writeFilters(nextCategory, normalizedKeyword);
    setCategory(nextCategory);
    setKeyword(normalizedKeyword);
    setKeywordDraft(normalizedKeyword);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters(category, keywordDraft);
  };

  const loadMore = async () => {
    if (!nextPage || moreLoading) return;
    setMoreLoading(true);
    setMoreError(null);
    try {
      const response = await getPolicyRecommendations({
        category,
        keyword: keyword || null,
        page: nextPage,
        size: 20,
      });
      setItems((current) => mergePolicies(current, response.items));
      setNextPage(response.nextPage);
      setCheckedPages((current) => current + response.checkedProviderPages);
      setPartialResult(response.partialResult);
    } catch (error) {
      setMoreError(policyErrorMessage(error, '다음 정책을 불러오지 못했습니다.'));
    } finally {
      setMoreLoading(false);
    }
  };

  const profileConditions = preference
    ? [
        preference.age ? `만 ${preference.age}세` : null,
        regionLabel(preference.regionCode),
        preference.jobSeeking ? '구직 중' : workStatusLabel(preference.workStatus),
        educationStatusLabel(preference.educationStatus),
      ].filter(isPresent)
    : [];

  if (preferenceLoading) {
    return (
      <div className="page policies">
        <PolicyStateView
          title="추천 조건을 확인하고 있어요"
          description="로그인한 계정의 정책 조건을 불러오는 중입니다."
          loading
        />
      </div>
    );
  }

  if (preferenceError) {
    return (
      <div className="page policies">
        <PolicyStateView
          title="추천 조건을 불러오지 못했어요"
          description={preferenceError}
          tone="danger"
          actionLabel="다시 시도"
          onAction={() => setPreferenceReloadKey((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className="page policies">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Youth policy</p>
          <h1>청년 정책 추천</h1>
          <p>저장한 조건과 관련성이 높은 정책 후보를 확인해 보세요.</p>
        </div>
        <Link href="/policies/conditions" className="button button--secondary">
          <UserRoundCheck size={17} />내 조건 수정
        </Link>
      </div>

      {!preference?.saved ? (
        <PolicyStateView
          title="먼저 내 정책 조건을 알려주세요"
          description="나이와 거주 지역을 저장하면 조건에 맞는 정책 후보를 찾아드려요."
          actionLabel="조건 입력하기"
          onAction={() => navigate('/policies/conditions')}
        />
      ) : (
        <>
          <section className="policies-profile" aria-label="현재 추천 조건">
            <div className="policies-profile__title">
              <span>
                <Sparkles size={19} />
              </span>
              <div>
                <strong>저장한 조건을 기준으로 추천 중이에요</strong>
                <p>추천은 신청 자격 확정이 아니므로 공식 공고를 꼭 확인해 주세요.</p>
              </div>
            </div>
            <div className="policies-profile__conditions">
              {profileConditions.map((condition) => (
                <span key={condition}>{condition}</span>
              ))}
            </div>
          </section>

          <section className="policies__filters" aria-label="정책 필터">
            <div className="policies__chips">
              <button
                className={`chip ${category === null ? 'chip--active' : ''}`}
                type="button"
                onClick={() => applyFilters(null, keyword)}
              >
                전체
              </button>
              {POLICY_CATEGORY_OPTIONS.map((option) => (
                <button
                  className={`chip ${category === option.value ? 'chip--active' : ''}`}
                  type="button"
                  key={option.value}
                  onClick={() => applyFilters(option.value, keyword)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="policies__filter-actions">
              <form className="policies__search" role="search" onSubmit={handleSearch}>
                <Search size={16} aria-hidden="true" />
                <label className="sr-only" htmlFor="policy-keyword">
                  정책 이름 검색
                </label>
                <input
                  id="policy-keyword"
                  type="search"
                  maxLength={50}
                  placeholder="정책 이름 검색"
                  value={keywordDraft}
                  onChange={(event) => setKeywordDraft(event.target.value)}
                />
                <button type="submit">검색</button>
              </form>
              <span className="policies__sort-label">백엔드 추천순</span>
              {category || keyword ? (
                <button
                  className="policies__reset"
                  type="button"
                  onClick={() => applyFilters(null, '')}
                >
                  필터 초기화
                </button>
              ) : null}
            </div>
          </section>

          <div className="policies__result-meta">
            <p>
              현재 확인한 정책 <strong>{items.length}개</strong>
            </p>
            {checkedPages > 0 ? <span>외부 데이터 {checkedPages}페이지 확인</span> : null}
          </div>

          {listLoading ? (
            <PolicyStateView
              title="맞춤 정책을 찾고 있어요"
              description="저장한 조건과 정책 대상 정보를 비교하고 있습니다."
              loading
            />
          ) : listError ? (
            <PolicyStateView
              title={
                listError instanceof ApiError && listError.code === 'Y005'
                  ? '정책 조건을 다시 저장해 주세요'
                  : '정책 목록을 불러오지 못했어요'
              }
              description={policyErrorMessage(listError, '정책 목록을 불러오지 못했습니다.')}
              tone="danger"
              actionLabel={
                listError instanceof ApiError && listError.code === 'Y005'
                  ? '조건 입력하기'
                  : '다시 시도'
              }
              onAction={() =>
                listError instanceof ApiError && listError.code === 'Y005'
                  ? navigate('/policies/conditions')
                  : setListReloadKey((current) => current + 1)
              }
            />
          ) : items.length === 0 ? (
            <PolicyStateView
              title="조건에 맞는 정책을 찾지 못했어요"
              description="카테고리나 검색어를 초기화한 뒤 다시 확인해 보세요."
              actionLabel={category || keyword ? '필터 초기화' : undefined}
              onAction={category || keyword ? () => applyFilters(null, '') : undefined}
            />
          ) : (
            <section className="policies__list" aria-label="추천 정책 목록">
              {items.map((policy) => {
                const visual = CATEGORY_VISUALS[policy.categoryType];
                const Icon = visual.icon;
                const reason = policy.recommendationReasons[0] ?? policy.eligibilityReasons[0];
                return (
                  <article className="ui-card policy-card" key={policy.policyId}>
                    <span className={`policy-card__icon policy-card__icon--${visual.tone}`}>
                      <Icon size={22} />
                    </span>

                    <div className="policy-card__body">
                      <div className="policy-card__title-row">
                        <span className="status-badge">
                          {policy.recommendationStatus === 'RECOMMENDED'
                            ? '추천'
                            : policy.recommendationStatus === 'DISCOVER'
                              ? '둘러보기'
                              : '확인 필요'}
                        </span>
                        <span className="policy-card__category">{visual.label}</span>
                      </div>
                      <h2>{policy.title}</h2>
                      <p>{policy.shortSummary || policy.summary}</p>
                      {reason ? <p className="policy-card__reason">{reason}</p> : null}
                      <div className="policy-card__meta">
                        <span>
                          <MapPin size={13} />
                          {policy.agency || '기관 확인'}
                        </span>
                        <span>
                          <UserRoundCheck size={13} />
                          {policy.target || '지원 대상 확인'}
                        </span>
                        <span>
                          <CircleDollarSign size={13} />
                          {supportLabel(policy)}
                        </span>
                      </div>
                    </div>

                    <div className="policy-card__action">
                      <span>{policy.applicationEndDate ? '신청 마감' : '신청 기간'}</span>
                      <strong>
                        {periodLabel(
                          policy.applicationPeriodType,
                          policy.applicationEndDate,
                          policy.applicationPeriodText,
                        )}
                      </strong>
                      <small>상세 정보는 다음 단계에서 연결됩니다.</small>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {partialResult ? (
            <p className="policies__partial-notice">
              외부 제공처 조회 범위에 따라 일부 정책만 표시될 수 있습니다.
            </p>
          ) : null}

          {moreError ? (
            <p className="policies__more-error" role="alert">
              {moreError}
            </p>
          ) : null}
          {nextPage && !listLoading && !listError ? (
            <button
              className="policies__more"
              type="button"
              onClick={() => void loadMore()}
              disabled={moreLoading}
            >
              {moreLoading ? '정책을 더 불러오는 중...' : '더 많은 정책 보기'}
            </button>
          ) : null}

          <article className="policies__notice">
            <span>
              <Landmark size={19} />
            </span>
            <div>
              <strong>추천 결과는 신청 가능 여부를 확정하지 않습니다.</strong>
              <p>신청 전 반드시 해당 기관의 공식 공고에서 자격 요건과 기간을 확인해 주세요.</p>
            </div>
          </article>
        </>
      )}
    </div>
  );
}

export default PoliciesPage;
