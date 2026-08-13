import {
  AlertCircle,
  CalendarDays,
  CircleCheck,
  LoaderCircle,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import {
  type ComponentType,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../auth/AuthContext';
import { createManualExpense, getExpenses, type ExpenseEntryRecord } from '../api';
import ExpenseCalendar from '../components/ExpenseCalendar';
import '../styles/expense-entry.css';

const maxExpenseAmount = 2_147_483_647;
const earliestExpenseDate = '2024-01-01';
const wonFormatter = new Intl.NumberFormat('ko-KR');

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
const MoreHorizIcon = createMaterialCategoryIcon(
  'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
);

const categories: Array<{
  id: number;
  label: string;
  icon: CategoryIconComponent;
  tone: 'food' | 'cafe' | 'transport' | 'shopping' | 'etc';
}> = [
  { id: 1, label: '식비', icon: RestaurantIcon, tone: 'food' },
  { id: 2, label: '카페', icon: LocalCafeIcon, tone: 'cafe' },
  { id: 3, label: '교통', icon: DirectionsBusIcon, tone: 'transport' },
  { id: 4, label: '쇼핑', icon: ShoppingBagIcon, tone: 'shopping' },
  { id: 5, label: '기타', icon: MoreHorizIcon, tone: 'etc' },
];

interface FormErrors {
  category?: string;
  title?: string;
  amount?: string;
  memo?: string;
  submit?: string;
}

function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function readableDate(value: string) {
  if (!value) return '선택 안 함';
  const [year, month, day] = value.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export default function ExpenseEntryPage() {
  const { user } = useAuth();
  const today = useMemo(() => localDateValue(), []);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [spentAt, setSpentAt] = useState(today);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expenses, setExpenses] = useState<ExpenseEntryRecord[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState('');

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const numericAmount = Number(amount.replaceAll(',', '')) || 0;
  const selectedDateExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.spentAt.slice(0, 10) === spentAt)
        .sort((a, b) => b.expenseId - a.expenseId),
    [expenses, spentAt],
  );
  const selectedDateTotal = selectedDateExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  const loadExpenses = useCallback(async (signal?: AbortSignal) => {
    setExpensesLoading(true);
    setExpensesError('');
    try {
      const nextExpenses = await getExpenses(signal);
      if (signal?.aborted) return;
      setExpenses(nextExpenses);
    } catch (loadError) {
      if (signal?.aborted) return;
      setExpensesError(
        loadError instanceof Error
          ? loadError.message
          : '지출 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      if (!signal?.aborted) setExpensesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadExpenses(controller.signal);
    return () => controller.abort();
  }, [loadExpenses]);

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
    setSuccessMessage('');
  };

  const changeAmount = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setAmount(digits ? wonFormatter.format(Number(digits)) : '');
    clearError('amount');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedMemo = memo.trim();

    if (categoryId === null) nextErrors.category = '카테고리를 선택해 주세요.';
    if (!trimmedTitle) nextErrors.title = '지출 내용을 입력해 주세요.';
    else if (trimmedTitle.length > 100)
      nextErrors.title = '지출 내용은 100자 이하로 입력해 주세요.';
    if (!amount) nextErrors.amount = '금액을 입력해 주세요.';
    else if (numericAmount <= 0) nextErrors.amount = '올바른 금액을 입력해 주세요.';
    else if (numericAmount > maxExpenseAmount)
      nextErrors.amount = '금액은 2,147,483,647원 이하로 입력해 주세요.';
    if (trimmedMemo.length > 200) nextErrors.memo = '메모는 200자 이하로 입력해 주세요.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    if (!validate()) return;
    if (!user || categoryId === null) {
      setErrors({ submit: '지출을 저장하려면 로그인이 필요해요.' });
      return;
    }

    setSaving(true);
    try {
      await createManualExpense({
        userId: user.userId,
        categoryId,
        title: title.trim(),
        amount: numericAmount,
        spentAt: `${spentAt}T00:00:00`,
        memo: memo.trim() || null,
      });
      setCategoryId(null);
      setTitle('');
      setAmount('');
      setMemo('');
      setErrors({});
      setSuccessMessage('지출이 등록되었습니다.');
      await loadExpenses();
    } catch (saveError) {
      setErrors({
        submit:
          saveError instanceof Error
            ? saveError.message
            : '지출을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page expense-entry">
      <div className="page-heading expense-entry__heading">
        <div>
          <h1>지출 등록</h1>
          <p>나의 지출을 기록해요.</p>
        </div>
        <span className="expense-entry__today">
          <CalendarDays size={16} /> {readableDate(today)}
        </span>
      </div>

      <div className="expense-entry__layout">
        <div className="expense-entry__main">
          <section className="ui-card expense-entry-calendar-card">
            <div className="expense-entry-calendar-card__heading">
              <span>
                <CalendarDays size={20} />
              </span>
              <div>
                <h2>날짜 선택</h2>
                <p>지출을 확인하거나 등록할 날짜를 선택해 주세요.</p>
              </div>
            </div>
            <ExpenseCalendar
              selectedDate={spentAt}
              firstDate={earliestExpenseDate}
              lastDate={today}
              onChange={(date) => {
                setSpentAt(date);
                setSuccessMessage('');
              }}
            />
          </section>

          <section className="ui-card expense-entry-day">
            <div className="expense-entry-day__heading">
              <div>
                <h2>{readableDate(spentAt)} 지출</h2>
                <p>선택한 날짜에 등록된 지출 내역이에요.</p>
              </div>
              {!expensesLoading && !expensesError && (
                <strong>
                  {selectedDateExpenses.length}건 · {wonFormatter.format(selectedDateTotal)}원
                </strong>
              )}
            </div>

            {expensesLoading ? (
              <div className="expense-entry-day__state" aria-label="지출 내역 불러오는 중">
                <LoaderCircle className="spin" size={22} />
                <span>지출 내역을 불러오고 있어요.</span>
              </div>
            ) : expensesError ? (
              <div className="expense-entry-day__state is-error" role="alert">
                <AlertCircle size={22} />
                <span>{expensesError}</span>
                <button type="button" onClick={() => void loadExpenses()}>
                  다시 불러오기
                </button>
              </div>
            ) : selectedDateExpenses.length === 0 ? (
              <div className="expense-entry-day__state">
                <ReceiptText size={23} />
                <span>이날 등록된 지출이 없어요.</span>
              </div>
            ) : (
              <div className="expense-entry-day__list">
                {selectedDateExpenses.map((expense) => {
                  const category =
                    categories.find((item) => item.id === expense.categoryId) ?? categories[4];
                  const Icon = category.icon;

                  return (
                    <article className="expense-entry-day__item" key={expense.expenseId}>
                      <span className={`expense-entry-day__icon is-${category.tone}`}>
                        <Icon size={20} />
                      </span>
                      <div>
                        <strong>{expense.title}</strong>
                        <small>
                          {category.label}
                          {expense.memo ? ` · ${expense.memo}` : ''}
                        </small>
                      </div>
                      <b>{wonFormatter.format(expense.amount)}원</b>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <form
            className="ui-card expense-entry__form"
            noValidate
            onSubmit={(event) => void saveExpense(event)}
          >
            <div className="expense-entry__form-header">
              <span className="expense-entry__form-icon">
                <ReceiptText size={21} />
              </span>
              <div>
                <h2>직접 지출 입력</h2>
              </div>
            </div>

            {successMessage && (
              <div className="expense-entry-message expense-entry-message--success" role="status">
                <CircleCheck size={18} /> {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="expense-entry-message expense-entry-message--error" role="alert">
                <AlertCircle size={18} /> {errors.submit}
              </div>
            )}

            <fieldset className="expense-entry__group">
              <legend>카테고리</legend>
              <small>하나를 선택해 주세요.</small>
              <div className="expense-entry__categories">
                {categories.map(({ id, label, icon: Icon, tone }) => (
                  <button
                    className={`expense-entry__category expense-entry__category--${tone} ${
                      categoryId === id ? 'is-active' : ''
                    }`}
                    type="button"
                    role="radio"
                    aria-checked={categoryId === id}
                    key={id}
                    onClick={() => {
                      setCategoryId(id);
                      clearError('category');
                    }}
                  >
                    <span>
                      <Icon size={20} />
                    </span>
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
              {errors.category && <p className="expense-entry__field-error">{errors.category}</p>}
            </fieldset>

            <label className="expense-entry__field">
              <span>지출 내용</span>
              <input
                value={title}
                maxLength={100}
                placeholder="예: 점심 김치찌개"
                aria-invalid={Boolean(errors.title)}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearError('title');
                }}
              />
              {errors.title && <small className="expense-entry__field-error">{errors.title}</small>}
            </label>

            <label className="expense-entry__field">
              <span>금액</span>
              <span className="expense-entry__amount">
                <input
                  value={amount}
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                  aria-invalid={Boolean(errors.amount)}
                  onChange={(event) => changeAmount(event.target.value)}
                />
                <small>원</small>
              </span>
              {errors.amount && (
                <small className="expense-entry__field-error">{errors.amount}</small>
              )}
            </label>

            <label className="expense-entry__field">
              <span>
                메모 <small>(선택)</small>
              </span>
              <textarea
                value={memo}
                rows={3}
                maxLength={200}
                placeholder="기억할 내용을 남겨 보세요."
                aria-invalid={Boolean(errors.memo)}
                onChange={(event) => {
                  setMemo(event.target.value);
                  clearError('memo');
                }}
              />
              <span className="expense-entry__memo-meta">
                {errors.memo ? (
                  <small className="expense-entry__field-error">{errors.memo}</small>
                ) : (
                  <i />
                )}
                <small>{memo.length}/200</small>
              </span>
            </label>

            <button
              className="button button--primary expense-entry__submit"
              type="submit"
              disabled={saving}
            >
              {saving ? <LoaderCircle className="spin" size={18} /> : <ReceiptText size={18} />}
              {saving ? '저장 중...' : '지출 저장'}
            </button>
          </form>
        </div>

        <aside className="expense-entry__aside">
          <article className="ui-card expense-entry-preview">
            <div className="expense-entry-preview__heading">
              <span>
                <WalletCards size={19} />
              </span>
              <div>
                <h2>등록 전 확인</h2>
              </div>
            </div>
            <dl>
              <div>
                <dt>등록 방식</dt>
                <dd>직접 입력</dd>
              </div>
              <div>
                <dt>카테고리</dt>
                <dd>{selectedCategory?.label ?? '선택 전'}</dd>
              </div>
              <div>
                <dt>지출 날짜</dt>
                <dd>{readableDate(spentAt)}</dd>
              </div>
              <div>
                <dt>기록 금액</dt>
                <dd className="expense-entry-preview__accent">
                  {numericAmount ? `${wonFormatter.format(numericAmount)}원` : '0원'}
                </dd>
              </div>
            </dl>
          </article>
        </aside>
      </div>
    </div>
  );
}
