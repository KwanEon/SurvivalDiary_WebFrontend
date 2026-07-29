import {
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Info,
  Paperclip,
  ReceiptText,
  Smartphone,
} from 'lucide-react';
import { expenseCategories } from '../mocks';
import '../styles/expense-entry.css';

function ExpenseEntryPage() {
  return (
    <div className="page expense-entry">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Expense diary</p>
          <h1>지출 등록</h1>
          <p>오늘의 지출을 기록하고 남은 하루 예산을 확인해 보세요.</p>
        </div>
        <span className="expense-entry__today">
          <CalendarDays size={16} />
          2024년 5월 12일
        </span>
      </div>

      <div className="expense-entry__layout">
        <section className="ui-card expense-entry__form" aria-labelledby="expense-form-title">
          <div className="expense-entry__form-header">
            <span className="expense-entry__form-icon">
              <ReceiptText size={21} />
            </span>
            <div>
              <h2 id="expense-form-title">지출 정보</h2>
              <p>필수 항목만 입력하면 간단히 기록할 수 있어요.</p>
            </div>
            <span className="status-badge">직접 입력</span>
          </div>

          <div className="expense-entry__group">
            <div className="expense-entry__label-row">
              <label>카테고리</label>
              <small>하나를 선택해 주세요.</small>
            </div>
            <div className="expense-entry__categories">
              {expenseCategories.map(({ label, icon: Icon }, index) => (
                <button
                  className={`expense-entry__category ${
                    index === 0 ? 'expense-entry__category--active' : ''
                  }`}
                  type="button"
                  key={label}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="expense-entry__row">
            <label className="expense-entry__field">
              <span>결제 수단</span>
              <span className="expense-entry__select">
                <select defaultValue="card">
                  <option value="card">신용카드</option>
                  <option value="check">체크카드</option>
                  <option value="cash">현금</option>
                  <option value="transfer">계좌이체</option>
                </select>
                <ChevronDown size={16} />
              </span>
            </label>

            <label className="expense-entry__field">
              <span>금액</span>
              <span className="expense-entry__amount">
                <input type="text" inputMode="numeric" defaultValue="12,500" />
                <small>원</small>
              </span>
            </label>
          </div>

          <label className="expense-entry__field">
            <span>지출 일자</span>
            <span className="expense-entry__input-with-icon">
              <input type="text" defaultValue="2024.05.12" />
              <CalendarDays size={17} />
            </span>
          </label>

          <label className="expense-entry__field">
            <span>사용처</span>
            <input type="text" placeholder="예: 스타벅스 강남점" />
          </label>

          <label className="expense-entry__field">
            <span>
              메모 <small>(선택)</small>
            </span>
            <textarea rows={3} placeholder="지출에 대한 메모를 남겨 주세요." />
          </label>

          <div className="expense-entry__receipt">
            <div className="expense-entry__label-row">
              <label>영수증 사진 첨부</label>
              <small>선택 · JPG, PNG</small>
            </div>
            <button className="expense-entry__dropzone" type="button">
              <span>
                <Paperclip size={19} />
              </span>
              <strong>파일을 놓거나 클릭해서 선택하세요</strong>
              <small>파일당 최대 10MB</small>
            </button>
          </div>

          <div className="expense-entry__actions">
            <button className="button button--secondary" type="button">
              취소
            </button>
            <button className="button button--primary" type="button">
              기록하기
            </button>
          </div>
        </section>

        <aside className="expense-entry__aside">
          <article className="ui-card expense-entry-budget">
            <div className="expense-entry-budget__top">
              <span className="expense-entry-budget__icon">
                <CircleCheck size={19} />
              </span>
              <span className="status-badge">여유</span>
            </div>
            <p>오늘 남은 사용 가능 금액</p>
            <strong>23,100원</strong>
            <div className="expense-entry-budget__bar">
              <span style={{ width: '67%' }} />
            </div>
            <div className="expense-entry-budget__meta">
              <span>사용 11,900원</span>
              <span>한도 35,000원</span>
            </div>
          </article>

          <article className="ui-card expense-entry-preview">
            <div className="ui-card__header">
              <h2>등록 전 확인</h2>
            </div>
            <dl>
              <div>
                <dt>카테고리</dt>
                <dd>식비</dd>
              </div>
              <div>
                <dt>결제 수단</dt>
                <dd>신용카드</dd>
              </div>
              <div>
                <dt>기록 금액</dt>
                <dd>12,500원</dd>
              </div>
              <div>
                <dt>등록 후 잔액</dt>
                <dd className="expense-entry-preview__accent">10,600원</dd>
              </div>
            </dl>
          </article>

          <article className="expense-entry-mobile-note">
            <span>
              <Smartphone size={19} />
            </span>
            <div>
              <strong>모바일 결제 알림 연동</strong>
              <p>앱에서 감지한 결제 내역은 추후 서버 동기화 후 웹에서도 확인할 수 있어요.</p>
            </div>
          </article>

          <div className="expense-entry__notice">
            <Info size={16} />
            <p>현재 화면은 UI 목업이며 저장 기능은 다음 개발 단계에서 연결합니다.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ExpenseEntryPage;
