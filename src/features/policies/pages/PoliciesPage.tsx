import { ArrowUpDown, History, Landmark, Search, Sparkles, UserRoundCheck } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useHistoryState } from 'wouter/use-browser-location';
import { ApiError } from '../../auth';
import {
  getPolicyPreference,
  getPolicyRecommendations,
  hidePolicy,
  restoreHiddenPolicy,
} from '../api';
import PolicyActionToast from '../components/PolicyActionToast';
import PolicyListSection from '../components/PolicyListSection';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import {
  POLICY_CATEGORY_OPTIONS,
  educationStatusLabel,
  regionLabel,
  workStatusLabel,
} from '../options';
import type {
  PolicyCategory,
  PolicyDetailNavigationState,
  PolicyHiddenNotice,
  PolicyListNavigationState,
  PolicyPreference,
  PolicySummary,
} from '../types';
import '../styles/policies.css';

const CATEGORY_VALUES = new Set<PolicyCategory>(
  POLICY_CATEGORY_OPTIONS.map((option) => option.value),
);

type PolicySort = 'recommendation' | 'deadline' | 'support';

const POLICY_SORT_OPTIONS: { value: PolicySort; label: string }[] = [
  { value: 'recommendation', label: '추천순' },
  { value: 'deadline', label: '마감 임박순' },
  { value: 'support', label: '지원 금액순' },
];

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

function isPresent(value: string | null): value is string {
  return Boolean(value);
}

function mergePolicies(current: PolicySummary[], incoming: PolicySummary[]) {
  const byId = new Map(current.map((policy) => [policy.policyId, policy]));
  incoming.forEach((policy) => byId.set(policy.policyId, policy));
  return [...byId.values()];
}

function recommendationRank(policy: PolicySummary) {
  const statusRank =
    policy.recommendationStatus === 'RECOMMENDED'
      ? 300
      : policy.recommendationStatus === 'CHECK_REQUIRED'
        ? 200
        : 100;
  return statusRank + policy.recommendationReasons.length;
}

function deadlineTimestamp(value: string | null) {
  if (!value) return null;
  const timestamp = new Date(value.includes('T') ? value : `${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareDeadline(a: PolicySummary, b: PolicySummary) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const aTimestamp = deadlineTimestamp(a.applicationEndDate);
  const bTimestamp = deadlineTimestamp(b.applicationEndDate);
  const aGroup = aTimestamp === null ? 2 : aTimestamp < todayTimestamp ? 1 : 0;
  const bGroup = bTimestamp === null ? 2 : bTimestamp < todayTimestamp ? 1 : 0;

  if (aGroup !== bGroup) return aGroup - bGroup;
  if (aTimestamp === null || bTimestamp === null) return 0;
  return aGroup === 1 ? bTimestamp - aTimestamp : aTimestamp - bTimestamp;
}

function supportCadenceRank(policy: PolicySummary) {
  if (policy.supportAmount === null) return 2;
  return policy.supportAmountType === 'MONTHLY' || policy.supportAmountType === 'MONTHLY_MAXIMUM'
    ? 1
    : 0;
}

function compareSupport(a: PolicySummary, b: PolicySummary) {
  const cadenceComparison = supportCadenceRank(a) - supportCadenceRank(b);
  if (cadenceComparison !== 0) return cadenceComparison;
  return (b.supportAmount ?? -1) - (a.supportAmount ?? -1);
}

function sortPolicies(policies: PolicySummary[], sort: PolicySort) {
  return [...policies].sort((a, b) => {
    const primaryComparison =
      sort === 'recommendation'
        ? recommendationRank(b) - recommendationRank(a)
        : sort === 'deadline'
          ? compareDeadline(a, b)
          : compareSupport(a, b);
    if (primaryComparison !== 0) return primaryComparison;

    const recommendationComparison = recommendationRank(b) - recommendationRank(a);
    if (recommendationComparison !== 0) return recommendationComparison;
    return a.title.localeCompare(b.title, 'ko-KR');
  });
}

function hiddenPolicyRequest(policy: PolicySummary) {
  const category = policy.category.trim().slice(0, 100);
  const shortSummary = (policy.shortSummary || policy.summary).trim().slice(0, 500);
  return {
    title: policy.title.trim().slice(0, 200) || '청년 정책',
    category: category || null,
    shortSummary: shortSummary || null,
  };
}

interface HiddenPolicyUndo extends PolicyHiddenNotice {
  listIndex?: number;
}

function PoliciesPage() {
  const [, navigate] = useLocation();
  const historyState = useHistoryState<PolicyListNavigationState | null>();
  const consumedHiddenNotice = useRef<string | null>(null);
  const initialFilters = readFilters();
  const [category, setCategory] = useState<PolicyCategory | null>(initialFilters.category);
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [keywordDraft, setKeywordDraft] = useState(initialFilters.keyword);
  const [sort, setSort] = useState<PolicySort>('recommendation');
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
  const [hidingPolicyIds, setHidingPolicyIds] = useState<Set<string>>(() => new Set());
  const [hiddenNotice, setHiddenNotice] = useState<HiddenPolicyUndo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    const notice = historyState?.hiddenPolicy;
    if (!notice) return;
    const noticeKey = `${notice.policyId}:${notice.hiddenAt}`;
    if (consumedHiddenNotice.current === noticeKey) return;
    consumedHiddenNotice.current = noticeKey;
    setActionError(null);
    setHiddenNotice(notice);
    window.history.replaceState(null, '', window.location.href);
  }, [historyState]);

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

  const handleHide = async (policy: PolicySummary) => {
    if (hidingPolicyIds.has(policy.policyId)) return;
    const listIndex = items.findIndex((item) => item.policyId === policy.policyId);
    setHidingPolicyIds((current) => new Set(current).add(policy.policyId));
    setItems((current) => current.filter((item) => item.policyId !== policy.policyId));
    setHiddenNotice(null);
    setActionError(null);

    try {
      const hidden = await hidePolicy(policy.policyId, hiddenPolicyRequest(policy));
      setHiddenNotice({
        policyId: policy.policyId,
        title: policy.title,
        hiddenAt: hidden.hiddenAt,
        summary: policy,
        listIndex,
      });
    } catch (error) {
      setItems((current) => {
        if (current.some((item) => item.policyId === policy.policyId)) return current;
        const restored = [...current];
        restored.splice(Math.max(0, Math.min(listIndex, restored.length)), 0, policy);
        return restored;
      });
      setActionError(policyErrorMessage(error, '정책을 관심 없음으로 설정하지 못했습니다.'));
    } finally {
      setHidingPolicyIds((current) => {
        const next = new Set(current);
        next.delete(policy.policyId);
        return next;
      });
    }
  };

  const handleUndoHide = async () => {
    if (!hiddenNotice || undoing) return;
    setUndoing(true);
    setActionError(null);
    try {
      await restoreHiddenPolicy(hiddenNotice.policyId);
      if (hiddenNotice.summary) {
        setItems((current) => {
          if (current.some((item) => item.policyId === hiddenNotice.policyId)) return current;
          const restored = [...current];
          const listIndex = hiddenNotice.listIndex ?? 0;
          restored.splice(
            Math.max(0, Math.min(listIndex, restored.length)),
            0,
            hiddenNotice.summary!,
          );
          return restored;
        });
      }
      if (hiddenNotice.listIndex === undefined) {
        setListReloadKey((current) => current + 1);
      }
      setHiddenNotice(null);
    } catch (error) {
      setActionError(policyErrorMessage(error, '정책을 다시 표시하지 못했습니다.'));
    } finally {
      setUndoing(false);
    }
  };

  const sortedItems = sortPolicies(items, sort);
  const recommendedPolicies = sortedItems.filter(
    (policy) => policy.recommendationStatus === 'RECOMMENDED',
  );
  const checkRequiredPolicies = sortedItems.filter(
    (policy) => policy.recommendationStatus === 'CHECK_REQUIRED',
  );
  const discoverPolicies = sortedItems.filter(
    (policy) => policy.recommendationStatus === 'DISCOVER',
  );

  const openPolicy = (policy: PolicySummary) => {
    navigate(`/policies/${encodeURIComponent(policy.policyId)}`, {
      state: { summary: policy } satisfies PolicyDetailNavigationState,
    });
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
        <div className="policies__heading-actions">
          <Link href="/policies/hidden" className="button button--soft">
            <History size={17} /> 관심 없음 정책
          </Link>
          <Link href="/policies/conditions" className="button button--secondary">
            <UserRoundCheck size={17} /> 내 조건 수정
          </Link>
        </div>
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
              <label className="policies__sort-control">
                <ArrowUpDown size={16} aria-hidden="true" />
                <span className="sr-only">정책 정렬 기준</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as PolicySort)}
                >
                  {POLICY_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
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
            <div className="policies__sections">
              {keyword ? (
                <PolicyListSection
                  id="policy-search-results"
                  title={`“${keyword}” 검색 결과`}
                  description={`${items.length}개의 정책을 찾았어요. 상태와 관계없이 선택한 기준으로 정렬합니다.`}
                  policies={sortedItems}
                  hidingPolicyIds={hidingPolicyIds}
                  onOpen={openPolicy}
                  onHide={(policy) => void handleHide(policy)}
                />
              ) : (
                <>
                  <PolicyListSection
                    id="policy-recommended-section"
                    title="내게 잘 맞는 정책"
                    description="저장한 상황과 신청 조건이 잘 맞는 정책이에요."
                    policies={recommendedPolicies}
                    featuredFirst
                    hidingPolicyIds={hidingPolicyIds}
                    onOpen={openPolicy}
                    onHide={(policy) => void handleHide(policy)}
                  />
                  <PolicyListSection
                    id="policy-check-required-section"
                    title="조건을 확인해 볼 정책"
                    description="관련성은 있지만 신청 전에 확인할 내용이 있어요."
                    policies={checkRequiredPolicies}
                    hidingPolicyIds={hidingPolicyIds}
                    onOpen={openPolicy}
                    onHide={(policy) => void handleHide(policy)}
                  />
                  <PolicyListSection
                    id="policy-discover-section"
                    title="더 둘러볼 정책"
                    description="추천 조건과 관계없이 함께 확인할 수 있어요."
                    policies={discoverPolicies}
                    hidingPolicyIds={hidingPolicyIds}
                    onOpen={openPolicy}
                    onHide={(policy) => void handleHide(policy)}
                  />
                </>
              )}
            </div>
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

      {actionError ? (
        <PolicyActionToast
          message={actionError}
          tone="danger"
          onClose={() => setActionError(null)}
        />
      ) : hiddenNotice ? (
        <PolicyActionToast
          message={`${hiddenNotice.title} 정책을 목록에서 숨겼어요.`}
          actionLabel="실행 취소"
          actionPending={undoing}
          onAction={() => void handleUndoHide()}
          onClose={() => setHiddenNotice(null)}
        />
      ) : null}
    </div>
  );
}

export default PoliciesPage;
