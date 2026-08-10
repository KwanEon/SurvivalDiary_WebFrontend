import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  EyeOff,
  ExternalLink,
  FileCheck2,
  Info,
  Landmark,
  Link2,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useHistoryState } from 'wouter/use-browser-location';
import { ApiError } from '../../auth';
import { getPolicyDetail, hidePolicy } from '../api';
import PolicyExternalLinkDialog, {
  isAllowedPolicyExternalUrl,
  type PolicyExternalLinkRequest,
} from '../components/PolicyExternalLinkDialog';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import { POLICY_CATEGORY_OPTIONS } from '../options';
import type {
  PolicyDetail,
  PolicyDetailNavigationState,
  PolicyListNavigationState,
  PolicyOfficialLinkType,
  PolicySummary,
  PolicySupportAmountType,
} from '../types';
import '../styles/policy-detail.css';

interface DeadlinePresentation {
  label: string;
  tone: 'danger' | 'warning' | 'primary';
}

function decodePolicyId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function fallbackDetail(summary: PolicySummary): PolicyDetail {
  return {
    policyId: summary.policyId,
    category: summary.category,
    categoryType: summary.categoryType,
    title: summary.title,
    description: summary.summary,
    supportAmount: summary.supportAmount,
    supportAmountType: summary.supportAmountType,
    supportText: summary.supportText,
    applicationPeriodText: summary.applicationPeriodText,
    applicationPeriodType: summary.applicationPeriodType,
    applicationStartDate: summary.applicationStartDate,
    applicationEndDate: summary.applicationEndDate,
    target: summary.target,
    agency: summary.agency,
    operatingAgency: summary.agency,
    applicationMethod: '상세 조회 후 확인할 수 있어요.',
    documents: [],
    officialUrl: null,
    officialLinkType: 'UNAVAILABLE',
    referenceUrls: [],
  };
}

function normalizePolicyText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+([○●◎◦□■▪▫◆◇▶▷▸▹※•ㆍ])/g, '\n$1')
    .split('\n')
    .map((line) =>
      line
        .trim()
        .replace(/^(?:[○●◎◦□■▪▫◆◇▶▷▸▹※•ㆍ]\s*|[-*]\s+)/, '• ')
        .replace(/[ \t]+/g, ' '),
    )
    .filter(Boolean)
    .join('\n');
}

function policyTextItems(value: string) {
  return normalizePolicyText(value)
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);
}

function formatSupportAmount(amount: number) {
  return `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
}

function supportTitle(type: PolicySupportAmountType | null) {
  switch (type) {
    case 'MAXIMUM':
      return '최대 지원액';
    case 'MONTHLY':
      return '월 지원액';
    case 'MONTHLY_MAXIMUM':
      return '월 최대 지원액';
    default:
      return '지원 금액';
  }
}

function applicationPeriodLabel(policy: PolicyDetail) {
  switch (policy.applicationPeriodType) {
    case 'ALWAYS':
      return '상시 신청';
    case 'CLOSED':
      return '접수 마감';
    case 'UNTIL_BUDGET':
      return '예산 소진 시까지';
    default:
      return policy.applicationPeriodText?.trim() || '신청 기간 확인 필요';
  }
}

function parseLocalDate(value: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function deadlinePresentation(endDate: string | null): DeadlinePresentation | null {
  const deadline = parseLocalDate(endDate);
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return { label: '접수 마감', tone: 'danger' };
  if (days === 0) return { label: '오늘 마감', tone: 'warning' };
  if (days <= 30) return { label: `D-${days}`, tone: 'warning' };
  return { label: `${deadline.getMonth() + 1}/${deadline.getDate()} 마감`, tone: 'primary' };
}

function officialButtonLabel(type: PolicyOfficialLinkType) {
  switch (type) {
    case 'APPLICATION_CANDIDATE':
      return '신청 페이지 확인';
    case 'LOGIN_REQUIRED':
      return '로그인 후 신청 확인';
    case 'INSTITUTION_HOME':
      return '기관 홈페이지 확인';
    case 'UNAVAILABLE':
      return '온라인 신청 경로 없음';
    default:
      return '신청 사이트 확인';
  }
}

function hostLabel(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return '참고 링크';
  }
}

function categoryLabel(policy: PolicyDetail) {
  return (
    POLICY_CATEGORY_OPTIONS.find((option) => option.value === policy.categoryType)?.label ||
    policy.category ||
    '청년 정책'
  );
}

function PolicyDetailPage() {
  const [, params] = useRoute('/policies/:policyId');
  const [, navigate] = useLocation();
  const historyState = useHistoryState<PolicyDetailNavigationState | null>();
  const policyId = decodePolicyId(params?.policyId ?? '');
  const summary = historyState?.summary?.policyId === policyId ? historyState.summary : null;
  const summaryDetail = useMemo(() => (summary ? fallbackDetail(summary) : null), [summary]);
  const [detail, setDetail] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [externalRequest, setExternalRequest] = useState<PolicyExternalLinkRequest | null>(null);
  const [hiding, setHiding] = useState(false);
  const [hideError, setHideError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) {
      setLoading(false);
      setError(new Error('정책 식별자가 없습니다.'));
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);

    void getPolicyDetail(policyId, controller.signal)
      .then(setDetail)
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) setError(requestError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [policyId, reloadKey]);

  const policy = detail ?? summaryDetail;

  if (!policy && loading) {
    return (
      <div className="page policy-detail-page">
        <PolicyStateView
          title="정책 상세를 확인하고 있어요"
          description="지원 내용과 신청 경로를 불러오는 중입니다."
          loading
        />
      </div>
    );
  }

  if (!policy && error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page policy-detail-page">
        <PolicyStateView
          title={notFound ? '정책 정보를 찾을 수 없어요' : '정책 상세를 불러오지 못했어요'}
          description={
            notFound
              ? '목록으로 돌아가 다른 정책을 선택해 주세요.'
              : policyErrorMessage(error, '정책 상세를 불러오지 못했습니다.')
          }
          tone="danger"
          actionLabel={notFound ? '정책 목록으로' : '다시 시도'}
          onAction={() =>
            notFound ? navigate('/policies') : setReloadKey((current) => current + 1)
          }
        />
      </div>
    );
  }

  if (!policy) return null;

  const recommendationReasons = summary?.recommendationReasons.length
    ? summary.recommendationReasons
    : (summary?.eligibilityReasons ?? []);
  const showRecommendation =
    summary?.recommendationStatus !== 'DISCOVER' &&
    (recommendationReasons.length > 0 || summary?.eligibilityStatus === 'CHECK_REQUIRED');
  const deadline = deadlinePresentation(policy.applicationEndDate);
  const supportValue =
    policy.supportAmount === null
      ? normalizePolicyText(policy.supportText) || '지원 내용 확인 필요'
      : formatSupportAmount(policy.supportAmount);
  const periodValue = applicationPeriodLabel(policy);
  const documents = policy.documents.flatMap(policyTextItems);
  const references = [...new Set(policy.referenceUrls)].filter(
    (url) => url.trim() && url !== policy.officialUrl,
  );
  const officialUrlAllowed = Boolean(
    policy.officialUrl &&
    policy.officialLinkType !== 'UNAVAILABLE' &&
    isAllowedPolicyExternalUrl(policy.officialUrl),
  );

  const openExternalLink = (request: PolicyExternalLinkRequest) => {
    if (!isAllowedPolicyExternalUrl(request.url)) return;
    setExternalRequest(request);
  };

  const handleHide = async () => {
    if (hiding) return;
    setHiding(true);
    setHideError(null);

    const category = policy.category.trim().slice(0, 100);
    const shortSummary = normalizePolicyText(
      summary?.shortSummary || summary?.summary || policy.description,
    )
      .trim()
      .slice(0, 500);

    try {
      const hidden = await hidePolicy(policy.policyId, {
        title: policy.title.trim().slice(0, 200) || '청년 정책',
        category: category || null,
        shortSummary: shortSummary || null,
      });
      const hiddenPolicy = {
        policyId: policy.policyId,
        title: policy.title,
        hiddenAt: hidden.hiddenAt,
        ...(summary ? { summary } : {}),
      };
      navigate('/policies', {
        replace: true,
        state: { hiddenPolicy } satisfies PolicyListNavigationState,
      });
    } catch (requestError) {
      setHideError(policyErrorMessage(requestError, '정책을 관심 없음으로 설정하지 못했습니다.'));
      setHiding(false);
    }
  };

  return (
    <div className="page policy-detail-page">
      <button
        className="policy-detail__back"
        type="button"
        onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/policies'))}
      >
        <ArrowLeft size={17} /> 정책 목록으로
      </button>

      {summaryDetail && loading ? (
        <div className="policy-detail__notice" role="status">
          <Info size={18} />
          <span>목록에서 받은 기본 정보를 먼저 보여드리고 있어요. 상세 정보는 곧 갱신됩니다.</span>
        </div>
      ) : summaryDetail && error ? (
        <div className="policy-detail__notice policy-detail__notice--warning" role="alert">
          <Info size={18} />
          <span>
            {policyErrorMessage(error, '정책 상세를 불러오지 못했습니다.')} 목록의 기본 정보를 대신
            보여드리고 있어요.
          </span>
          <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
            다시 시도
          </button>
        </div>
      ) : null}

      <header className="policy-detail__hero">
        <span className="policy-detail__category">
          <Sparkles size={16} /> {categoryLabel(policy)}
        </span>
        <h1>{policy.title}</h1>
        <p>{normalizePolicyText(policy.description)}</p>
      </header>

      {showRecommendation ? (
        <section
          className={`policy-detail__recommendation policy-detail__recommendation--${
            summary?.recommendationStatus === 'CHECK_REQUIRED' ? 'warning' : 'primary'
          }`}
        >
          <h2>
            {summary?.recommendationStatus === 'CHECK_REQUIRED'
              ? '신청 전에 확인할 조건'
              : '나에게 맞는 이유'}
          </h2>
          {recommendationReasons.length ? (
            <ul>
              {recommendationReasons.flatMap(policyTextItems).map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>세부 자격 요건은 공식 공고에서 다시 확인해 주세요.</p>
          )}
        </section>
      ) : null}

      <div className="policy-detail__layout">
        <div className="policy-detail__content">
          <section className="ui-card policy-detail__section">
            <h2>한눈에 보기</h2>
            <div className="policy-detail__overview-row">
              <span className="policy-detail__overview-icon">
                <Banknote size={21} />
              </span>
              <div>
                <span>
                  {policy.supportAmount === null
                    ? '지원 혜택'
                    : supportTitle(policy.supportAmountType)}
                </span>
                <strong>{supportValue}</strong>
                {policy.supportAmount !== null && policy.supportText.trim() ? (
                  <p>{normalizePolicyText(policy.supportText)}</p>
                ) : null}
              </div>
            </div>
            <div className="policy-detail__overview-row">
              <span className="policy-detail__overview-icon">
                <CalendarDays size={21} />
              </span>
              <div>
                <span>
                  신청 기간
                  {deadline ? (
                    <em
                      className={`policy-detail__deadline policy-detail__deadline--${deadline.tone}`}
                    >
                      {deadline.label}
                    </em>
                  ) : null}
                </span>
                <strong>{periodValue}</strong>
                {policy.applicationPeriodText?.trim() &&
                normalizePolicyText(policy.applicationPeriodText) !== periodValue ? (
                  <p>{normalizePolicyText(policy.applicationPeriodText)}</p>
                ) : null}
              </div>
            </div>
            <div className="policy-detail__overview-row">
              <span className="policy-detail__overview-icon">
                <UserRound size={21} />
              </span>
              <div>
                <span>지원 대상</span>
                <strong>{normalizePolicyText(policy.target) || '지원 대상 확인 필요'}</strong>
              </div>
            </div>
          </section>

          <section className="ui-card policy-detail__section">
            <h2>
              <FileCheck2 size={20} /> 신청 준비
            </h2>
            <div className="policy-detail__subsection">
              <h3>신청 방법</h3>
              <p>
                {normalizePolicyText(policy.applicationMethod) || '공식 공고에서 확인해 주세요.'}
              </p>
            </div>
            <div className="policy-detail__subsection">
              <h3>제출 서류</h3>
              {documents.length ? (
                <ul>
                  {documents.map((document, index) => (
                    <li key={`${document}-${index}`}>{document}</li>
                  ))}
                </ul>
              ) : (
                <p>필요한 서류는 공식 공고에서 확인해 주세요.</p>
              )}
            </div>
          </section>

          <section className="ui-card policy-detail__section">
            <h2>
              <Landmark size={20} /> 담당 기관
            </h2>
            <dl className="policy-detail__agency">
              <div>
                <dt>주관</dt>
                <dd>{policy.agency || '기관 확인 필요'}</dd>
              </div>
              <div>
                <dt>운영</dt>
                <dd>{policy.operatingAgency || '기관 확인 필요'}</dd>
              </div>
            </dl>
          </section>

          {references.length ? (
            <section className="ui-card policy-detail__section">
              <h2>
                <Link2 size={20} /> 참고 링크
              </h2>
              <p className="policy-detail__section-description">
                정책 안내나 관련 기관 정보를 확인하는 링크예요. 실제 신청 경로와 다를 수 있어요.
              </p>
              <div className="policy-detail__references">
                {references.map((url) => {
                  const allowed = isAllowedPolicyExternalUrl(url);
                  return (
                    <button
                      type="button"
                      key={url}
                      disabled={!allowed}
                      onClick={() =>
                        openExternalLink({
                          title: policy.title,
                          url,
                          kind: 'reference',
                          officialLinkType: 'UNKNOWN',
                        })
                      }
                    >
                      <span>{allowed ? `${hostLabel(url)} 참고 링크` : '링크 주소 확인 필요'}</span>
                      <ExternalLink size={16} />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="ui-card policy-detail__action-card">
          <h2>신청 전 꼭 확인하세요</h2>
          <p>추천 결과는 신청 자격을 확정하지 않습니다. 제공기관의 최신 공고를 확인해 주세요.</p>
          <button
            className="button button--secondary policy-detail__hide-button"
            type="button"
            disabled={hiding}
            onClick={() => void handleHide()}
          >
            <EyeOff size={17} /> {hiding ? '숨기는 중...' : '목록 숨기기'}
          </button>
          {hideError ? (
            <p className="policy-detail__action-error" role="alert">
              {hideError}
            </p>
          ) : null}
          <button
            className="button button--primary"
            type="button"
            disabled={!officialUrlAllowed}
            onClick={() => {
              if (!policy.officialUrl) return;
              openExternalLink({
                title: policy.title,
                url: policy.officialUrl,
                kind: 'application',
                officialLinkType: policy.officialLinkType,
              });
            }}
          >
            {officialButtonLabel(officialUrlAllowed ? policy.officialLinkType : 'UNAVAILABLE')}
            {officialUrlAllowed ? <ExternalLink size={17} /> : null}
          </button>
          {!officialUrlAllowed ? (
            <small>
              온라인 주소가 없거나 안전한 웹 주소로 확인되지 않았어요. 담당 기관에 문의해 주세요.
            </small>
          ) : null}
        </aside>
      </div>

      {externalRequest ? (
        <PolicyExternalLinkDialog
          request={externalRequest}
          onClose={() => setExternalRequest(null)}
        />
      ) : null}
    </div>
  );
}

export default PolicyDetailPage;
