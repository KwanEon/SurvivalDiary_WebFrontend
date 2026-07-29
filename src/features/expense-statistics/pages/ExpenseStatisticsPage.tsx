import {
  ArrowDownRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Lightbulb,
  TrendingDown,
  WalletCards,
} from 'lucide-react';
import { categoryBreakdown, dailySpending } from '../mocks';
import '../styles/expense-statistics.css';

function ExpenseStatisticsPage() {
  return (
    <div className="page expense-statistics">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Spending insight</p>
          <h1>지출 통계</h1>
          <p>카테고리와 기간별 소비 흐름을 한눈에 비교해 보세요.</p>
        </div>
        <button className="button button--secondary" type="button">
          <Download size={16} />
          내역 내려받기
        </button>
      </div>

      <div className="expense-statistics__tabs" role="tablist" aria-label="통계 종류">
        <button type="button" role="tab">
          개요
        </button>
        <button className="expense-statistics__tab--active" type="button" role="tab">
          카테고리 분석
        </button>
        <button type="button" role="tab">
          월별 비교
        </button>
        <button type="button" role="tab">
          예산 비교
        </button>
      </div>

      <div className="expense-statistics__toolbar">
        <div className="expense-statistics__month">
          <button type="button" aria-label="이전 달">
            <ChevronLeft size={17} />
          </button>
          <span>
            <CalendarRange size={16} />
            2024년 5월
          </span>
          <button type="button" aria-label="다음 달">
            <ChevronRight size={17} />
          </button>
        </div>
        <button className="button button--secondary" type="button">
          <Filter size={16} />
          필터
        </button>
      </div>

      <section className="expense-statistics__overview">
        <article className="ui-card expense-statistics-total">
          <div className="expense-statistics-total__icon">
            <WalletCards size={21} />
          </div>
          <span>총 지출 금액</span>
          <strong>486,900원</strong>
          <p>
            <TrendingDown size={14} />
            지난달 대비 <b>12.5% 절약</b>
          </p>
        </article>

        <article className="ui-card expense-statistics-line">
          <div className="ui-card__header">
            <div>
              <span>누적 지출</span>
              <h2>이번 달 소비 흐름</h2>
            </div>
            <span className="status-badge">목표 안쪽</span>
          </div>
          <div className="expense-statistics-line__chart">
            <div className="expense-statistics-line__grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <svg
              viewBox="0 0 700 180"
              role="img"
              aria-label="5월 누적 지출이 완만하게 증가한 선 그래프"
            >
              <defs>
                <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,159 L85,142 L175,123 L260,109 L350,102 L435,78 L520,82 L610,48 L700,15 L700,180 L0,180 Z"
                fill="url(#spendingFill)"
              />
              <polyline
                points="0,159 85,142 175,123 260,109 350,102 435,78 520,82 610,48 700,15"
                fill="none"
                stroke="var(--color-primary-600)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[0, 85, 175, 260, 350, 435, 520, 610, 700].map((x, index) => {
                const y = [159, 142, 123, 109, 102, 78, 82, 48, 15][index];
                return (
                  <circle
                    key={x}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#ffffff"
                    stroke="var(--color-primary-600)"
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
            <div className="expense-statistics-line__axis">
              <span>5/1</span>
              <span>5/8</span>
              <span>5/15</span>
              <span>5/22</span>
              <span>5/29</span>
            </div>
          </div>
        </article>
      </section>

      <section className="expense-statistics__details">
        <article className="ui-card expense-statistics-category">
          <div className="ui-card__header">
            <div>
              <span>분류별 분석</span>
              <h2>카테고리 비율</h2>
            </div>
          </div>
          <div className="expense-statistics-category__body">
            <div className="expense-statistics-category__donut">
              <div>
                <span>가장 큰 지출</span>
                <strong>식비 48%</strong>
              </div>
            </div>
            <div className="expense-statistics-category__legend">
              {categoryBreakdown.map((category) => (
                <div key={category.label}>
                  <span
                    className="expense-statistics-category__dot"
                    style={{ background: category.color }}
                  />
                  <span>{category.label}</span>
                  <strong>{category.amount}</strong>
                  <small>{category.percent}%</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="ui-card expense-statistics-daily">
          <div className="ui-card__header">
            <div>
              <span>날짜별 비교</span>
              <h2>일별 지출 비교</h2>
            </div>
            <div className="expense-statistics-daily__legend">
              <span>
                <i className="expense-statistics-daily__current" /> 이번 달
              </span>
              <span>
                <i className="expense-statistics-daily__previous" /> 지난 달
              </span>
            </div>
          </div>
          <div className="expense-statistics-daily__chart">
            {dailySpending.map((item) => (
              <div className="expense-statistics-daily__group" key={item.day}>
                <div>
                  <span
                    className="expense-statistics-daily__bar expense-statistics-daily__bar--current"
                    style={{ height: `${item.current}%` }}
                  />
                  <span
                    className="expense-statistics-daily__bar expense-statistics-daily__bar--previous"
                    style={{ height: `${item.previous}%` }}
                  />
                </div>
                <small>{item.day}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="expense-statistics__insight">
        <span>
          <Lightbulb size={19} />
        </span>
        <div>
          <strong>이번 달 소비 인사이트</strong>
          <p>지난달보다 카페 지출은 8,500원 줄었고, 교통비는 4,200원 늘었어요.</p>
        </div>
        <span className="expense-statistics__insight-rate">
          <ArrowDownRight size={15} />
          12.5%
        </span>
      </article>
    </div>
  );
}

export default ExpenseStatisticsPage;
