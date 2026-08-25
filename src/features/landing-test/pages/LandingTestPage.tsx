import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CarFront,
  Check,
  ChevronDown,
  Download,
  Gift,
  Home,
  Landmark,
  MapPin,
  Newspaper,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import '../styles/landing-test.css';

type RevealDirection = 'up' | 'left' | 'right';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
};

function Reveal({ children, className = '', delay = 0, direction = 'up' }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.unobserve(entry.target);
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = { '--landing-delay': `${delay}ms` } as CSSProperties;

  return (
    <div
      ref={elementRef}
      className={`landing-reveal landing-reveal--${direction} ${visible ? 'is-visible' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

type PhoneFrameProps = {
  className?: string;
  label: string;
  src: string;
};

function PhoneFrame({ className = '', label, src }: PhoneFrameProps) {
  return (
    <div className={`landing-phone ${className}`}>
      <img className="landing-phone__image" src={src} alt={label} width="1440" height="3088" />
    </div>
  );
}

const benefits = [
  { icon: ReceiptText, title: '기록', description: '오늘의 지출을 간단하게' },
  { icon: Gift, title: '혜택', description: '놓치기 쉬운 청년 정책을 가깝게' },
  { icon: MapPin, title: '동네', description: '주변 절약 정보를 한눈에' },
];

const guideSteps = [
  {
    icon: Sparkles,
    number: '01',
    title: '관심 정보 설정',
    description: '나에게 맞는 정보의 기준을 알려주세요.',
  },
  {
    icon: ReceiptText,
    number: '02',
    title: '지출 기록',
    description: '오늘 사용한 금액을 간단하게 남겨요.',
  },
  {
    icon: BarChart3,
    number: '03',
    title: '맞춤 결과 확인',
    description: '분석과 정책, 절약 정보를 확인해요.',
  },
];

const faqs = [
  [
    '무료로 사용할 수 있나요?',
    '생존일기의 기본 지출 관리와 정보 탐색 기능은 무료로 이용할 수 있어요.',
  ],
  [
    '추천 정책은 어떤 기준인가요?',
    '나이, 거주 지역, 취업 상태와 관심 정보를 바탕으로 조건에 가까운 정책을 보여드려요.',
  ],
  [
    '절약 지도 정보는 어디서 가져오나요?',
    '공공데이터포털과 각 기관이 제공하는 공개 데이터를 바탕으로 안내해요.',
  ],
  [
    '개인정보는 안전하게 보호되나요?',
    '서비스 운영에 필요한 정보만 사용하며 민감한 정보는 안전하게 관리해요.',
  ],
];

function LandingTestPage() {
  return (
    <div className="landing-test">
      <header className="landing-test__header">
        <a className="landing-test__brand" href="#intro" aria-label="생존일기 소개 처음으로 이동">
          <img src="/brand/app-icon.png" alt="" />
          <strong>생존일기</strong>
        </a>
        <nav className="landing-test__nav" aria-label="소개 페이지 메뉴">
          <a href="#features">주요 기능</a>
          <a href="#map">절약 지도</a>
          <a href="#community">커뮤니티</a>
          <a href="#guide">이용 방법</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="landing-test__download landing-test__download--small" href="#download">
          <Download size={16} /> 앱 다운로드
        </a>
      </header>

      <main>
        <section className="landing-hero" id="intro">
          <div className="landing-hero__glow landing-hero__glow--one" />
          <div className="landing-hero__glow landing-hero__glow--two" />
          <div className="landing-test__container landing-hero__inner">
            <div className="landing-hero__copy">
              <span className="landing-test__eyebrow">청년을 위한 생활비 동반자</span>
              <h1>
                오늘을 기록하고,
                <br />
                내일을 준비해요
              </h1>
              <p>
                지출 관리부터 청년 정책, 맞춤 뉴스와
                <br />
                우리 동네 절약 정보까지 한곳에서 확인하세요.
              </p>
              <div className="landing-hero__actions">
                <a className="landing-test__download" href="#download">
                  <Download size={18} /> 앱 다운로드
                </a>
                <a className="landing-test__text-link" href="#features">
                  기능 둘러보기 <ArrowRight size={17} />
                </a>
              </div>
              <small>
                <ShieldCheck size={14} /> 공공데이터 기반 정책·생활 정보
              </small>
            </div>

            <div className="landing-hero__devices" aria-label="생존일기 앱 주요 화면 미리보기">
              <PhoneFrame
                className="landing-phone--hero landing-phone--hero-back"
                label="지출 통계 앱 화면"
                src="/landing-test/screens/01-expense-statistics.jpg"
              />
              <PhoneFrame
                className="landing-phone--hero landing-phone--hero-main"
                label="생존일기 홈 앱 화면"
                src="/landing-test/screens/02-home-dashboard.jpg"
              />
              <PhoneFrame
                className="landing-phone--hero landing-phone--hero-side"
                label="착한가격업소 지도 앱 화면"
                src="/landing-test/screens/03-good-price-map.jpg"
              />
              <img
                className="landing-hero__mascot"
                src="/brand/mascot-transparent.png"
                alt="생존일기 돼지 캐릭터"
              />
            </div>
          </div>
        </section>

        <section className="landing-value" aria-label="생존일기의 핵심 가치">
          <div className="landing-test__container landing-value__inner">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <Reveal delay={index * 110} key={title}>
                <div className="landing-value__item">
                  <Icon size={27} />
                  <div>
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="landing-story" id="features">
          <span className="landing-story__path" aria-hidden="true" />

          <section className="landing-feature landing-feature--expense">
            <div className="landing-test__container landing-feature__grid">
              <Reveal
                direction="left"
                className="landing-feature__visual landing-feature__visual--expense"
              >
                <PhoneFrame
                  label="날짜별 직접 지출 기록 화면"
                  src="/landing-test/screens/11-expense-budget-entry.jpg"
                />
              </Reveal>
              <Reveal direction="right" delay={100} className="landing-feature__copy">
                <span className="landing-test__eyebrow">01 · 지출과 예산</span>
                <h2>
                  쓰는 순간부터
                  <br />
                  소비 습관이 보여요
                </h2>
                <p>
                  선택한 날짜의 지출을 기록하고, 일간·월간 흐름과 카테고리 변화를 자연스럽게
                  확인해요.
                </p>
                <ul className="landing-feature__checks">
                  <li>
                    <Check /> 날짜별 지출 기록
                  </li>
                  <li>
                    <Check /> 일간·월간 소비 분석
                  </li>
                  <li>
                    <Check /> 카테고리별 비교
                  </li>
                </ul>
              </Reveal>
            </div>
          </section>

          <section className="landing-feature landing-feature--recommend">
            <div className="landing-test__container landing-feature__grid landing-feature__grid--reverse">
              <Reveal direction="left" className="landing-feature__copy">
                <span className="landing-test__eyebrow">02 · 맞춤 정보</span>
                <h2>
                  나에게 필요한 혜택만
                  <br />
                  모아서 확인해요
                </h2>
                <p>
                  나이, 거주 지역, 현재 상황과 관심사를 반영해 지금 확인할 정책과 생활경제 뉴스를
                  정리해 드려요.
                </p>
                <div className="landing-feature__inline-links">
                  <span>
                    <Landmark size={18} /> 청년 정책
                  </span>
                  <span>
                    <Newspaper size={18} /> 맞춤 뉴스
                  </span>
                </div>
              </Reveal>
              <Reveal
                direction="right"
                delay={100}
                className="landing-feature__visual landing-feature__visual--duo"
              >
                <PhoneFrame
                  label="맞춤 청년 정책 화면"
                  src="/landing-test/screens/05-personalized-policy.jpg"
                />
                <PhoneFrame
                  label="맞춤 뉴스 화면"
                  src="/landing-test/screens/06-personalized-news.jpg"
                />
              </Reveal>
            </div>
          </section>
        </div>

        <section className="landing-map" id="map">
          <div className="landing-test__container landing-map__grid">
            <Reveal direction="left" className="landing-map__visual landing-map__phones">
              <PhoneFrame
                label="공영주차장 지도 앱 화면"
                src="/landing-test/screens/07-public-parking-map.jpg"
              />
              <PhoneFrame
                label="주거지 지도 앱 화면"
                src="/landing-test/screens/08-housing-map.jpg"
              />
            </Reveal>
            <Reveal direction="right" delay={120} className="landing-feature__copy">
              <span className="landing-test__eyebrow">03 · 절약 지도</span>
              <h2>
                우리 동네의 절약 정보를
                <br />더 가까이
              </h2>
              <p>가격과 운영 정보, 위치를 한눈에 살펴보고 필요한 곳까지 바로 길찾기를 시작해요.</p>
              <div className="landing-map__categories">
                <span>
                  <Utensils /> 착한가격업소
                </span>
                <span>
                  <Building2 /> 공공시설
                </span>
                <span>
                  <CarFront /> 공영주차장
                </span>
                <span>
                  <Home /> 주거 정보
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="landing-community" id="community">
          <div className="landing-test__container landing-community__grid">
            <Reveal direction="left" className="landing-community__copy">
              <span className="landing-test__eyebrow">04 · 커뮤니티</span>
              <h2>혼자 아끼지 않아도 괜찮아요</h2>
              <p>
                비슷한 고민을 가진 사람들과 절약 경험을 나누고, 서로의 질문에 답하며 함께 성장해요.
              </p>
            </Reveal>
            <Reveal direction="right" delay={100} className="landing-community__phones">
              <PhoneFrame
                label="절약 커뮤니티 게시글 목록 화면"
                src="/landing-test/screens/09-community-list.jpg"
              />
              <PhoneFrame
                label="절약 커뮤니티 게시글 상세 화면"
                src="/landing-test/screens/10-community-detail.jpg"
              />
            </Reveal>
          </div>
        </section>

        <section className="landing-guide" id="guide">
          <div className="landing-test__container">
            <Reveal className="landing-test__section-heading">
              <span className="landing-test__eyebrow">간단한 시작</span>
              <h2>세 단계면 충분해요</h2>
            </Reveal>
            <div className="landing-guide__steps">
              {guideSteps.map(({ icon: StepIcon, number, title, description }, index) => (
                <Reveal delay={index * 140} key={number}>
                  <article>
                    <span className="landing-guide__number">{number}</span>
                    <span className="landing-guide__icon">
                      <StepIcon />
                    </span>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-trust">
          <div className="landing-test__container landing-trust__grid">
            <Reveal direction="left">
              <span className="landing-test__eyebrow">신뢰할 수 있는 정보</span>
              <h2>공식 데이터로 준비했어요</h2>
              <p>
                정책과 지도 정보는 공공기관의 공개 데이터를 바탕으로 최신 내용을 확인해 제공해요.
              </p>
              <div className="landing-trust__sources">
                <span>공공데이터포털</span>
                <span>온통청년</span>
                <span>국토교통부</span>
              </div>
            </Reveal>
            <Reveal direction="right" delay={100} className="landing-trust__privacy">
              <ShieldCheck size={44} />
              <div>
                <strong>개인정보는 필요한 만큼만</strong>
                <p>
                  서비스 운영에 필요한 정보만 안전하게 관리하며, 사용자 동의 없이 제공하지 않아요.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="landing-faq" id="faq">
          <div className="landing-test__container landing-faq__grid">
            <Reveal direction="left" className="landing-faq__heading">
              <span className="landing-test__eyebrow">FAQ</span>
              <h2>자주 묻는 질문</h2>
              <p>생존일기를 시작하기 전에 궁금한 내용을 확인해 보세요.</p>
            </Reveal>
            <Reveal direction="right" delay={100} className="landing-faq__items">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="landing-cta" id="download">
          <Reveal className="landing-test__container landing-cta__inner">
            <img src="/brand/app-icon.png" alt="" />
            <div>
              <span>오늘의 기록이 내일의 여유가 되도록</span>
              <h2>지금 생존일기를 시작해 보세요</h2>
            </div>
            <a className="landing-test__download" href="#intro">
              <Download size={18} /> 앱 다운로드
            </a>
          </Reveal>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-test__container landing-footer__inner">
          <a className="landing-test__brand" href="#intro">
            <img src="/brand/app-icon.png" alt="" />
            <strong>생존일기</strong>
          </a>
          <nav aria-label="하단 메뉴">
            <a href="#faq">이용약관</a>
            <a href="#faq">개인정보 처리방침</a>
            <a href="#faq">문의하기</a>
            <a href="https://github.com/KwanEon/SurvivalDiary_WebFrontend">GitHub</a>
          </nav>
          <small>© 2026 생존일기</small>
        </div>
      </footer>
    </div>
  );
}

export default LandingTestPage;
