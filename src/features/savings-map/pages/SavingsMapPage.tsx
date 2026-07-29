import {
  Banknote,
  Bookmark,
  Building,
  CarFront,
  ChevronDown,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Store,
  Utensils,
} from 'lucide-react';
import { mapCategories, mapMarkers } from '../mocks';
import '../styles/savings-map.css';

const MarkerIcon = ({ tone }: { tone: 'green' | 'blue' | 'orange' }) => {
  if (tone === 'blue') return <CarFront size={17} />;
  if (tone === 'orange') return <Store size={17} />;
  return <Utensils size={17} />;
};

function SavingsMapPage() {
  return (
    <div className="page savings-map">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Savings map</p>
          <h1>절약 지도</h1>
          <p>내 주변의 합리적인 가격 정보와 공공시설을 지도에서 찾아보세요.</p>
        </div>
        <button className="button button--secondary" type="button">
          <LocateFixed size={17} />내 위치로
        </button>
      </div>

      <section className="savings-map__controls" aria-label="지도 검색과 필터">
        <div className="savings-map__categories">
          {mapCategories.map((category, index) => (
            <button
              className={`chip ${index === 0 ? 'chip--active' : ''}`}
              type="button"
              key={category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="savings-map__search-row">
          <label className="savings-map__search">
            <Search size={17} />
            <input type="search" placeholder="장소나 지역을 검색하세요." />
          </label>
          <button className="savings-map__distance" type="button">
            거리순
            <ChevronDown size={15} />
          </button>
          <button className="icon-button" type="button" aria-label="지도 상세 필터">
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </section>

      <section className="ui-card savings-map__workspace">
        <div className="savings-map__canvas" aria-label="서울 강남구 주변 절약 장소 지도">
          <div className="savings-map__river" aria-hidden="true" />
          <div className="savings-map__road savings-map__road--one" aria-hidden="true" />
          <div className="savings-map__road savings-map__road--two" aria-hidden="true" />
          <div className="savings-map__road savings-map__road--three" aria-hidden="true" />
          <span className="savings-map__district savings-map__district--one">역삼동</span>
          <span className="savings-map__district savings-map__district--two">논현동</span>
          <span className="savings-map__district savings-map__district--three">삼성동</span>

          {mapMarkers.map((marker) => (
            <button
              className={`savings-map__marker savings-map__marker--${marker.tone} ${
                marker.id === 1 ? 'savings-map__marker--selected' : ''
              }`}
              style={{ top: marker.top, left: marker.left }}
              type="button"
              aria-label={marker.label}
              key={marker.id}
            >
              <MarkerIcon tone={marker.tone} />
            </button>
          ))}

          <div className="savings-map__zoom">
            <button type="button" aria-label="지도 확대">
              +
            </button>
            <button type="button" aria-label="지도 축소">
              −
            </button>
          </div>

          <button className="savings-map__locate" type="button">
            <LocateFixed size={17} />
            현재 위치
          </button>
        </div>

        <aside className="savings-map-place">
          <div className="savings-map-place__visual" aria-label="카페 내부 이미지 영역">
            <div className="savings-map-place__awning" />
            <div className="savings-map-place__window">
              <span />
              <span />
              <span />
            </div>
            <span className="savings-map-place__plant">♣</span>
            <span className="savings-map-place__table" />
            <button type="button" aria-label="장소 저장">
              <Bookmark size={18} />
            </button>
          </div>

          <div className="savings-map-place__content">
            <div className="savings-map-place__heading">
              <div>
                <span className="status-badge">착한가격업소</span>
                <h2>안녕동 주민센터 북카페</h2>
              </div>
              <strong>230m</strong>
            </div>
            <div className="savings-map-place__tags">
              <span>공공시설</span>
              <span>무료</span>
              <span>와이파이</span>
            </div>

            <dl className="savings-map-place__details">
              <div>
                <dt>
                  <MapPin size={15} />
                  위치
                </dt>
                <dd>서울 마포구 안녕로 67-9</dd>
              </div>
              <div>
                <dt>
                  <Clock3 size={15} />
                  운영시간
                </dt>
                <dd>평일 09:00 ~ 18:00</dd>
              </div>
              <div>
                <dt>
                  <Banknote size={15} />
                  이용료
                </dt>
                <dd>무료</dd>
              </div>
              <div>
                <dt>
                  <Building size={15} />
                  시설
                </dt>
                <dd>열람석, 어린이실, 콘센트</dd>
              </div>
            </dl>

            <div className="savings-map-place__survey">
              <span>조사일 2024.05.01</span>
              <span>공공데이터 기준</span>
            </div>

            <div className="savings-map-place__actions">
              <button className="button button--secondary" type="button">
                <Navigation size={15} />
                길찾기
              </button>
              <button className="button button--primary" type="button">
                상세 정보 보기
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="savings-map__legend" aria-label="지도 범례">
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--green" />
          착한가격·공공시설
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--orange" />
          지역 평균가격
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--blue" />
          공영주차장
        </span>
        <p>실제 위치와 정보는 API 연동 후 제공됩니다.</p>
      </section>
    </div>
  );
}

export default SavingsMapPage;
