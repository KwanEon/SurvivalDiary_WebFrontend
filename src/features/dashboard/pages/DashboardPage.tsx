import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Coins,
  CreditCard,
  Gauge,
  Landmark,
  Lightbulb,
  LoaderCircle,
  Newspaper,
  PencilLine,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../../auth/AuthContext';
import { getPolicyPreference, getPolicyRecommendations } from '../../policies/api';
import type {
  PolicyDetailNavigationState,
  PolicySummary,
} from '../../policies/types';
import { getExpenses, getHomeSummary, saveTodayBudget } from '../api';
import { budgetPresets, homeNews } from '../mocks';
import type { DashboardLoadState, ExpenseSummary, HomeSummary } from '../types';
import '../styles/dashboard.css';

const wonFormatter = new Intl.NumberFormat('ko-KR');
const DAY_IN_MS = 86_400_000;
const POLICIES_PER_PAGE = 3;

const categoryMeta: Record<
  number,
  { label: string; icon: LucideIcon; tone: 'food' | 'cafe' | 'transport' | 'shopping' | 'etc' }
> = {
  1: { label: '식비', icon: Utensils, tone: 'food' },
  2: { label: '카페', icon: Coffee, tone: 'cafe' },
  3: { label: '교통', icon: Bus, tone: 'transport' },
  4: { label: '쇼핑', icon: ShoppingBag, tone: 'shopping' },
  5: { label: '기타', icon: CreditCard, tone: 'etc' },
};

const newsIcons: Record<string, LucideIcon> = {
  생활경제: ShoppingBag,
  금융: Landmark,
  절약: Lightbulb,
  트렌드: Sparkles,
};

function formatWon(amount: number) {
  return `${wonFormatter.format(amount)}원`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function deadlineLabel(endDate: string | null) {
  if (!endDate) return null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.round((end.getTime() - todayStart.getTime()) / DAY_IN_MS);
  if (days < 0 || days > 30) return null;
  return days === 0 ? '오늘 마감' : `D-${days}`;
}

function supportLabel(policy: PolicySummary) {
  if (policy.supportAmount === null) {
    return policy.shortSummary.trim() || '지원 내용은 상세 화면에서 확인해 주세요.';
  }
  const amount = formatWon(policy.supportAmount);
  switch (policy.supportAmountType) {
    case 'MAXIMUM':
      return `최대 ${amount}`;
    case 'MONTHLY':
      return `월 ${amount}`;
    case 'MONTHLY_MAXIMUM':
      return `월 최대 ${amount}`;
    default:
      return amount;
  }
}

function orderPreviewPolicies(items: PolicySummary[]) {
  const selected: PolicySummary[] = [];
  const ids = new Set<string>();
  const add = (policy: PolicySummary) => {
    if (!ids.has(policy.policyId)) {
      ids.add(policy.policyId);
      selected.push(policy);
    }
  };

  const recommended = items.filter((policy) => policy.recommendationStatus === 'RECOMMENDED');
  if (recommended[0]) add(recommended[0]);

  items
    .filter((policy) => deadlineLabel(policy.applicationEndDate) !== null)
    .sort((left, right) =>
      (left.applicationEndDate ?? '').localeCompare(right.applicationEndDate ?? ''),
    )
    .forEach(add);
  recommended.forEach(add);
  items.forEach(add);
  return selected;
}

interface BudgetDialogProps {
  currentAmount: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function BudgetDialog({ currentAmount, onClose, onSaved }: BudgetDialogProps) {
  const [amount, setAmount] = useState(String(currentAmount || 35_000));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const parsedAmount = Number(amount.replaceAll(',', ''));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError('1원 이상의 올바른 금액을 입력해 주세요.');
      return;
    }
    if (parsedAmount > 1_000_000_000) {
      setError('사용 가능 금액은 10억원 이하로 입력해 주세요.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveTodayBudget(parsedAmount);
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError, '예산을 저장하지 못했어요.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-dialog" role="presentation" onMouseDown={onClose}>
      <section
        className="dashboard-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dashboard-dialog__header">
          <div>
            <span>하루 예산</span>
            <h2 id="budget-dialog-title">사용 가능 금액 설정</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="예산 설정 닫기">
            <X size={20} />
          </button>
        </div>

        <div className="dashboard-dialog__guide">
          <Lightbulb size={20} />
          <p>하루에 안심하고 쓸 수 있는 금액을 정해 보세요.</p>
        </div>

        <form onSubmit={submit}>
          <label className="dashboard-budget-form__field">
            <span>직접 입력</span>
            <span>
              <input
                autoFocus
                inputMode="numeric"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                aria-describedby={error ? 'budget-form-error' : undefined}
              />
              <small>원</small>
            </span>
          </label>

          <fieldset className="dashboard-budget-form__presets">
            <legend>빠른 금액 선택</legend>
            <div>
              {budgetPresets.map((preset) => (
                <button
                  className={parsedAmount === preset ? 'is-selected' : ''}
                  type="button"
                  key={preset}
                  onClick={() => {
                    setAmount(String(preset));
                    setError('');
                  }}
                >
                  {formatWon(preset)}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="dashboard-dialog__error" id="budget-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="dashboard-dialog__actions">
            <button className="button button--secondary" type="button" onClick={onClose}>
              취소
            </button>
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface DailySummaryDialogProps {
  summary: HomeSummary;
  expenses: ExpenseSummary[];
  onClose: () => void;
}

function DailySummaryDialog({ summary, expenses, onClose }: DailySummaryDialogProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const todayExpenses = expenses
    .filter((expense) => isToday(expense.spentAt))
    .sort((left, right) => right.spentAt.localeCompare(left.spentAt));
  const score = summary.dailyLimit
    ? clampPercent(Math.round((summary.remainingToday / summary.dailyLimit) * 100))
    : 0;
  const scoreDescription = !summary.dailyLimit
    ? '예산을 설정하면 오늘의 점수를 확인할 수 있어요.'
    : summary.spentToday > summary.dailyLimit
      ? `계획보다 ${formatWon(summary.spentToday - summary.dailyLimit)} 더 사용했어요.`
      : `오늘 예산이 ${formatWon(summary.remainingToday)} 남았어요.`;

  return (
    <div className="dashboard-dialog" role="presentation" onMouseDown={onClose}>
      <section
        className="dashboard-dialog__panel dashboard-dialog__panel--summary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dashboard-dialog__header">
          <div>
            <span>Daily briefing</span>
            <h2 id="summary-dialog-title">오늘의 요약</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="오늘의 요약 닫기">
            <X size={20} />
          </button>
        </div>

        <article className="dashboard-score">
          <span>오늘의 생존 점수</span>
          <div>
            <strong>{score}점</strong>
            <p>{scoreDescription}</p>
          </div>
        </article>

        <div className="dashboard-dialog__section-title">
          <h3>오늘 지출 내역</h3>
          <span>{todayExpenses.length}건</span>
        </div>
        <div className="dashboard-today-expenses">
          {todayExpenses.length === 0 ? (
            <div className="dashboard-today-expenses__empty">
              <WalletCards size={25} />
              <p>오늘 등록된 지출이 없어요.</p>
            </div>
          ) : (
            todayExpenses.map((expense) => {
              const meta = categoryMeta[expense.categoryId] ?? categoryMeta[5];
              const Icon = meta.icon;
              return (
                <div className="dashboard-today-expense" key={expense.expenseId}>
                  <span className={`dashboard-category-icon dashboard-category-icon--${meta.tone}`}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{expense.title}</strong>
                    <small>{meta.label}</small>
                  </div>
                  <strong>-{formatWon(expense.amount)}</strong>
                </div>
              );
            })
          )}
        </div>

        <div className="dashboard-dialog__remaining">
          <span>오늘 남은 예산</span>
          <strong>{formatWon(summary.remainingToday)}</strong>
        </div>
      </section>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [dailySummaryOpen, setDailySummaryOpen] = useState(false);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [policyState, setPolicyState] = useState<'loading' | 'ready' | 'setup' | 'empty' | 'error'>(
    'loading',
  );
  const [policyError, setPolicyError] = useState('');
  const [policyReloadKey, setPolicyReloadKey] = useState(0);
  const [policyPageIndex, setPolicyPageIndex] = useState(0);

  const loadDashboard = useCallback(async (signal?: AbortSignal, background = false) => {
    if (background) setRefreshing(true);
    else setLoadState('loading');
    setLoadError('');
    try {
      const [nextSummary, nextExpenses] = await Promise.all([
        getHomeSummary(signal),
        getExpenses(signal),
      ]);
      if (signal?.aborted) return;
      setSummary(nextSummary);
      setExpenses(nextExpenses);
      setLoadState('ready');
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(errorMessage(error, '홈 화면을 불러오지 못했어요.'));
      if (!background) setLoadState('error');
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    const loadPolicies = async () => {
      setPolicyState('loading');
      setPolicyError('');
      try {
        const preference = await getPolicyPreference(controller.signal);
        if (controller.signal.aborted) return;
        if (!preference.saved || preference.age === null || !preference.regionCode) {
          setPolicyState('setup');
          return;
        }
        const response = await getPolicyRecommendations(
          { category: null, keyword: null, page: 1, size: 20 },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const orderedPolicies = orderPreviewPolicies(response.items);
        setPolicies(orderedPolicies);
        setPolicyPageIndex(0);
        setPolicyState(orderedPolicies.length ? 'ready' : 'empty');
      } catch (error) {
        if (controller.signal.aborted) return;
        setPolicyError(errorMessage(error, '맞춤 정책을 불러오지 못했어요.'));
        setPolicyState('error');
      }
    };
    void loadPolicies();
    return () => controller.abort();
  }, [policyReloadKey]);

  const weeklyProgress = summary?.weeklyBudget
    ? clampPercent((summary.weeklySpent / summary.weeklyBudget) * 100)
    : 0;
  const dailyUsagePercent = summary?.dailyLimit
    ? Math.max(0, Math.round((summary.spentToday / summary.dailyLimit) * 100))
    : 0;
  const topCategory = summary?.topCategoryId ? categoryMeta[summary.topCategoryId] : undefined;
  const displayName = summary?.userName || user?.nickname || user?.name || '생존러';
  const isNearLimit = dailyUsagePercent >= 60 && dailyUsagePercent < 100;
  const isOverLimit = Boolean(summary?.dailyLimit && dailyUsagePercent >= 100);
  const TopCategoryIcon = topCategory?.icon ?? CreditCard;
  const policyPages = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(policies.length / POLICIES_PER_PAGE) },
        (_, index) =>
          policies.slice(
            index * POLICIES_PER_PAGE,
            (index + 1) * POLICIES_PER_PAGE,
          ),
      ),
    [policies],
  );

  const summaryTiles = useMemo(
    () => [
      {
        label: '오늘 지출',
        value: formatWon(summary?.spentToday ?? 0),
        icon: Coins,
        tone: 'food',
      },
      {
        label: '예산 사용률',
        value: `${dailyUsagePercent}%`,
        icon: Gauge,
        tone: 'primary',
      },
      {
        label: '카테고리 1위',
        value: topCategory?.label ?? '아직 없음',
        icon: TopCategoryIcon,
        tone: topCategory?.tone ?? 'muted',
      },
      {
        label: '잔여 예산',
        value: formatWon(summary?.remainingToday ?? 0),
        icon: WalletCards,
        tone: 'info',
      },
    ],
    [TopCategoryIcon, dailyUsagePercent, summary, topCategory],
  );

  if (loadState === 'loading' && !summary) {
    return (
      <div className="page dashboard dashboard--loading" aria-busy="true">
        <div className="dashboard-loading__heading" />
        <div className="dashboard-loading__hero" />
        <div className="dashboard-loading__grid">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (loadState === 'error' && !summary) {
    return (
      <div className="page dashboard">
        <section className="ui-card dashboard-load-error" role="alert">
          <AlertTriangle size={34} />
          <h1>홈 화면을 불러오지 못했어요</h1>
          <p>{loadError}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={17} />
            다시 불러오기
          </button>
        </section>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="page dashboard">
      <div className="page-heading dashboard__heading">
        <div>
          <p className="page-heading__eyebrow">Today&apos;s survival</p>
          <h1>안녕하세요, {displayName}님! 👋</h1>
          <p>오늘도 가볍게 지갑을 지켜봐요.</p>
        </div>
        <button
          className="button button--secondary dashboard__refresh"
          type="button"
          disabled={refreshing}
          onClick={() => {
            void loadDashboard(undefined, true);
            setPolicyReloadKey((key) => key + 1);
          }}
        >
          <RefreshCw className={refreshing ? 'spin' : ''} size={17} />
          {refreshing ? '새로 고침 중' : '새로 고침'}
        </button>
      </div>

      {loadError && (
        <div className="dashboard-inline-error" role="alert">
          <AlertTriangle size={18} />
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadDashboard(undefined, true)}>
            다시 시도
          </button>
        </div>
      )}

      <section className="dashboard__overview" aria-label="오늘의 예산과 지출 요약">
        <article className="dashboard-budget">
          <div className="dashboard-budget__glow" aria-hidden="true" />
          <div className="dashboard-budget__top">
            <div>
              <span>오늘 사용 가능한 금액</span>
              <strong>{formatWon(summary.remainingToday)}</strong>
            </div>
            <div className="dashboard-budget__mascot" aria-hidden="true">
              <img src="/brand/app-icon.png" alt="" />
            </div>
          </div>
          <div className="dashboard-budget__meta">
            <div>
              <span>일일 한도</span>
              <strong>{formatWon(summary.dailyLimit)}</strong>
            </div>
            <div>
              <span>오늘 지출</span>
              <strong>{formatWon(summary.spentToday)}</strong>
            </div>
            <button type="button" onClick={() => setBudgetOpen(true)}>
              <PencilLine size={16} />
              금액 설정
            </button>
          </div>
          <div className="dashboard-budget__weekly">
            <div>
              <span>주간 예산</span>
              <strong>
                {formatWon(summary.weeklySpent)} <small>/ {formatWon(summary.weeklyBudget)}</small>
              </strong>
            </div>
            <div
              className="dashboard-budget__progress"
              aria-label={`주간 예산 ${Math.round(weeklyProgress)}% 사용`}
            >
              <span style={{ width: `${weeklyProgress}%` }} />
            </div>
          </div>
        </article>

        <article className="dashboard-daily ui-card">
          <div className="ui-card__header">
            <div>
              <span className="dashboard__section-kicker">오늘의 요약</span>
              <h2>하루 소비 현황</h2>
            </div>
            <button type="button" onClick={() => setDailySummaryOpen(true)}>
              자세히 <ArrowRight size={14} />
            </button>
          </div>
          <div className="dashboard-daily__grid">
            {summaryTiles.map(({ label, value, icon: Icon, tone }) => (
              <div className="dashboard-summary-tile" key={label}>
                <span
                  className={`dashboard-summary-tile__icon dashboard-summary-tile__icon--${tone}`}
                >
                  <Icon size={19} />
                </span>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      {(isNearLimit || isOverLimit) && (
        <div
          className={`dashboard-budget-alert ${isOverLimit ? 'dashboard-budget-alert--danger' : ''}`}
          role="status"
        >
          <AlertTriangle size={19} />
          <span>
            {isOverLimit
              ? '오늘 한도를 넘었어요. 남은 지출을 한번 점검해요.'
              : '오늘 예산의 60% 이상을 사용했어요.'}
          </span>
          <button type="button" onClick={() => setDailySummaryOpen(true)}>
            확인하기
          </button>
        </div>
      )}

      <section className="dashboard-policy" aria-labelledby="dashboard-policy-title">
        <div className="dashboard-section-heading">
          <div>
            <span>Policy briefing</span>
            <h2 id="dashboard-policy-title">놓치면 아쉬운 정책</h2>
            <p>저장한 조건과 신청 마감일을 함께 살폈어요.</p>
          </div>
          <div className="dashboard-section-heading__actions">
            {policyState === 'ready' && policyPages.length > 1 && (
              <div className="dashboard-policy__pagination" aria-label="홈 정책 페이지 이동">
                <button
                  type="button"
                  aria-label="이전 정책 페이지"
                  disabled={policyPageIndex === 0}
                  onClick={() => setPolicyPageIndex((index) => Math.max(0, index - 1))}
                >
                  <ChevronLeft size={18} />
                </button>
                <span aria-live="polite">
                  {policyPageIndex + 1} / {policyPages.length}
                </span>
                <button
                  type="button"
                  aria-label="다음 정책 페이지"
                  disabled={policyPageIndex === policyPages.length - 1}
                  onClick={() =>
                    setPolicyPageIndex((index) => Math.min(policyPages.length - 1, index + 1))
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <Link href="/policies">
              전체 보기 <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {policyState === 'loading' && (
          <div className="ui-card dashboard-policy-state" aria-busy="true">
            <LoaderCircle className="spin" size={22} />
            <span>내게 맞는 정책을 살펴보고 있어요.</span>
          </div>
        )}
        {policyState === 'setup' && (
          <Link
            className="ui-card dashboard-policy-state dashboard-policy-state--setup"
            href="/policies/conditions"
          >
            <Sparkles size={22} />
            <div>
              <strong>한 번만 조건을 알려주세요</strong>
              <p>다음부터 홈에서 내게 맞는 정책을 바로 보여드릴게요.</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        )}
        {policyState === 'error' && (
          <div
            className="ui-card dashboard-policy-state dashboard-policy-state--error"
            role="alert"
          >
            <AlertTriangle size={22} />
            <div>
              <strong>맞춤 정책을 불러오지 못했어요</strong>
              <p>{policyError}</p>
            </div>
            <button type="button" onClick={() => setPolicyReloadKey((key) => key + 1)}>
              다시 시도
            </button>
          </div>
        )}
        {policyState === 'empty' && (
          <Link className="ui-card dashboard-policy-state" href="/policies">
            <Search size={22} />
            <span>지금은 맞춤 결과가 없어요. 전체 정책을 둘러보세요.</span>
            <ArrowRight size={18} />
          </Link>
        )}
        {policyState === 'ready' && (
          <div className="dashboard-policy__viewport">
            <div
              className="dashboard-policy__track"
              style={{ transform: `translateX(-${policyPageIndex * 100}%)` }}
            >
              {policyPages.map((page, pageIndex) => (
                <div
                  className="dashboard-policy__grid"
                  aria-hidden={pageIndex !== policyPageIndex}
                  key={page[0]?.policyId ?? pageIndex}
                >
                  {page.map((policy, index) => {
                    const policyIndex = pageIndex * POLICIES_PER_PAGE + index;
                    const deadline = deadlineLabel(policy.applicationEndDate);
                    const reason =
                      policy.recommendationReasons[0] ||
                      policy.eligibilityReasons[0] ||
                      '지원 대상과 신청 조건을 상세 화면에서 확인해 보세요.';
                    return (
                      <Link
                        className={`ui-card dashboard-policy-card ${policyIndex === 0 ? 'dashboard-policy-card--featured' : ''}`}
                        href={`/policies/${encodeURIComponent(policy.policyId)}`}
                        key={policy.policyId}
                        state={{ summary: policy } satisfies PolicyDetailNavigationState}
                        tabIndex={pageIndex === policyPageIndex ? undefined : -1}
                      >
                        <div className="dashboard-policy-card__tags">
                          {policy.recommendationStatus === 'RECOMMENDED' && (
                            <span>맞춤 추천</span>
                          )}
                          {deadline && <span className="is-deadline">{deadline}</span>}
                          <span className="is-category">{policy.category}</span>
                        </div>
                        <h3>{policy.title}</h3>
                        <p>{reason}</p>
                        <div className="dashboard-policy-card__support">
                          <span className="dashboard-policy-card__support-icon" aria-hidden="true">
                            <Coins size={15} />
                          </span>
                          <div>
                            <small>지원 요약</small>
                            <strong>{supportLabel(policy)}</strong>
                          </div>
                        </div>
                        <div className="dashboard-policy-card__footer">
                          <span>
                            <Building2 size={14} /> {policy.agency}
                          </span>
                          <strong>
                            자세히 <ArrowRight size={14} />
                          </strong>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="dashboard__lower">
        <article className="dashboard-tip-card">
          <div className="dashboard-tip-card__mascot" aria-hidden="true">
            <img src="/brand/app-icon.png" alt="" />
          </div>
          <div>
            <span>오늘의 한 줄 절약 팁</span>
            <h2>작은 습관이 이번 주 여유를 만들어요.</h2>
            <p>커피 한 잔을 텀블러로 바꾸면 이번 주 교통비를 만들 수 있어요.</p>
          </div>
        </article>

        <article className="ui-card dashboard-quick">
          <div className="ui-card__header">
            <div>
              <span className="dashboard__section-kicker">Quick menu</span>
              <h2>빠른 메뉴</h2>
            </div>
          </div>
          <div className="dashboard-quick__list">
            <Link href="/expenses/new">
              <span>
                <PencilLine size={19} />
              </span>
              <div>
                <strong>지출 직접 등록</strong>
                <small>오늘 사용한 금액을 기록해요</small>
              </div>
              <ArrowRight size={17} />
            </Link>
            <Link href="/expenses/statistics">
              <span>
                <BarChart3 size={19} />
              </span>
              <div>
                <strong>지출 통계 보기</strong>
                <small>이번 달 소비 흐름을 확인해요</small>
              </div>
              <ArrowRight size={17} />
            </Link>
          </div>
        </article>
      </section>

      <section className="ui-card dashboard-news" aria-labelledby="dashboard-news-title">
        <div className="dashboard-section-heading">
          <div>
            <span>For your wallet</span>
            <h2 id="dashboard-news-title">맞춤 뉴스</h2>
            <p>지갑을 지키는 생활경제 소식을 모았어요.</p>
          </div>
          <Newspaper size={22} aria-hidden="true" />
        </div>
        <div className="dashboard-news__list">
          {homeNews.map((news) => {
            const Icon = newsIcons[news.category] ?? Newspaper;
            return (
              <article className="dashboard-news-item" key={news.id}>
                <span
                  className={`dashboard-news-item__icon dashboard-news-item__icon--${news.category}`}
                >
                  <Icon size={21} />
                </span>
                <div>
                  <span>{news.category}</span>
                  <h3>{news.title}</h3>
                  <small>
                    {news.source} · {news.timeAgo}
                  </small>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </section>

      {budgetOpen && (
        <BudgetDialog
          currentAmount={summary.dailyLimit}
          onClose={() => setBudgetOpen(false)}
          onSaved={() => loadDashboard(undefined, true)}
        />
      )}
      {dailySummaryOpen && (
        <DailySummaryDialog
          summary={summary}
          expenses={expenses}
          onClose={() => setDailySummaryOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
