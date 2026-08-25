import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { deleteExpense, getExpenses } from '../api';
import type {
  CategoryStatistic,
  ExpenseRecord,
  PeriodComparison,
  StatisticsPeriod,
  TrendItem,
} from '../types';
import '../styles/expense-statistics.css';

const wonFormatter = new Intl.NumberFormat('ko-KR');

function ExpenseTotalAmount({ value }: { value: string }) {
  const amountRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const amountElement = amountRef.current;

    if (!amountElement) {
      return undefined;
    }

    const fitAmount = () => {
      amountElement.style.removeProperty('--expense-total-font-size');

      const availableWidth = amountElement.clientWidth;
      const contentWidth = amountElement.scrollWidth;

      if (availableWidth === 0 || contentWidth <= availableWidth) {
        return;
      }

      const defaultFontSize = Number.parseFloat(window.getComputedStyle(amountElement).fontSize);
      const fittedFontSize = Math.max(
        16,
        Math.floor(defaultFontSize * (availableWidth / contentWidth)),
      );

      amountElement.style.setProperty('--expense-total-font-size', `${fittedFontSize}px`);
    };

    fitAmount();

    const resizeObserver = new ResizeObserver(fitAmount);
    const amountContainer = amountElement.parentElement;

    if (amountContainer) {
      resizeObserver.observe(amountContainer);
    }

    void document.fonts?.ready.then(fitAmount);

    return () => resizeObserver.disconnect();
  }, [value]);

  return (
    <h2 ref={amountRef} id="expense-total-title">
      {value}
    </h2>
  );
}

type CategoryIconComponent = ComponentType<{ size?: number }>;

function createMaterialCategoryIcon(path: string): CategoryIconComponent {
  return function MaterialCategoryIcon({ size = 24 }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d={path} />
      </svg>
    );
  };
}

const RestaurantIcon = createMaterialCategoryIcon(
  'M16 6v6c0 1.1.9 2 2 2h1v7c0 .55.45 1 1 1s1-.45 1-1V3.13c0-.65-.61-1.13-1.24-.98C17.6 2.68 16 4.51 16 6zm-5 3H9V3c0-.55-.45-1-1-1s-1 .45-1 1v6H5V3c0-.55-.45-1-1-1s-1 .45-1 1v6c0 2.21 1.79 4 4 4v8c0 .55.45 1 1 1s1-.45 1-1v-8c2.21 0 4-1.79 4-4V3c0-.55-.45-1-1-1s-1 .45-1 1v6z',
);
const LocalCafeIcon = createMaterialCategoryIcon(
  'M20 3H6c-1.1 0-2 .9-2 2v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM3 21h16c.55 0 1-.45 1-1s-.45-1-1-1H3c-.55 0-1 .45-1 1s.45 1 1 1z',
);
const DirectionsBusIcon = createMaterialCategoryIcon(
  'M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.67 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
);
const ShoppingBagIcon = createMaterialCategoryIcon(
  'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 4c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2zm2-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm4 6c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2z',
);
const SportsEsportsIcon = createMaterialCategoryIcon(
  'M21.58 16.09l-1.09-7.66A4 4 0 0 0 16.53 5H7.47a4 4 0 0 0-3.96 3.43l-1.09 7.66A3.49 3.49 0 0 0 5.88 20c1.05 0 2.05-.48 2.71-1.29L10.12 17h3.76l1.53 1.71A3.49 3.49 0 0 0 18.12 20a3.49 3.49 0 0 0 3.46-3.91zM11 11H9v2H7v-2H5V9h2V7h2v2h2v2zm4-1c-.83 0-1.5-.67-1.5-1.5S14.17 7 15 7s1.5.67 1.5 1.5S15.83 10 15 10zm2 3c-.83 0-1.5-.67-1.5-1.5S16.17 10 17 10s1.5.67 1.5 1.5S17.83 13 17 13z',
);
const MoreHorizIcon = createMaterialCategoryIcon(
  'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
);

const categories: Record<
  number,
  {
    label: string;
    icon: CategoryIconComponent;
    tone: 'food' | 'cafe' | 'transport' | 'shopping' | 'leisure' | 'etc';
  }
> = {
  1: { label: '식비', icon: RestaurantIcon, tone: 'food' },
  2: { label: '카페', icon: LocalCafeIcon, tone: 'cafe' },
  3: { label: '교통', icon: DirectionsBusIcon, tone: 'transport' },
  4: { label: '쇼핑', icon: ShoppingBagIcon, tone: 'shopping' },
  5: { label: '기타', icon: MoreHorizIcon, tone: 'etc' },
  6: { label: '여가', icon: SportsEsportsIcon, tone: 'leisure' },
};

const categoryOrder = [1, 2, 3, 4, 6, 5];

function formatWon(amount: number) {
  return `${wonFormatter.format(amount)}원`;
}

function compactWon(amount: number) {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1).replace('.0', '')}억`;
  if (amount >= 10_000) return `${(amount / 10_000).toFixed(1).replace('.0', '')}만`;
  return wonFormatter.format(amount);
}

function ExpenseTrendChart({ items }: { items: TrendItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.amount), 0);
  const axisMax = maxValue <= 0 ? 1_000 : maxValue;
  const points = items.map((item, index) => ({
    ...item,
    x: items.length === 1 ? 50 : (index / (items.length - 1)) * 100,
    y: 100 - Math.min(1, item.amount / axisMax) * 100,
  }));
  const pointList = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPointList = points.length
    ? `0,100 ${pointList} 100,100`
    : '';
  const gridTicks = Array.from({ length: 4 }, (_, index) => ({
    position: (index / 3) * 100,
    value: axisMax * (3 - index) / 3,
  }));

  return (
    <div
      className="expense-trend__chart"
      role="img"
      aria-label={items.map((item) => `${item.label} ${formatWon(item.amount)}`).join(', ')}
    >
      <div className="expense-trend__y-axis" aria-hidden="true">
        {gridTicks.map((tick) => (
          <span key={tick.position} style={{ top: `${tick.position}%` }}>
            {compactWon(Math.round(tick.value))}
          </span>
        ))}
      </div>
      <svg
        className="expense-trend__plot"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {gridTicks.map((tick) => (
          <line
            className="expense-trend__grid-line"
            key={tick.position}
            x1="0"
            y1={tick.position}
            x2="100"
            y2={tick.position}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {points.length > 0 && (
          <>
            <polygon className="expense-trend__area" points={areaPointList} />
            {points.length > 1 && (
              <polyline
                className="expense-trend__line"
                points={pointList}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
      </svg>
      <div className="expense-trend__points" aria-hidden="true">
        {points.map((point) => (
          <span
            className="expense-trend__point"
            key={point.label}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        ))}
      </div>
      <div className="expense-trend__x-axis" aria-hidden="true">
        {points.map((point) => (
          <span key={point.label} style={{ left: `${point.x}%` }}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string) {
  return new Date(value);
}

function isInPeriod(expense: ExpenseRecord, visibleDate: Date, period: StatisticsPeriod) {
  const spentAt = parseDate(expense.spentAt);
  if (
    spentAt.getFullYear() !== visibleDate.getFullYear() ||
    spentAt.getMonth() !== visibleDate.getMonth()
  ) {
    return false;
  }
  return period === 'monthly' || spentAt.getDate() === visibleDate.getDate();
}

function totalAmount(expenses: ExpenseRecord[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function previousPeriod(date: Date, period: StatisticsPeriod) {
  return period === 'daily'
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
    : new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function movePeriod(date: Date, period: StatisticsPeriod, offset: number) {
  return period === 'daily'
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
    : new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function periodLabel(date: Date, period: StatisticsPeriod) {
  return period === 'daily'
    ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function categoryStatistics(expenses: ExpenseRecord[], total: number): CategoryStatistic[] {
  return categoryOrder.map((categoryId) => {
    const meta = categories[categoryId];
    const amount = expenses
      .filter((expense) => expense.categoryId === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return {
      categoryId,
      label: meta.label,
      amount,
      ratio: total === 0 ? 0 : amount / total,
    };
  });
}

function categoryComparison(
  currentExpenses: ExpenseRecord[],
  previousExpenses: ExpenseRecord[],
): PeriodComparison[] {
  return categoryOrder.map((categoryId) => {
    const meta = categories[categoryId];
    return {
      categoryId,
      label: meta.label,
      current: totalAmount(
        currentExpenses.filter((expense) => expense.categoryId === categoryId),
      ),
      previous: totalAmount(
        previousExpenses.filter((expense) => expense.categoryId === categoryId),
      ),
    };
  });
}

function trendData(expenses: ExpenseRecord[], period: StatisticsPeriod): TrendItem[] {
  const now = dateOnly(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const date =
      period === 'daily'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
        : new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const amount = totalAmount(
      expenses.filter((expense) => {
        const spentAt = parseDate(expense.spentAt);
        return period === 'daily'
          ? spentAt.getFullYear() === date.getFullYear() &&
              spentAt.getMonth() === date.getMonth() &&
              spentAt.getDate() === date.getDate()
          : spentAt.getFullYear() === date.getFullYear() && spentAt.getMonth() === date.getMonth();
      }),
    );
    return {
      label:
        period === 'daily'
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : `${date.getMonth() + 1}월`,
      amount,
    };
  });
}

function comparisonMessage(current: number, previous: number, period: StatisticsPeriod) {
  const previousLabel = period === 'daily' ? '어제' : '지난달';
  const equalLabel = period === 'daily' ? '어제와' : '지난달과';
  if (current === previous) {
    return { tone: 'same' as const, text: `${equalLabel} 같은 금액을 사용했어요.`, ratio: null };
  }
  if (previous === 0) {
    return { tone: 'none' as const, text: `${previousLabel} 지출 내역이 없어요.`, ratio: null };
  }
  const ratio = (Math.abs(current - previous) / previous) * 100;
  return current > previous
    ? {
        tone: 'up' as const,
        text: `${previousLabel}보다 ${ratio.toFixed(1)}% 늘었어요.`,
        ratio,
      }
    : {
        tone: 'down' as const,
        text: `${previousLabel}보다 ${ratio.toFixed(1)}% 줄었어요.`,
        ratio,
      };
}

function expenseDateLabel(value: string) {
  const date = parseDate(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

interface ExpenseListDialogProps {
  title: string;
  expenses: ExpenseRecord[];
  onClose: () => void;
  onDelete: (expense: ExpenseRecord) => Promise<void>;
}

function ExpenseListDialog({ title, expenses, onClose, onDelete }: ExpenseListDialogProps) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && deletingId === null) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [deletingId, onClose]);

  const removeExpense = async (expense: ExpenseRecord) => {
    if (pendingDelete !== expense.expenseId) {
      setPendingDelete(expense.expenseId);
      setError('');
      return;
    }
    setDeletingId(expense.expenseId);
    setError('');
    try {
      await onDelete(expense);
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '지출을 삭제하지 못했어요.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="expense-list-dialog" role="presentation" onMouseDown={onClose}>
      <section
        className="expense-list-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-list-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="expense-list-dialog__header">
          <div>
            <h2 id="expense-list-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="지출 목록 닫기">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="expense-list-dialog__error" role="alert">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <div className="expense-list-dialog__list">
          {expenses.length === 0 ? (
            <div className="expense-list-dialog__empty">
              <ReceiptText size={27} />
              <strong>등록된 지출이 없어요</strong>
              <p>이 기간에 기록한 지출이 생기면 여기에 표시돼요.</p>
            </div>
          ) : (
            expenses.map((expense) => {
              const meta = categories[expense.categoryId] ?? categories[5];
              const Icon = meta.icon;
              const isConfirming = pendingDelete === expense.expenseId;
              const isDeleting = deletingId === expense.expenseId;
              return (
                <article className="expense-list-item" key={expense.expenseId}>
                  <span className={`expense-category-icon expense-category-icon--${meta.tone}`}>
                    <Icon size={18} />
                  </span>
                  <div className="expense-list-item__copy">
                    <div>
                      <strong>{expense.title}</strong>
                      <span>{meta.label}</span>
                    </div>
                    <small>{expenseDateLabel(expense.spentAt)}</small>
                    {expense.memo && <p>{expense.memo}</p>}
                  </div>
                  <strong className="expense-list-item__amount">
                    -{formatWon(expense.amount)}
                  </strong>
                  <button
                    className={isConfirming ? 'is-confirming' : ''}
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void removeExpense(expense)}
                    aria-label={
                      isConfirming ? `${expense.title} 삭제 확인` : `${expense.title} 삭제`
                    }
                  >
                    {isDeleting ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : isConfirming ? (
                      <>
                        <Check size={15} /> 삭제할게요
                      </>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function ExpenseStatisticsPage() {
  const now = useMemo(() => dateOnly(new Date()), []);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [period, setPeriod] = useState<StatisticsPeriod>('monthly');
  const [visibleDate, setVisibleDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [listOpen, setListOpen] = useState(false);

  const loadExpenses = useCallback(async (signal?: AbortSignal, background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setLoadError('');
    try {
      const nextExpenses = await getExpenses(signal);
      if (signal?.aborted) return;
      setExpenses(nextExpenses);
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(error instanceof Error ? error.message : '지출 통계를 불러오지 못했어요.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadExpenses(controller.signal);
    return () => controller.abort();
  }, [loadExpenses]);

  const changePeriod = (nextPeriod: StatisticsPeriod) => {
    if (nextPeriod === period) return;
    setPeriod(nextPeriod);
    setVisibleDate((current) => {
      if (nextPeriod === 'daily') {
        const isCurrentMonth =
          current.getFullYear() === now.getFullYear() && current.getMonth() === now.getMonth();
        return isCurrentMonth ? now : new Date(current.getFullYear(), current.getMonth() + 1, 0);
      }
      return new Date(current.getFullYear(), current.getMonth(), 1);
    });
  };

  const currentExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => isInPeriod(expense, visibleDate, period))
        .sort((left, right) => right.spentAt.localeCompare(left.spentAt)),
    [expenses, period, visibleDate],
  );
  const previousDate = previousPeriod(visibleDate, period);
  const previousExpenses = useMemo(
    () => expenses.filter((expense) => isInPeriod(expense, previousDate, period)),
    [expenses, period, previousDate],
  );
  const total = totalAmount(currentExpenses);
  const previousTotal = totalAmount(previousExpenses);
  const categoryStats = categoryStatistics(currentExpenses, total);
  const comparisons = categoryComparison(currentExpenses, previousExpenses);
  const trend = trendData(expenses, period);
  const comparison = comparisonMessage(total, previousTotal, period);
  const compareMax = Math.max(...comparisons.flatMap((item) => [item.current, item.previous]), 1);
  const hasComparisonData = comparisons.some((item) => item.current > 0 || item.previous > 0);
  const currentPeriodLabel = period === 'daily' ? '오늘' : '이번 달';
  const limit = period === 'daily' ? now : new Date(now.getFullYear(), now.getMonth(), 1);
  const canMoveNext = movePeriod(visibleDate, period, 1).getTime() <= limit.getTime();

  const move = (offset: number) => {
    const target = movePeriod(visibleDate, period, offset);
    if (target.getTime() > limit.getTime()) return;
    setVisibleDate(target);
  };

  const removeExpense = async (expense: ExpenseRecord) => {
    await deleteExpense(expense.expenseId);
    setExpenses((current) => current.filter((item) => item.expenseId !== expense.expenseId));
  };

  if (loading) {
    return (
      <div className="page expense-statistics expense-statistics--loading" aria-busy="true">
        <div className="expense-statistics-loading__heading" />
        <div className="expense-statistics-loading__toolbar" />
        <div className="expense-statistics-loading__hero" />
        <div className="expense-statistics-loading__grid">
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (loadError && expenses.length === 0) {
    return (
      <div className="page expense-statistics">
        <section className="ui-card expense-statistics-load-error" role="alert">
          <AlertTriangle size={35} />
          <h1>지출 통계를 불러오지 못했어요</h1>
          <p>{loadError}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void loadExpenses()}
          >
            <RefreshCw size={17} /> 다시 불러오기
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page expense-statistics">
      <div className="page-heading expense-statistics__heading">
        <div>
          <h1>지출 통계</h1>
          <p>카테고리와 기간별 소비 흐름을 한눈에 비교해 보세요.</p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          disabled={refreshing}
          onClick={() => void loadExpenses(undefined, true)}
        >
          <RefreshCw className={refreshing ? 'spin' : ''} size={17} />
          {refreshing ? '새로 고침 중' : '새로 고침'}
        </button>
      </div>

      {loadError && (
        <div className="expense-statistics-inline-error" role="alert">
          <AlertTriangle size={18} />
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadExpenses(undefined, true)}>
            다시 시도
          </button>
        </div>
      )}

      <div className="expense-statistics__controls">
        <div className="expense-statistics__period" role="tablist" aria-label="통계 기간">
          <button
            className={period === 'monthly' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={period === 'monthly'}
            onClick={() => changePeriod('monthly')}
          >
            <CalendarRange size={17} /> 월별
          </button>
          <button
            className={period === 'daily' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={period === 'daily'}
            onClick={() => changePeriod('daily')}
          >
            <CalendarDays size={17} /> 일별
          </button>
        </div>

        <div className="expense-statistics__navigator">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={period === 'daily' ? '이전 날' : '이전 달'}
          >
            <ChevronLeft size={19} />
          </button>
          <strong>{periodLabel(visibleDate, period)}</strong>
          <button
            type="button"
            disabled={!canMoveNext}
            onClick={() => move(1)}
            aria-label={period === 'daily' ? '다음 날' : '다음 달'}
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <button
          className="button button--secondary expense-statistics__list-button"
          type="button"
          onClick={() => setListOpen(true)}
        >
          <ReceiptText size={17} /> 지출 목록 {currentExpenses.length}건
        </button>
      </div>

      <section className="ui-card expense-statistics-summary" aria-labelledby="expense-total-title">
        <div className="expense-statistics-summary__top">
          <span className="expense-statistics-summary__icon">
            <WalletCards size={22} />
          </span>
          <div>
            <span>
              {period === 'daily'
                ? `${visibleDate.getMonth() + 1}월 ${visibleDate.getDate()}일 총 지출`
                : `${visibleDate.getMonth() + 1}월 총 지출`}
            </span>
            <ExpenseTotalAmount value={formatWon(total)} />
            <p className={`expense-statistics-summary__comparison is-${comparison.tone}`}>
              {comparison.tone === 'up' ? (
                <ArrowUp size={15} />
              ) : comparison.tone === 'down' ? (
                <ArrowDown size={15} />
              ) : (
                <Info size={15} />
              )}
              {comparison.text}
            </p>
          </div>
        </div>

        <div className="expense-trend">
          <div className="expense-trend__header">
            <div>
              <h3>{period === 'daily' ? '최근 7일 지출 흐름' : '최근 7개월 지출 흐름'}</h3>
            </div>
            <small>오늘 기준</small>
          </div>
          <ExpenseTrendChart items={trend} />
        </div>
      </section>

      <section className="expense-statistics__details">
        <article className="ui-card expense-category-stats">
          <div className="expense-statistics-section-heading">
            <div>
              <h2>카테고리별 지출</h2>
            </div>
            <strong>{currentExpenses.length}건</strong>
          </div>
          <div className="expense-category-stats__list">
            {categoryStats.map((item) => {
              const meta = categories[item.categoryId];
              const Icon = meta.icon;
              return (
                <div className="expense-category-row" key={item.categoryId}>
                  <span className={`expense-category-icon expense-category-icon--${meta.tone}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{formatWon(item.amount)}</span>
                    </div>
                    <div className={`expense-category-row__progress is-${meta.tone}`}>
                      <span style={{ width: `${item.ratio * 100}%` }} />
                    </div>
                  </div>
                  <strong>{Math.round(item.ratio * 100)}%</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="ui-card expense-period-compare">
          <div className="expense-statistics-section-heading">
            <div>
              <h2>{period === 'daily' ? '전날과 비교' : '지난달과 비교'}</h2>
            </div>
            <div className="expense-period-compare__legend">
              <span>
                <i className="is-previous" /> 이전
              </span>
              <span>
                <i className="is-current" /> {currentPeriodLabel}
              </span>
            </div>
          </div>
          {hasComparisonData ? (
            <div
              className="expense-period-compare__chart"
              role="img"
              aria-label={comparisons
                .map(
                  (item) =>
                    `${item.label}, 이전 ${formatWon(item.previous)}, ${currentPeriodLabel} ${formatWon(item.current)}`,
                )
                .join(', ')}
            >
              {comparisons.map((item) => (
                <div className="expense-period-compare__row" key={item.categoryId}>
                  <strong>{item.label}</strong>
                  <div className="expense-period-compare__bars">
                    <span
                      className="is-previous"
                      style={{ width: `${(item.previous / compareMax) * 100}%` }}
                    />
                    <span
                      className="is-current"
                      style={{ width: `${(item.current / compareMax) * 100}%` }}
                    />
                  </div>
                  <div className="expense-period-compare__amounts">
                    <small>
                      <i className="is-previous" /> 이전 {formatWon(item.previous)}
                    </small>
                    <small>
                      <i className="is-current" /> {currentPeriodLabel} {formatWon(item.current)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="expense-period-compare__empty">
              <ReceiptText size={24} />
              <p>비교할 지출 내역이 없어요.</p>
            </div>
          )}
        </article>
      </section>

      <article className={`expense-statistics-insight is-${comparison.tone}`}>
        <span>
          {comparison.tone === 'down' ? (
            <ArrowDown size={19} />
          ) : comparison.tone === 'up' ? (
            <ArrowUp size={19} />
          ) : (
            <Info size={19} />
          )}
        </span>
        <div>
          <strong>{period === 'daily' ? '오늘의 소비 인사이트' : '이번 달 소비 인사이트'}</strong>
          <p>
            {comparison.text}{' '}
            {total > 0
              ? `가장 큰 지출은 ${categoryStats.slice().sort((left, right) => right.amount - left.amount)[0]?.label ?? '기타'}예요.`
              : '지출을 기록하면 소비 흐름을 분석해 드릴게요.'}
          </p>
        </div>
        {comparison.ratio !== null && <strong>{comparison.ratio.toFixed(1)}%</strong>}
      </article>

      {listOpen && (
        <ExpenseListDialog
          title={
            period === 'daily'
              ? `${visibleDate.getMonth() + 1}월 ${visibleDate.getDate()}일 지출 목록`
              : `${visibleDate.getFullYear()}년 ${visibleDate.getMonth() + 1}월 지출 목록`
          }
          expenses={currentExpenses}
          onClose={() => setListOpen(false)}
          onDelete={removeExpense}
        />
      )}
    </div>
  );
}

export default ExpenseStatisticsPage;
