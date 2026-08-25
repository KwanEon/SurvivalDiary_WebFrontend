import { ArrowLeft, EyeOff, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getHiddenPolicies, restoreHiddenPolicy } from '../api';
import PolicyActionToast from '../components/PolicyActionToast';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import type { HiddenPolicySummary } from '../types';
import '../styles/hidden-policies.css';

const PAGE_SIZE = 100;

function formatHiddenAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '설정일 확인 필요';
  return `${new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)} 설정`;
}

function mergeHiddenPolicies(current: HiddenPolicySummary[], incoming: HiddenPolicySummary[]) {
  const byId = new Map(current.map((policy) => [policy.policyId, policy]));
  incoming.forEach((policy) => byId.set(policy.policyId, policy));
  return [...byId.values()];
}

function HiddenPoliciesPage() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<HiddenPolicySummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [restoringIds, setRestoringIds] = useState<Set<string>>(() => new Set());
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMoreError(null);

    void getHiddenPolicies(0, PAGE_SIZE, controller.signal)
      .then((response) => {
        setItems(response.content);
        setTotalElements(response.totalElements);
        setNextPage(response.hasNext ? response.page + 1 : null);
      })
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) setError(requestError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const loadMore = async () => {
    if (nextPage === null || moreLoading) return;
    setMoreLoading(true);
    setMoreError(null);
    try {
      const response = await getHiddenPolicies(nextPage, PAGE_SIZE);
      setItems((current) => mergeHiddenPolicies(current, response.content));
      setTotalElements(response.totalElements);
      setNextPage(response.hasNext ? response.page + 1 : null);
    } catch (requestError) {
      setMoreError(policyErrorMessage(requestError, '숨긴 정책을 더 불러오지 못했습니다.'));
    } finally {
      setMoreLoading(false);
    }
  };

  const restore = async (policy: HiddenPolicySummary) => {
    if (restoringIds.has(policy.policyId)) return;
    setRestoringIds((current) => new Set(current).add(policy.policyId));
    setActionMessage(null);
    setActionError(null);

    try {
      await restoreHiddenPolicy(policy.policyId);
      setItems((current) => current.filter((item) => item.policyId !== policy.policyId));
      setTotalElements((current) => Math.max(0, current - 1));
      setActionMessage(`${policy.title} 정책을 추천 목록에 다시 표시할게요.`);
    } catch (requestError) {
      setActionError(policyErrorMessage(requestError, '정책을 다시 표시하지 못했습니다.'));
    } finally {
      setRestoringIds((current) => {
        const next = new Set(current);
        next.delete(policy.policyId);
        return next;
      });
    }
  };

  return (
    <div className="page hidden-policies-page">
      <Link href="/policies" className="hidden-policies__back">
        <ArrowLeft size={17} /> 정책 목록으로
      </Link>

      <div className="page-heading">
        <div>
          <h1>관심 없음 정책</h1>
          <p>추천 목록에서 숨긴 정책을 확인하고 다시 표시할 수 있어요.</p>
        </div>
      </div>

      {loading ? (
        <PolicyStateView
          title="관심 없음 정책을 확인하고 있어요"
          description="계정에 저장된 숨김 목록을 불러오는 중입니다."
          loading
        />
      ) : error ? (
        <PolicyStateView
          title="목록을 불러오지 못했어요"
          description={policyErrorMessage(error, '관심 없음 정책을 불러오지 못했습니다.')}
          tone="danger"
          actionLabel="다시 시도"
          onAction={() => setReloadKey((current) => current + 1)}
        />
      ) : items.length === 0 ? (
        <PolicyStateView
          title="관심 없음 정책이 없어요"
          description="정책 목록에서 관심 없음을 선택한 정책이 이곳에 표시됩니다."
          actionLabel="정책 둘러보기"
          onAction={() => navigate('/policies')}
        />
      ) : (
        <>
          <div className="hidden-policies__summary">
            <span className="hidden-policies__summary-icon">
              <EyeOff size={18} aria-hidden="true" />
            </span>
            <p>
              총 <strong>{totalElements}개</strong>의 정책을 숨겨두었어요.
            </p>
          </div>

          <section className="hidden-policies__list" aria-label="관심 없음 정책 목록">
            {items.map((policy) => {
              const restoring = restoringIds.has(policy.policyId);
              return (
                <article className="ui-card hidden-policy-card" key={policy.policyId}>
                  <div className="hidden-policy-card__body">
                    <div className="hidden-policy-card__meta">
                      <span>{policy.category?.trim() || '기타 정책'}</span>
                      <span>{formatHiddenAt(policy.hiddenAt)}</span>
                    </div>
                    <h2>{policy.title}</h2>
                    {policy.shortSummary?.trim() ? <p>{policy.shortSummary}</p> : null}
                  </div>
                  <button
                    className="button button--soft hidden-policy-card__restore"
                    type="button"
                    disabled={restoring}
                    onClick={() => void restore(policy)}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {restoring ? '복원 중...' : '다시 보기'}
                  </button>
                </article>
              );
            })}
          </section>

          {moreError ? (
            <p className="hidden-policies__more-error" role="alert">
              {moreError}
            </p>
          ) : null}
          {nextPage !== null ? (
            <button
              className="hidden-policies__more"
              type="button"
              disabled={moreLoading}
              onClick={() => void loadMore()}
            >
              {moreLoading ? '정책을 더 불러오는 중...' : '숨긴 정책 더 보기'}
            </button>
          ) : null}
        </>
      )}

      {actionError ? (
        <PolicyActionToast
          message={actionError}
          tone="danger"
          onClose={() => setActionError(null)}
        />
      ) : actionMessage ? (
        <PolicyActionToast message={actionMessage} onClose={() => setActionMessage(null)} />
      ) : null}
    </div>
  );
}

export default HiddenPoliciesPage;
