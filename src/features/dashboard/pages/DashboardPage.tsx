import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bus,
  Coffee,
  MapPinned,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Utensils,
  WalletCards,
} from 'lucide-react';
import { Link } from 'wouter';
import { categorySpending, quickActions, recentExpenses } from '../mocks';
import '../styles/dashboard.css';

const expenseIcons = [Coffee, Bus, ShoppingBag, Utensils, ReceiptText];
const quickIcons = [Plus, BarChart3, Sparkles, MapPinned];

function DashboardPage() {
  return (
    <div className="page dashboard">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Savings dashboard</p>
          <h1>안녕하세요, 생존러님! 👋</h1>
          <p>오늘의 작은 선택이 이번 달 절약 목표를 만들어요.</p>
        </div>
        <Link className="button button--primary" href="/expenses/new">
          <Plus size={17} />
          지출 등록
        </Link>
      </div>

      <section className="dashboard__summary" aria-label="이번 달 지출 요약">
        <article className="dashboard-balance">
          <div className="dashboard-balance__copy">
            <span>현재 사용 가능 금액</span>
            <strong>
              1,245,800<small>원</small>
            </strong>
            <p>목표 2,000,000원</p>
          </div>
          <div className="dashboard-balance__art" aria-hidden="true">
            <img src="/brand/app-icon.png" alt="" />
          </div>
          <div className="dashboard-balance__progress">
            <span style={{ width: '62%' }} />
          </div>
          <div className="dashboard-balance__footer">
            <span>이번 달 예산의 62%가 남았어요</span>
            <ArrowUpRight size={16} />
          </div>
        </article>

        <article className="ui-card dashboard-monthly">
          <div className="ui-card__header">
            <h2>이번 달 지출 요약</h2>
            <span className="status-badge">5월</span>
          </div>
          <div className="dashboard-monthly__metrics">
            <div>
              <span>사용 금액</span>
              <strong>486,900원</strong>
              <small className="dashboard-monthly__positive">지난달보다 12.5% 절약</small>
            </div>
            <div>
              <span>예산 대비</span>
              <strong>76%</strong>
              <small>예산 640,000원</small>
            </div>
          </div>
          <div className="dashboard-monthly__bar">
            <span style={{ width: '76%' }} />
          </div>
        </article>
      </section>

      <section className="dashboard__content">
        <article className="ui-card dashboard-expenses">
          <div className="ui-card__header">
            <div>
              <span className="dashboard__section-kicker">최근 기록</span>
              <h2>최근 지출 내역</h2>
            </div>
            <Link href="/expenses/statistics">
              전체 내역 <ArrowRight size={14} />
            </Link>
          </div>

          <div className="dashboard-expenses__list">
            {recentExpenses.map((expense, index) => {
              const Icon = expenseIcons[index];
              return (
                <div className="dashboard-expense" key={`${expense.name}-${expense.date}`}>
                  <span
                    className={`dashboard-expense__icon dashboard-expense__icon--${expense.tone}`}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <strong>{expense.name}</strong>
                    <small>{expense.category}</small>
                  </div>
                  <strong>{expense.amount}</strong>
                  <time>{expense.date}</time>
                </div>
              );
            })}
          </div>
          <Link className="dashboard-expenses__cta" href="/expenses/new">
            <Plus size={15} />
            지출 내역 추가하기
          </Link>
        </article>

        <div className="dashboard__side">
          <article className="ui-card dashboard-category">
            <div className="ui-card__header">
              <div>
                <span className="dashboard__section-kicker">소비 분석</span>
                <h2>이번 달 카테고리 비율</h2>
              </div>
            </div>
            <div className="dashboard-category__body">
              <div
                className="dashboard-category__donut"
                role="img"
                aria-label="식비 48%, 교통 15%, 카페 12%, 쇼핑 10%, 기타 15%"
              >
                <span>총 지출</span>
                <strong>486,900</strong>
              </div>
              <div className="dashboard-category__legend">
                {categorySpending.map((category) => (
                  <div key={category.label}>
                    <span
                      className="dashboard-category__dot"
                      style={{ background: category.color }}
                    />
                    <span>{category.label}</span>
                    <strong>{category.percent}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="ui-card dashboard-quick">
            <div className="ui-card__header">
              <h2>빠른 실행</h2>
            </div>
            <div className="dashboard-quick__grid">
              {quickActions.map((action, index) => {
                const Icon = quickIcons[index];
                return (
                  <Link key={action.label} href={action.to}>
                    <span>
                      <Icon size={18} />
                    </span>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </Link>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="ui-card dashboard-tip">
        <span className="dashboard-tip__icon">
          <WalletCards size={22} />
        </span>
        <div>
          <strong>오늘은 23,100원까지 사용할 수 있어요.</strong>
          <p>계획한 하루 예산을 지키면 이번 달 목표보다 82,300원을 더 아낄 수 있어요.</p>
        </div>
        <button className="button button--soft" type="button">
          오늘 한도 조정
        </button>
      </section>
    </div>
  );
}

export default DashboardPage;
