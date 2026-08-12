export interface NaverLatLng {
  lat(): number;
  lng(): number;
}

export interface NaverLatLngBounds {
  getSW(): NaverLatLng;
  getNE(): NaverLatLng;
  extend(position: NaverLatLng): void;
}

export interface NaverMap {
  getCenter(): NaverLatLng;
  getBounds(): NaverLatLngBounds;
  getZoom(): number;
  setCenter(position: NaverLatLng): void;
  setZoom(zoom: number, effect?: boolean): void;
  fitBounds(
    bounds: NaverLatLngBounds,
    margin?: { top?: number; right?: number; bottom?: number; left?: number; maxZoom?: number },
  ): void;
  autoResize(): void;
  destroy(): void;
}

export interface NaverOverlay {
  setMap(map: NaverMap | null): void;
}

export interface NaverMarker extends NaverOverlay {
  setPosition(position: NaverLatLng): void;
}

export interface NaverPolyline extends NaverOverlay {}

export interface NaverEventListener {}

interface NaverReverseGeocodeResult {
  name: string;
  code: { id: string };
  region: {
    area1: { name: string };
    area2: { name: string };
  };
}

interface NaverReverseGeocodeResponse {
  v2?: { results?: NaverReverseGeocodeResult[] };
}

interface NaverGeocodeAddress {
  x: string;
  y: string;
  roadAddress?: string;
  jibunAddress?: string;
}

interface NaverGeocodeResponse {
  v2?: { addresses?: NaverGeocodeAddress[] };
}

export interface NaverMaps {
  Map: new (container: HTMLElement, options: { center: NaverLatLng; zoom: number }) => NaverMap;
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  LatLngBounds: new (southWest: NaverLatLng, northEast: NaverLatLng) => NaverLatLngBounds;
  Point: new (x: number, y: number) => object;
  Marker: new (options: {
    map: NaverMap;
    position: NaverLatLng;
    icon?: { content: string; anchor: object };
    zIndex?: number;
  }) => NaverMarker;
  Polyline: new (options: {
    map: NaverMap;
    path: NaverLatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
  }) => NaverPolyline;
  Event: {
    addListener(target: object, type: string, handler: () => void): NaverEventListener;
    removeListener(listener: NaverEventListener | NaverEventListener[]): void;
  };
  Service: {
    Status: { OK: number };
    reverseGeocode(
      options: { coords: NaverLatLng; orders: string },
      callback: (status: number, response?: NaverReverseGeocodeResponse) => void,
    ): void;
    geocode(
      options: { query: string; count?: number },
      callback: (status: number, response: NaverGeocodeResponse) => void,
    ): void;
  };
}

declare global {
  interface Window {
    naver?: { maps: NaverMaps };
    navermap_authFailure?: () => void;
  }
}

let sdkPromise: Promise<NaverMaps> | null = null;

export function loadNaverMaps(clientId: string): Promise<NaverMaps> {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<NaverMaps>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-survival-map-sdk]');
    const script = existing ?? document.createElement('script');
    const handleLoad = () => {
      if (!window.naver?.maps) {
        sdkPromise = null;
        reject(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'));
        return;
      }
      resolve(window.naver.maps);
    };
    const handleError = () => {
      if (!existing) script.remove();
      sdkPromise = null;
      reject(
        new Error(
          '네이버 지도 SDK를 불러오지 못했습니다. API 키와 Web 서비스 URL 설정을 확인해 주세요.',
        ),
      );
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.dataset.survivalMapSdk = 'true';
      script.async = true;
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder`;
      document.head.appendChild(script);
    }
  });
  return sdkPromise;
}
