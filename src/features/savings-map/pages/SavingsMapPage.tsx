import {
  Banknote,
  Bookmark,
  BookmarkCheck,
  Building,
  Car,
  Clock3,
  Home,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Store,
  Users,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { updateDefaultResidence } from '../../profile/api';
import {
  fetchDirections,
  fetchGoodPriceStores,
  fetchHousingRentDeals,
  fetchMapLocationSearch,
  fetchMapRegion,
  fetchPublicFacilities,
  fetchPublicParkingLots,
} from '../api';
import { favoriteKey, loadMapFavorites, saveMapFavorites } from '../favorites';
import {
  loadNaverMaps,
  type NaverEventListener,
  type NaverMap,
  type NaverMaps,
  type NaverMarker,
  type NaverPolyline,
} from '../naver';
import type {
  Coordinates,
  DirectionsRoute,
  GoodPriceStore,
  HousingRentDeal,
  MapBounds,
  MapCategory,
  MapRegion,
  PublicFacility,
  PublicParkingLot,
  SelectedMapItem,
} from '../types';
import '../styles/savings-map.css';

const DEFAULT_CENTER: Coordinates = { latitude: 36.35, longitude: 127.8 };
const NAVER_AUTH_ERROR =
  '네이버 지도 인증에 실패했습니다. Web Dynamic Map Client ID와 등록 URL을 확인해 주세요.';
let naverMapAuthenticationFailed = false;

const CATEGORY_OPTIONS: { value: MapCategory; label: string }[] = [
  { value: 'favorites', label: 'MY' },
  { value: 'good-price', label: '착한가격업소' },
  { value: 'public-facility', label: '공공시설' },
  { value: 'public-parking', label: '공영주차장' },
  { value: 'housing', label: '주거지' },
];

const GOOD_PRICE_GROUPS = [
  { value: 'all', label: '전체' },
  { value: 'food', label: '음식점' },
  { value: 'beauty', label: '미용업' },
  { value: 'barber', label: '이용업' },
  { value: 'laundry', label: '세탁업' },
  { value: 'lodging', label: '숙박업' },
  { value: 'bath', label: '목욕업' },
  { value: 'other', label: '기타' },
] as const;

interface OverlayEntry {
  marker: NaverMarker;
  listener: NaverEventListener;
}

interface AddressMatch {
  latitude: number;
  longitude: number;
  label: string;
  address: string;
}

function SavingsMapPage() {
  const { user, updateUser } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const mapsRef = useRef<NaverMaps | null>(null);
  const overlaysRef = useRef<OverlayEntry[]>([]);
  const locationMarkerRef = useRef<NaverMarker | null>(null);
  const routePolylineRef = useRef<NaverPolyline | null>(null);
  const dataAbortRef = useRef<AbortController | null>(null);
  const directionsAbortRef = useRef<AbortController | null>(null);
  const addressSearchAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const refreshViewportRef = useRef<(force?: boolean) => Promise<void>>(async () => undefined);
  const lastViewportRequestKeyRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const defaultResidenceRef = useRef<Coordinates | null>(null);
  const defaultResidenceAddressRef = useRef<AddressMatch | null>(null);
  const recentAddressRef = useRef<AddressMatch | null>(null);

  const [category, setCategory] = useState<MapCategory>('favorites');
  const [goodPriceCategory, setGoodPriceCategory] = useState('all');
  const [facilityFreeOnly, setFacilityFreeOnly] = useState(false);
  const [parkingFreeOnly, setParkingFreeOnly] = useState(false);
  const [goodPriceStores, setGoodPriceStores] = useState<GoodPriceStore[]>([]);
  const [publicFacilities, setPublicFacilities] = useState<PublicFacility[]>([]);
  const [parkingLots, setParkingLots] = useState<PublicParkingLot[]>([]);
  const [housingDeals, setHousingDeals] = useState<HousingRentDeal[]>([]);
  const [favorites, setFavorites] = useState<Map<string, SelectedMapItem>>(loadMapFavorites);
  const [selected, setSelected] = useState<SelectedMapItem | null>(null);
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null);
  const [viewportCenter, setViewportCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [mapReady, setMapReady] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);
  const [addressSearchResult, setAddressSearchResult] = useState<string | null>(null);
  const [addressMatches, setAddressMatches] = useState<AddressMatch[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressMatch | null>(null);
  const [residenceSaving, setResidenceSaving] = useState(false);
  const [directionsRoute, setDirectionsRoute] = useState<DirectionsRoute | null>(null);
  const [directionsDestination, setDirectionsDestination] = useState<string | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);

  const clearMapOverlays = useCallback(() => {
    const maps = mapsRef.current;
    for (const entry of overlaysRef.current) {
      if (maps) maps.Event.removeListener(entry.listener);
      entry.marker.setMap(null);
    }
    overlaysRef.current = [];
  }, []);

  const placeCurrentLocation = useCallback((position: GeolocationPosition) => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps) return;
    const coordinate = new maps.LatLng(position.coords.latitude, position.coords.longitude);
    setLocationAccuracy(position.coords.accuracy);
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setPosition(coordinate);
      locationMarkerRef.current.setMap(map);
    } else {
      locationMarkerRef.current = new maps.Marker({ map, position: coordinate, zIndex: 20 });
    }
    map.setCenter(coordinate);
    map.setZoom(15, true);
  }, []);

  const placeDefaultResidence = useCallback((coordinates: Coordinates) => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps) return;
    const coordinate = new maps.LatLng(coordinates.latitude, coordinates.longitude);
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setPosition(coordinate);
      locationMarkerRef.current.setMap(map);
    } else {
      locationMarkerRef.current = new maps.Marker({ map, position: coordinate, zIndex: 20 });
    }
    map.setCenter(coordinate);
    map.setZoom(15, true);
  }, []);

  useEffect(() => {
    const latitude = user?.defaultResidenceLatitude;
    const longitude = user?.defaultResidenceLongitude;
    const residence =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? { latitude, longitude }
        : null;
    defaultResidenceRef.current = residence;
    defaultResidenceAddressRef.current =
      residence && user?.defaultResidenceAddress?.trim()
        ? {
            ...residence,
            address: user.defaultResidenceAddress.trim(),
            label: user.defaultResidenceAddress.trim(),
          }
        : null;
    if (residence && mapReady) placeDefaultResidence(residence);
  }, [
    mapReady,
    placeDefaultResidence,
    user?.defaultResidenceAddress,
    user?.defaultResidenceLatitude,
    user?.defaultResidenceLongitude,
  ]);

  const moveToCurrentLocation = useCallback(async () => {
    if (!mapRef.current) return;
    setIsLocating(true);
    setLocationError(null);
    setLocationAccuracy(null);
    try {
      const position = await requestCurrentPosition();
      placeCurrentLocation(position);
    } catch (error) {
      setLocationError(locationErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  }, [placeCurrentLocation]);

  const refreshViewport = useCallback(
    async (force = false) => {
      const map = mapRef.current;
      const maps = mapsRef.current;
      if (!map || !maps) return;

      const center = map.getCenter();
      const bounds = map.getBounds();
      const southWest = bounds.getSW();
      const northEast = bounds.getNE();
      const nextCenter = { latitude: center.lat(), longitude: center.lng() };
      const nextBounds = {
        southWestLat: southWest.lat(),
        southWestLng: southWest.lng(),
        northEastLat: northEast.lat(),
        northEastLng: northEast.lng(),
      };
      const requestKey = [
        category,
        category === 'public-parking' ? parkingFreeOnly : facilityFreeOnly,
        nextBounds.southWestLat.toFixed(4),
        nextBounds.southWestLng.toFixed(4),
        nextBounds.northEastLat.toFixed(4),
        nextBounds.northEastLng.toFixed(4),
      ].join('|');
      if (!force && requestKey === lastViewportRequestKeyRef.current) return;
      lastViewportRequestKeyRef.current = requestKey;
      setViewportCenter(nextCenter);
      setViewportBounds(nextBounds);
      setSelected(null);
      const addressFallback = closestAddressInViewport(nextCenter, nextBounds, [
        recentAddressRef.current,
        defaultResidenceAddressRef.current,
      ]);

      dataAbortRef.current?.abort();
      const controller = new AbortController();
      dataAbortRef.current = controller;
      const requestId = ++requestIdRef.current;
      setDataError(null);

      if (category === 'favorites') {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        if (category === 'public-facility') {
          const facilities = await fetchPublicFacilities(
            nextBounds,
            nextCenter.latitude,
            nextCenter.longitude,
            facilityFreeOnly,
            controller.signal,
          );
          if (requestId !== requestIdRef.current) return;
          setPublicFacilities(facilities);
          return;
        }
        if (category === 'public-parking') {
          const lots = await fetchPublicParkingLots(
            nextBounds,
            nextCenter.latitude,
            nextCenter.longitude,
            parkingFreeOnly,
            controller.signal,
          );
          if (requestId !== requestIdRef.current) return;
          setParkingLots(lots);
          return;
        }

        let nextRegion: MapRegion;
        try {
          nextRegion = await findRegion(maps, nextCenter, controller.signal, addressFallback);
        } catch (error) {
          if (category !== 'good-price') throw error;

          // Region lookup only narrows this endpoint. Keep the store list usable
          // when reverse geocoding is temporarily unavailable.
          const stores = await fetchGoodPriceStores('', '', nextBounds, controller.signal);
          if (requestId !== requestIdRef.current) return;
          setRegion(null);
          setGoodPriceStores(stores);
          return;
        }
        if (requestId !== requestIdRef.current) return;
        setRegion(nextRegion);

        if (category === 'good-price') {
          const stores = await fetchGoodPriceStores(
            nextRegion.province,
            nextRegion.district,
            nextBounds,
            controller.signal,
          );
          if (requestId !== requestIdRef.current) return;
          setGoodPriceStores(stores);
        } else {
          if (!nextRegion.lawdCode) {
            throw new Error(`${regionLabel(nextRegion)}의 법정동 코드를 확인하지 못했어요.`);
          }
          const deals = await fetchHousingRentDeals(
            nextRegion.lawdCode,
            regionLabel(nextRegion),
            nextBounds,
            controller.signal,
          );
          if (requestId !== requestIdRef.current) return;
          setHousingDeals(deals);
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        lastViewportRequestKeyRef.current = null;
        setDataError(errorMessage(error));
        if (category === 'good-price') setGoodPriceStores([]);
        if (category === 'public-facility') setPublicFacilities([]);
        if (category === 'public-parking') setParkingLots([]);
        if (category === 'housing') setHousingDeals([]);
      } finally {
        if (requestId === requestIdRef.current) setDataLoading(false);
      }
    },
    [category, facilityFreeOnly, parkingFreeOnly],
  );

  refreshViewportRef.current = refreshViewport;

  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      setSdkLoading(false);
      setSdkError('VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.');
      return;
    }
    if (naverMapAuthenticationFailed) {
      setSdkLoading(false);
      setSdkError(NAVER_AUTH_ERROR);
      return;
    }

    let disposed = false;
    const container = mapContainerRef.current;
    if (!container) return;
    let authenticationFailed = false;
    const previousAuthFailure = window.navermap_authFailure;
    const handleAuthFailure = () => {
      naverMapAuthenticationFailed = true;
      authenticationFailed = true;
      if (disposed) return;
      setMapReady(false);
      setLocationError(null);
      setSdkLoading(false);
      setSdkError(NAVER_AUTH_ERROR);
    };
    window.navermap_authFailure = handleAuthFailure;

    void loadNaverMaps(clientId)
      .then((maps) => {
        if (disposed || authenticationFailed) return;
        container.replaceChildren();
        const map = new maps.Map(container, {
          center: new maps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
          zoom: 7,
        });
        const handleMapClick = () => setSelected(null);
        const handleCameraChange = () => setSelected(null);
        let idleRefreshTimeout: number | null = null;
        const handleIdle = () => {
          if (idleRefreshTimeout !== null) window.clearTimeout(idleRefreshTimeout);
          idleRefreshTimeout = window.setTimeout(() => {
            idleRefreshTimeout = null;
            void refreshViewportRef.current();
          }, 650);
        };
        const handleResize = () => map.autoResize();
        let initialized = false;
        let initializationTimeout = 0;
        const handleTilesLoaded = () => {
          if (disposed || authenticationFailed || initialized) return;
          initialized = true;
          window.clearTimeout(initializationTimeout);
          setSdkError(null);
          setSdkLoading(false);
          setMapReady(true);

          const defaultResidence = defaultResidenceRef.current;
          if (defaultResidence) {
            placeDefaultResidence(defaultResidence);
            void refreshViewportRef.current();
            return;
          }

          setIsLocating(true);
          void requestCurrentPosition()
            .then((position) => {
              if (disposed) return;
              placeCurrentLocation(position);
            })
            .catch((error: unknown) => {
              if (disposed) return;
              setLocationError(locationErrorMessage(error));
              setLocationAccuracy(null);
              void refreshViewportRef.current();
            })
            .finally(() => {
              if (!disposed) setIsLocating(false);
            });
        };

        mapsRef.current = maps;
        mapRef.current = map;
        const mapListeners = [
          maps.Event.addListener(map, 'click', handleMapClick),
          maps.Event.addListener(map, 'center_changed', handleCameraChange),
          maps.Event.addListener(map, 'idle', handleIdle),
          maps.Event.addListener(map, 'tilesloaded', handleTilesLoaded),
        ];
        window.addEventListener('resize', handleResize);
        initializationTimeout = window.setTimeout(() => {
          if (disposed || authenticationFailed || initialized) return;
          setSdkLoading(false);
          setSdkError(
            '네이버 지도를 초기화하지 못했습니다. Web Dynamic Map Client ID와 등록 URL을 확인해 주세요.',
          );
        }, 8_000);

        const cleanup = () => {
          window.clearTimeout(initializationTimeout);
          if (idleRefreshTimeout !== null) window.clearTimeout(idleRefreshTimeout);
          maps.Event.removeListener(mapListeners);
          window.removeEventListener('resize', handleResize);
        };
        cleanupRef.current = cleanup;
      })
      .catch((error: unknown) => {
        if (disposed) return;
        setSdkLoading(false);
        setSdkError(errorMessage(error));
      });

    return () => {
      disposed = true;
      if (window.navermap_authFailure === handleAuthFailure) {
        window.navermap_authFailure = previousAuthFailure;
      }
      cleanupRef.current?.();
      cleanupRef.current = null;
      dataAbortRef.current?.abort();
      directionsAbortRef.current?.abort();
      addressSearchAbortRef.current?.abort();
      clearMapOverlays();
      locationMarkerRef.current?.setMap(null);
      routePolylineRef.current?.setMap(null);
      locationMarkerRef.current = null;
      routePolylineRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [clearMapOverlays, placeCurrentLocation, placeDefaultResidence]);

  useEffect(() => {
    if (!mapReady) return;
    void refreshViewport();
  }, [mapReady, refreshViewport]);

  const visibleGoodPriceStores = useMemo(
    () =>
      goodPriceStores
        .filter(hasCoordinates)
        .filter((store) => inBounds(store, viewportBounds))
        .sort(
          (left, right) =>
            distanceMeters(viewportCenter, left) - distanceMeters(viewportCenter, right),
        ),
    [goodPriceStores, viewportBounds, viewportCenter],
  );

  const filteredGoodPriceStores = useMemo(
    () =>
      visibleGoodPriceStores.filter(
        (store) =>
          goodPriceCategory === 'all' || goodPriceGroup(store.category) === goodPriceCategory,
      ),
    [goodPriceCategory, visibleGoodPriceStores],
  );

  const visibleFavorites = useMemo(
    () =>
      [...favorites.values()]
        .filter((item) => hasCoordinates(item.value))
        .sort(
          (left, right) =>
            distanceMeters(viewportCenter, {
              latitude: left.value.latitude!,
              longitude: left.value.longitude!,
            }) -
            distanceMeters(viewportCenter, {
              latitude: right.value.latitude!,
              longitude: right.value.longitude!,
            }),
        ),
    [favorites, viewportCenter],
  );

  const visiblePublicFacilities = useMemo(
    () =>
      publicFacilities
        .filter(hasCoordinates)
        .filter((facility) => inBounds(facility, viewportBounds))
        .sort(
          (left, right) =>
            distanceMeters(viewportCenter, left) - distanceMeters(viewportCenter, right),
        ),
    [publicFacilities, viewportBounds, viewportCenter],
  );

  const visibleParkingLots = useMemo(
    () =>
      parkingLots
        .filter(hasCoordinates)
        .filter((lot) => inBounds(lot, viewportBounds))
        .sort(
          (left, right) =>
            distanceMeters(viewportCenter, left) - distanceMeters(viewportCenter, right),
        ),
    [parkingLots, viewportBounds, viewportCenter],
  );

  const visibleHousingDeals = useMemo(
    () => housingDeals.filter(hasCoordinates).filter((deal) => inBounds(deal, viewportBounds)),
    [housingDeals, viewportBounds],
  );

  const markerItems = useMemo<SelectedMapItem[]>(() => {
    if (category === 'favorites') {
      return visibleFavorites;
    }
    if (category === 'good-price') {
      return filteredGoodPriceStores.map((value) => ({ kind: 'good-price', value }));
    }
    if (category === 'public-facility') {
      return visiblePublicFacilities.map((value) => ({ kind: 'public-facility', value }));
    }
    if (category === 'public-parking') {
      return visibleParkingLots.map((value) => ({ kind: 'public-parking', value }));
    }
    const uniqueDeals = new Map<string, HousingRentDeal>();
    for (const deal of visibleHousingDeals) {
      uniqueDeals.set(`${deal.propertyType}|${deal.latitude}|${deal.longitude}`, deal);
    }
    return [...uniqueDeals.values()].map((value) => ({ kind: 'housing', value }));
  }, [
    category,
    filteredGoodPriceStores,
    visibleFavorites,
    visibleHousingDeals,
    visibleParkingLots,
    visiblePublicFacilities,
  ]);

  useEffect(() => {
    clearMapOverlays();
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps) return;

    overlaysRef.current = markerItems.map((item) => {
      const { id, label, latitude, longitude, tone, glyph } = markerPresentation(item);
      const goodPriceClass =
        item.kind === 'good-price' ? ' savings-map__sdk-marker--good-price' : '';
      const housingClass = item.kind === 'housing' ? ' savings-map__sdk-marker--housing' : '';
      const parkingClass =
        item.kind === 'public-parking' ? ' savings-map__sdk-marker--parking' : '';
      const selectedClass =
        selected && selected.kind === item.kind && selected.value.id === id
          ? ' savings-map__sdk-marker--selected'
          : '';
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(latitude, longitude),
        icon: {
          content: `<button type="button" class="savings-map__sdk-marker savings-map__sdk-marker--${tone}${goodPriceClass}${housingClass}${parkingClass}${selectedClass}" aria-label="${escapeHtml(label)}"><span>${escapeHtml(glyph)}</span></button>`,
          anchor:
            item.kind === 'good-price'
              ? new maps.Point(17, 38)
              : item.kind === 'housing'
                ? new maps.Point(16, 35)
                : new maps.Point(20, 45),
        },
        zIndex: selected?.value.id === id ? 12 : 5,
      });
      const listener = maps.Event.addListener(marker, 'click', () => setSelected(item));
      return { marker, listener };
    });

    return clearMapOverlays;
  }, [clearMapOverlays, markerItems, selected]);

  useEffect(() => {
    routePolylineRef.current?.setMap(null);
    routePolylineRef.current = null;
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !directionsRoute) return;

    const path = directionsRoute.path.map(
      (point) => new maps.LatLng(point.latitude, point.longitude),
    );
    const polyline = new maps.Polyline({
      map,
      path,
      strokeWeight: 6,
      strokeColor: '#17a67c',
      strokeOpacity: 0.88,
    });
    routePolylineRef.current = polyline;
    const firstPoint = path[0];
    const bounds = new maps.LatLngBounds(firstPoint, firstPoint);
    path.slice(1).forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60, maxZoom: 17 });
    return () => polyline.setMap(null);
  }, [directionsRoute]);

  const changeCategory = (nextCategory: MapCategory) => {
    if (nextCategory === category) {
      void refreshViewport(true);
      return;
    }
    setCategory(nextCategory);
    setGoodPriceCategory('all');
    setSelected(null);
    setDataError(null);
    clearDirections();
    lastViewportRequestKeyRef.current = null;
    window.setTimeout(() => void refreshViewportRef.current(true), 0);
  };

  const toggleFavorite = (item: SelectedMapItem) => {
    const key = favoriteKey(item);
    const removing = favorites.has(key);
    setFavorites((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      saveMapFavorites(next);
      return next;
    });
    if (removing && category === 'favorites') setSelected(null);
  };

  const openDirections = async (item: GoodPriceStore | PublicFacility | PublicParkingLot) => {
    if (item.latitude === null || item.longitude === null) {
      setDataError('이 장소는 위치 정보가 없어 길찾기를 시작할 수 없어요.');
      return;
    }
    directionsAbortRef.current?.abort();
    const controller = new AbortController();
    directionsAbortRef.current = controller;
    setDirectionsLoading(true);
    setDirectionsRoute(null);
    setDirectionsDestination(item.name);
    setDataError(null);
    try {
      const position = await requestCurrentPosition();
      placeCurrentLocation(position);
      const route = await fetchDirections(
        position.coords.latitude,
        position.coords.longitude,
        item.latitude,
        item.longitude,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setDirectionsRoute(route);
      setSelected(null);
    } catch (error) {
      if (!controller.signal.aborted) setDataError(locationErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setDirectionsLoading(false);
    }
  };

  const clearDirections = () => {
    directionsAbortRef.current?.abort();
    setDirectionsLoading(false);
    setDirectionsRoute(null);
    setDirectionsDestination(null);
  };

  const moveToAddressMatch = (address: AddressMatch) => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps) return;
    const coordinate = new maps.LatLng(address.latitude, address.longitude);
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setPosition(coordinate);
      locationMarkerRef.current.setMap(map);
    } else {
      locationMarkerRef.current = new maps.Marker({ map, position: coordinate, zIndex: 20 });
    }
    map.setCenter(coordinate);
    map.setZoom(15, true);
    setLocationError(null);
    setLocationAccuracy(null);
    setAddressSearchResult(address.label);
    setSelectedAddress(address);
    recentAddressRef.current = address;
  };

  const moveToAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = addressQuery.trim();
    if (!query) {
      setAddressSearchError('역 이름, 도로명 또는 주소를 입력해 주세요.');
      setAddressSearchResult(null);
      setAddressMatches([]);
      setSelectedAddress(null);
      return;
    }
    if (!mapRef.current || !mapsRef.current) return;

    setAddressSearchLoading(true);
    setAddressSearchError(null);
    setAddressSearchResult(null);
    setAddressMatches([]);
    setSelectedAddress(null);
    addressSearchAbortRef.current?.abort();
    const controller = new AbortController();
    addressSearchAbortRef.current = controller;
    try {
      const matches = await fetchMapLocationSearch(query, controller.signal);
      if (controller.signal.aborted) return;
      if (matches.length === 0) {
        throw new Error(
          '입력한 위치를 찾지 못했어요. 역 이름, 도로명 또는 시·군·구를 함께 입력해 주세요.',
        );
      }
      const addressResults = matches.map((match) => ({
        latitude: match.latitude,
        longitude: match.longitude,
        address: match.address || match.name,
        label: match.address ? `${match.name} · ${match.address}` : match.name,
      }));
      moveToAddressMatch(addressResults[0]);
      setAddressMatches(addressResults);
    } catch (error) {
      if (!controller.signal.aborted) setAddressSearchError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setAddressSearchLoading(false);
    }
  };

  const saveDefaultResidence = async () => {
    if (!selectedAddress || residenceSaving) return;
    setResidenceSaving(true);
    setAddressSearchError(null);
    try {
      const currentUser = await updateDefaultResidence({
        address: selectedAddress.address,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      });
      updateUser(currentUser);
      setAddressSearchResult(`${selectedAddress.label}을 기본 주거지로 등록했어요.`);
    } catch (error) {
      setAddressSearchError(errorMessage(error));
    } finally {
      setResidenceSaving(false);
    }
  };

  return (
    <div className="page savings-map">
      <div className="page-heading">
        <div>
          <p className="page-heading__eyebrow">Savings map</p>
          <h1>절약 지도</h1>
          <p>내 주변의 합리적인 가격 정보와 공공시설을 지도에서 찾아보세요.</p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void moveToCurrentLocation()}
          disabled={!mapReady || isLocating}
        >
          <LocateFixed size={17} />
          {isLocating ? '위치 확인 중...' : '내 위치로'}
        </button>
      </div>

      <section className="savings-map__controls" aria-label="지도 카테고리와 필터">
        <div className="savings-map__categories">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              className={`chip ${category === option.value ? 'chip--active' : ''}`}
              type="button"
              key={option.value}
              onClick={() => changeCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="savings-map__filter-tools">
          {(category === 'public-facility' || category === 'public-parking') && (
            <label className="savings-map__free-filter">
              <input
                type="checkbox"
                checked={category === 'public-parking' ? parkingFreeOnly : facilityFreeOnly}
                onChange={(event) => {
                  if (category === 'public-parking') setParkingFreeOnly(event.target.checked);
                  else setFacilityFreeOnly(event.target.checked);
                }}
              />
              {category === 'public-parking' ? '무료 주차장만' : '무료 시설만'}
            </label>
          )}
          <button
            className="button button--secondary savings-map__refresh"
            type="button"
            onClick={() => void refreshViewport(true)}
            disabled={!mapReady || dataLoading}
          >
            <RefreshCw size={15} />
            현재 지도 영역 재검색
          </button>
        </div>
      </section>

      <form className="savings-map__address-search" onSubmit={(event) => void moveToAddress(event)}>
        <label htmlFor="savings-map-address">역 이름·도로명·주소로 위치 찾기</label>
        <div>
          <input
            id="savings-map-address"
            type="search"
            value={addressQuery}
            onChange={(event) => setAddressQuery(event.target.value)}
            placeholder="예: 서울역, 중앙대로, 서울특별시 중구 세종대로 110"
            disabled={!mapReady || addressSearchLoading}
          />
          <button
            className="button button--secondary"
            type="submit"
            disabled={!mapReady || addressSearchLoading}
          >
            {addressSearchLoading ? '찾는 중...' : '이동'}
          </button>
        </div>
        {addressSearchError && <p role="alert">{addressSearchError}</p>}
        {addressSearchResult && (
          <p className="savings-map__address-search-result">
            {addressSearchResult} 위치로 이동했어요.
          </p>
        )}
        {selectedAddress && (
          <button
            className="button button--primary savings-map__residence-save"
            type="button"
            disabled={residenceSaving}
            onClick={() => void saveDefaultResidence()}
          >
            {residenceSaving ? '등록 중...' : '기본 주거지로 등록'}
          </button>
        )}
        {addressMatches.length > 1 && (
          <div className="savings-map__address-matches" aria-label="주소 검색 결과">
            {addressMatches.map((match) => (
              <button
                type="button"
                key={`${match.latitude}-${match.longitude}`}
                onClick={() => moveToAddressMatch(match)}
              >
                {match.label}
              </button>
            ))}
          </div>
        )}
      </form>

      {category === 'good-price' && visibleGoodPriceStores.length > 0 && (
        <div className="savings-map__subcategories" aria-label="착한가격업소 업종 필터">
          {GOOD_PRICE_GROUPS.map((group) => {
            const count =
              group.value === 'all'
                ? visibleGoodPriceStores.length
                : visibleGoodPriceStores.filter(
                    (store) => goodPriceGroup(store.category) === group.value,
                  ).length;
            return (
              <button
                type="button"
                className={goodPriceCategory === group.value ? 'is-active' : ''}
                onClick={() => setGoodPriceCategory(group.value)}
                key={group.value}
              >
                {group.label} <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      )}

      <section className="ui-card savings-map__workspace">
        <div className="savings-map__canvas" aria-label="절약 장소 지도">
          <div ref={mapContainerRef} className="savings-map__map" />
          {(sdkLoading || !mapReady) && !sdkError && (
            <MapState message="지도 SDK를 불러오고 있어요." loading />
          )}
          {sdkError && <MapState message={sdkError} />}
          {dataLoading && (
            <div className="savings-map__progress" aria-label="지도 데이터 로딩 중" />
          )}
          {(locationError || isLowAccuracy(locationAccuracy)) && (
            <div className="savings-map__location-warning" role="status">
              <span>
                {locationError
                  ? `${locationError} 기본 위치에서 지도를 이용할 수 있어요.`
                  : `현재 위치 정확도가 약 ${Math.round(locationAccuracy ?? 0)}m예요. 기기의 위치 서비스를 확인해 주세요.`}
              </span>
              <button type="button" onClick={() => void moveToCurrentLocation()}>
                위치 다시 확인
              </button>
            </div>
          )}
          {dataError && (
            <div className="savings-map__action-error" role="alert">
              {dataError}
            </div>
          )}
          <div className="savings-map__zoom">
            <button
              type="button"
              aria-label="지도 확대"
              onClick={() => {
                const map = mapRef.current;
                if (map) map.setZoom(Math.min(21, map.getZoom() + 1), true);
              }}
            >
              +
            </button>
            <button
              type="button"
              aria-label="지도 축소"
              onClick={() => {
                const map = mapRef.current;
                if (map) map.setZoom(Math.max(1, map.getZoom() - 1), true);
              }}
            >
              −
            </button>
          </div>
          <button
            className="savings-map__locate"
            type="button"
            onClick={() => void moveToCurrentLocation()}
            disabled={!mapReady || isLocating}
          >
            <LocateFixed size={17} />
            현재 위치
          </button>
        </div>

        <aside className="savings-map-place" aria-live="polite">
          {directionsLoading || directionsRoute ? (
            <DirectionsPanel
              destination={directionsDestination ?? '목적지'}
              route={directionsRoute}
              loading={directionsLoading}
              onClose={clearDirections}
            />
          ) : selected ? (
            <SelectedItemPanel
              item={selected}
              currentPosition={viewportCenter}
              favorite={favorites.has(favoriteKey(selected))}
              onFavorite={toggleFavorite}
              onDirections={openDirections}
              onClose={() => setSelected(null)}
            />
          ) : (
            <OverviewPanel
              category={category}
              region={region}
              favorites={visibleFavorites}
              goodPriceStores={filteredGoodPriceStores}
              facilities={visiblePublicFacilities}
              parkingLots={visibleParkingLots}
              housingDeals={visibleHousingDeals}
              loading={dataLoading}
              error={dataError}
              onRetry={() => void refreshViewport(true)}
              onSelect={setSelected}
            />
          )}
        </aside>
      </section>

      <section className="savings-map__legend" aria-label="지도 범례">
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--green" />
          착한가격업소
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--teal" />
          공공시설
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--purple" />
          공영주차장
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--orange" />
          단독·다가구
        </span>
        <span>
          <i className="savings-map__legend-dot savings-map__legend-dot--blue" />
          오피스텔
        </span>
        <p>
          {region && (category === 'good-price' || category === 'housing')
            ? `${regionLabel(region)} 기준`
            : '지도를 이동하면 현재 영역을 다시 조회합니다.'}
        </p>
      </section>
    </div>
  );
}

function MapState({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <div className="savings-map__map-state" role="status">
      {loading && <span className="savings-map__spinner" />}
      <strong>{message}</strong>
    </div>
  );
}

interface OverviewPanelProps {
  category: MapCategory;
  region: MapRegion | null;
  favorites: SelectedMapItem[];
  goodPriceStores: GoodPriceStore[];
  facilities: PublicFacility[];
  parkingLots: PublicParkingLot[];
  housingDeals: HousingRentDeal[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (item: SelectedMapItem) => void;
}

function OverviewPanel(props: OverviewPanelProps) {
  const { category, region, loading, error, onRetry, onSelect } = props;
  const itemCount =
    category === 'favorites'
      ? props.favorites.length
      : category === 'good-price'
        ? props.goodPriceStores.length
        : category === 'public-facility'
          ? props.facilities.length
          : category === 'public-parking'
            ? props.parkingLots.length
            : props.housingDeals.length;
  const title = CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? '지도';

  return (
    <div className="savings-map-overview">
      <div className="savings-map-overview__heading">
        <div>
          <span className="status-badge">{title}</span>
          <h2>{category === 'favorites' ? '찜한 장소' : '현재 지도 화면'}</h2>
        </div>
        <strong>
          {itemCount}
          {category === 'housing' ? '건' : '곳'}
        </strong>
      </div>
      <p className="savings-map-overview__region">
        {category === 'favorites'
          ? '네 가지 지도 카테고리에서 찜한 장소를 모아 보여드려요.'
          : category === 'public-facility'
            ? '현재 지도 영역의 시설을 거리순으로 보여드려요.'
            : category === 'public-parking'
              ? '현재 지도 영역의 공영주차장을 거리순으로 보여드려요.'
              : region
                ? regionLabel(region)
                : '현재 지도 화면의 지역을 확인하고 있어요.'}
      </p>
      {loading && itemCount === 0 ? (
        <MapState message="지도 데이터를 준비하고 있어요." loading />
      ) : error && itemCount === 0 ? (
        <div className="savings-map-overview__empty" role="alert">
          <strong>{error}</strong>
          <button className="button button--secondary" type="button" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      ) : itemCount === 0 ? (
        <div className="savings-map-overview__empty">
          <MapPin size={28} />
          <strong>{emptyMessage(category)}</strong>
          <span>
            {category === 'favorites'
              ? '각 카테고리의 마커를 눌러 찜할 수 있어요.'
              : '지도를 이동하거나 범위를 넓혀 보세요.'}
          </span>
        </div>
      ) : category === 'favorites' ? (
        <div className="savings-map-overview__list">
          {props.favorites.map((item) => (
            <button type="button" onClick={() => onSelect(item)} key={favoriteKey(item)}>
              {itemIcon(item)}
              <span>
                <strong>{itemTitle(item)}</strong>
                <small>{itemSubtitle(item)}</small>
              </span>
            </button>
          ))}
        </div>
      ) : category === 'public-facility' ? (
        <div className="savings-map-overview__list">
          {props.facilities.map((facility) => (
            <button
              type="button"
              onClick={() => onSelect({ kind: 'public-facility', value: facility })}
              key={facility.id}
            >
              <Building size={17} />
              <span>
                <strong>{facility.name}</strong>
                <small>
                  {facility.category} · {distanceLabel(facility.distanceMeters)}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : category === 'public-parking' ? (
        <div className="savings-map-overview__list">
          {props.parkingLots.map((lot) => (
            <button
              type="button"
              onClick={() => onSelect({ kind: 'public-parking', value: lot })}
              key={lot.id}
            >
              <Car size={17} />
              <span>
                <strong>{lot.name}</strong>
                <small>
                  {parkingFeeLabel(lot)} · {distanceLabel(lot.distanceMeters)}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : category === 'housing' ? (
        <div className="savings-map-overview__counts">
          <CountCard
            icon={<Home size={20} />}
            label="단독/다가구"
            count={props.housingDeals.filter((deal) => deal.propertyType === '단독/다가구').length}
          />
          <CountCard
            icon={<Building size={20} />}
            label="오피스텔"
            count={props.housingDeals.filter((deal) => deal.propertyType === '오피스텔').length}
          />
          <CountCard
            icon={<Banknote size={20} />}
            label="전세"
            count={props.housingDeals.filter((deal) => deal.dealType === '전세').length}
          />
          <CountCard
            icon={<Users size={20} />}
            label="월세"
            count={props.housingDeals.filter((deal) => deal.dealType === '월세').length}
          />
          <p>마커를 누르면 거래 상세 정보를 확인할 수 있어요.</p>
        </div>
      ) : (
        <div className="savings-map-overview__list">
          {props.goodPriceStores.map((store) => (
            <button
              type="button"
              onClick={() => onSelect({ kind: 'good-price', value: store })}
              key={store.id}
            >
              <Store size={17} />
              <span>
                <strong>{store.name}</strong>
                <small>
                  {store.category} · {store.address || '주소 정보 없음'}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CountCard({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div>
      {icon}
      <span>{label}</span>
      <strong>{count}건</strong>
    </div>
  );
}

interface SelectedItemPanelProps {
  item: SelectedMapItem;
  currentPosition: Coordinates;
  favorite: boolean;
  onFavorite: (item: SelectedMapItem) => void;
  onDirections: (item: GoodPriceStore | PublicFacility | PublicParkingLot) => Promise<void>;
  onClose: () => void;
}

function SelectedItemPanel(props: SelectedItemPanelProps) {
  const { item, onClose } = props;
  if (item.kind === 'good-price') {
    const store = item.value;
    return (
      <DetailShell
        title={store.name}
        badge={store.category || '착한가격업소'}
        icon={<Store size={34} />}
        onClose={onClose}
      >
        <div className="savings-map-place__heading">
          <strong>
            {hasCoordinates(store)
              ? distanceLabel(distanceMeters(props.currentPosition, store))
              : '거리 정보 없음'}
          </strong>
        </div>
        <DetailRow
          icon={<MapPin size={15} />}
          label="주소"
          value={store.address || '등록된 주소가 없어요.'}
        />
        <DetailRow
          icon={<Clock3 size={15} />}
          label="전화"
          value={store.phone || '등록된 전화번호가 없어요.'}
        />
        <h3>메뉴와 가격</h3>
        {store.menus.length > 0 ? (
          <div className="savings-map-place__menu-list">
            {store.menus.map((menu, index) => (
              <div key={`${menu.name}-${index}`}>
                <span>{menu.name || '메뉴'}</span>
                <strong>{menu.price || '가격 정보 없음'}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="savings-map-place__muted">등록된 메뉴 정보가 없어요.</p>
        )}
        <div className="savings-map-place__actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => props.onFavorite(item)}
          >
            {props.favorite ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {props.favorite ? '저장됨' : '저장'}
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void props.onDirections(store)}
          >
            <Navigation size={15} />
            도보 길찾기
          </button>
        </div>
      </DetailShell>
    );
  }

  if (item.kind === 'public-facility') {
    const facility = item.value;
    const hours = [
      facility.weekdayHours && `평일 ${facility.weekdayHours}`,
      facility.weekendHours && `주말 ${facility.weekendHours}`,
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <DetailShell
        title={facility.name}
        badge={facility.category || '공공시설'}
        icon={<Building size={34} />}
        onClose={onClose}
      >
        <div className="savings-map-place__tags">
          <span>{feeLabel(facility)}</span>
          <span>{distanceLabel(facility.distanceMeters)}</span>
        </div>
        <DetailRow
          icon={<MapPin size={15} />}
          label="주소"
          value={facility.address || '주소 정보 없음'}
        />
        <DetailRow
          icon={<Clock3 size={15} />}
          label="운영시간"
          value={hours || '운영시간 정보 없음'}
        />
        {facility.closedDays && (
          <DetailRow icon={<Clock3 size={15} />} label="휴관일" value={facility.closedDays} />
        )}
        {facility.capacity && (
          <DetailRow icon={<Users size={15} />} label="수용인원" value={`${facility.capacity}명`} />
        )}
        {facility.area && (
          <DetailRow icon={<Building size={15} />} label="면적" value={`${facility.area}㎡`} />
        )}
        {facility.amenities && (
          <DetailRow icon={<Building size={15} />} label="부대시설" value={facility.amenities} />
        )}
        {facility.applicationMethod && (
          <DetailRow
            icon={<Users size={15} />}
            label="신청방법"
            value={facility.applicationMethod}
          />
        )}
        {facility.institution && (
          <DetailRow icon={<Building size={15} />} label="관리기관" value={facility.institution} />
        )}
        {facility.phone && (
          <DetailRow icon={<Clock3 size={15} />} label="전화" value={facility.phone} />
        )}
        <div className="savings-map-place__actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => props.onFavorite(item)}
          >
            {props.favorite ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {props.favorite ? '찜 해제' : '찜하기'}
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void props.onDirections(facility)}
          >
            <Navigation size={15} />
            도보 길찾기
          </button>
        </div>
      </DetailShell>
    );
  }

  if (item.kind === 'public-parking') {
    const lot = item.value;
    const hours = [
      lot.weekdayHours && `평일 ${lot.weekdayHours}`,
      lot.saturdayHours && `토요일 ${lot.saturdayHours}`,
      lot.holidayHours && `공휴일 ${lot.holidayHours}`,
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <DetailShell
        title={lot.name}
        badge={`공영 · ${lot.parkingType || '주차장'}`}
        icon={<Car size={34} />}
        onClose={onClose}
      >
        <div className="savings-map-place__tags">
          <span>{parkingFeeLabel(lot)}</span>
          <span>{distanceLabel(lot.distanceMeters)}</span>
          {lot.capacity !== null && <span>{lot.capacity}면</span>}
        </div>
        <DetailRow
          icon={<MapPin size={15} />}
          label="주소"
          value={lot.address || '주소 정보 없음'}
        />
        <DetailRow
          icon={<Clock3 size={15} />}
          label="운영시간"
          value={hours || '운영시간 정보 없음'}
        />
        {lot.operationDays && (
          <DetailRow icon={<Clock3 size={15} />} label="운영일" value={lot.operationDays} />
        )}
        {lot.additionalFee !== null && lot.additionalMinutes !== null && (
          <DetailRow
            icon={<Banknote size={15} />}
            label="추가요금"
            value={`${lot.additionalMinutes}분당 ${lot.additionalFee.toLocaleString('ko-KR')}원`}
          />
        )}
        {lot.dailyFee !== null && (
          <DetailRow
            icon={<Banknote size={15} />}
            label="일 주차"
            value={`${lot.dailyFee.toLocaleString('ko-KR')}원`}
          />
        )}
        {lot.paymentMethods && (
          <DetailRow icon={<Banknote size={15} />} label="결제방법" value={lot.paymentMethods} />
        )}
        {lot.phone && <DetailRow icon={<Clock3 size={15} />} label="전화" value={lot.phone} />}
        {lot.notes && <p className="savings-map-place__notice">{lot.notes}</p>}
        <div className="savings-map-place__actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => props.onFavorite(item)}
          >
            {props.favorite ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {props.favorite ? '찜 해제' : '찜하기'}
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void props.onDirections(lot)}
          >
            <Navigation size={15} />
            자동차 길찾기
          </button>
        </div>
      </DetailShell>
    );
  }

  const deal = item.value;
  return (
    <DetailShell
      title={deal.propertyName || deal.neighborhood}
      badge={`${deal.propertyType} · ${deal.dealType}`}
      icon={<Home size={34} />}
      onClose={onClose}
    >
      <p className="savings-map-place__price">{housingPriceLabel(deal)}</p>
      <DetailRow
        icon={<Clock3 size={15} />}
        label="계약일"
        value={deal.contractDate || '정보 없음'}
      />
      <DetailRow
        icon={<Building size={15} />}
        label="면적"
        value={`${deal.areaSquareMeters.toFixed(1)}㎡`}
      />
      {deal.floor !== null && (
        <DetailRow icon={<Building size={15} />} label="층" value={`${deal.floor}층`} />
      )}
      {deal.buildYear !== null && (
        <DetailRow icon={<Building size={15} />} label="준공" value={`${deal.buildYear}년`} />
      )}
      {deal.contractType && (
        <DetailRow icon={<Clock3 size={15} />} label="계약구분" value={deal.contractType} />
      )}
      {deal.contractTerm && (
        <DetailRow icon={<Clock3 size={15} />} label="계약기간" value={deal.contractTerm} />
      )}
      <DetailRow
        icon={<MapPin size={15} />}
        label="주소"
        value={deal.address || [deal.neighborhood, deal.lotNumber].filter(Boolean).join(' ')}
      />
      {deal.locationAccuracy === '동 단위' && (
        <p className="savings-map-place__notice">
          개인정보 보호로 지번이 제공되지 않아 동 중심의 대략적인 위치를 표시해요.
        </p>
      )}
      <p className="savings-map-place__source">출처: 국토교통부 전월세 실거래가 자료</p>
      <div className="savings-map-place__actions savings-map-place__actions--single">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => props.onFavorite(item)}
        >
          {props.favorite ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          {props.favorite ? '찜 해제' : '찜하기'}
        </button>
      </div>
    </DetailShell>
  );
}

function DetailShell({
  title,
  badge,
  icon,
  onClose,
  children,
}: {
  title: string;
  badge: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="savings-map-place__content">
      <div className="savings-map-place__detail-header">
        <div className="savings-map-place__detail-icon">{icon}</div>
        <div>
          <span className="status-badge">{badge}</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="선택 해제" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="savings-map-place__detail-row">
      <dt>
        {icon}
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function DirectionsPanel({
  destination,
  route,
  loading,
  onClose,
}: {
  destination: string;
  route: DirectionsRoute | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="savings-map-directions">
      <div className="savings-map-directions__heading">
        <Navigation size={28} />
        <div>
          <span className="status-badge">도보 추천 경로</span>
          <h2>{destination}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="경로 닫기" onClick={onClose}>
          ×
        </button>
      </div>
      {loading ? (
        <MapState message="도보 경로를 찾고 있어요." loading />
      ) : (
        route && (
          <>
            <strong>{distanceLabel(route.distanceMeters)}</strong>
            <span>약 {Math.ceil(route.durationMillis / 60_000)}분</span>
            <p>지도에서 추천 경로를 확인하세요.</p>
          </>
        )
      )}
    </div>
  );
}

function requestCurrentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation)
    return Promise.reject(new Error('이 브라우저는 현재 위치 조회를 지원하지 않아요.'));
  return new Promise((resolve, reject) => {
    let bestPosition: GeolocationPosition | null = null;
    let lastError: GeolocationPositionError | null = null;
    let completed = false;
    let watchId: number | null = null;

    const finish = (callback: () => void) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      callback();
    };

    const timeoutId = window.setTimeout(() => {
      const finalPosition = bestPosition;
      if (finalPosition) {
        finish(() => resolve(finalPosition));
        return;
      }
      finish(() => reject(lastError ?? new Error('현재 위치를 확인하지 못했어요.')));
    }, 20_000);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }
        if (position.coords.accuracy <= 100) finish(() => resolve(position));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish(() => reject(error));
          return;
        }
        lastError = error;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      },
    );
  });
}

function isLowAccuracy(accuracy: number | null) {
  return accuracy !== null && Number.isFinite(accuracy) && accuracy > 500;
}

async function findRegion(
  maps: NaverMaps,
  center: Coordinates,
  signal: AbortSignal,
  addressFallback: string | null,
): Promise<MapRegion> {
  try {
    return await fetchMapRegion(center.latitude, center.longitude, signal);
  } catch (apiError) {
    if (signal.aborted) throw apiError;
    try {
      return await findRegionWithNaverMaps(maps, center);
    } catch (reverseGeocodeError) {
      if (signal.aborted || !addressFallback) throw reverseGeocodeError;
      return fetchMapRegion(center.latitude, center.longitude, signal, addressFallback);
    }
  }
}

function closestAddressInViewport(
  center: Coordinates,
  bounds: MapBounds,
  candidates: (AddressMatch | null)[],
): string | null {
  const closest = candidates
    .filter((candidate): candidate is AddressMatch => candidate !== null)
    .filter((candidate) => candidate.address.trim() !== '' && inBounds(candidate, bounds))
    .sort((left, right) => distanceMeters(center, left) - distanceMeters(center, right))[0];
  return closest?.address.trim() || null;
}

function findRegionWithNaverMaps(maps: NaverMaps, center: Coordinates): Promise<MapRegion> {
  return new Promise((resolve, reject) => {
    try {
      maps.Service.reverseGeocode(
        {
          coords: new maps.LatLng(center.latitude, center.longitude),
          orders: 'legalcode,admcode',
        },
        (status, response) => {
          const results = response?.v2?.results ?? [];
          if (status !== maps.Service.Status.OK || results.length === 0) {
            reject(new Error('현재 지도 화면의 지역을 확인하지 못했어요.'));
            return;
          }
          const region = results.find((result) => result.name === 'legalcode') ?? results[0];
          if (!region) {
            reject(new Error('현재 지도 화면의 지역을 확인하지 못했어요.'));
            return;
          }
          resolve({
            province: region.region.area1.name,
            district: region.region.area2.name,
            lawdCode: /^\d{5}/.exec(region.code.id)?.[0] ?? null,
          });
        },
      );
    } catch (error) {
      reject(error);
    }
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === '"') return '&quot;';
    return '&#39;';
  });
}

function markerPresentation(item: SelectedMapItem) {
  if (item.kind === 'good-price') {
    const value = item.value;
    if (!hasCoordinates(value)) throw new Error('좌표가 없는 마커입니다.');
    return {
      id: value.id,
      label: `${value.name}, ${value.category}`,
      latitude: value.latitude,
      longitude: value.longitude,
      tone: goodPriceTone(value.category),
      glyph: goodPriceGlyph(value.category),
    };
  }
  if (item.kind === 'public-facility') {
    const value = item.value;
    if (!hasCoordinates(value)) throw new Error('좌표가 없는 마커입니다.');
    return {
      id: value.id,
      label: `${value.name}, ${value.category}`,
      latitude: value.latitude,
      longitude: value.longitude,
      tone: 'teal',
      glyph: '공',
    };
  }
  if (item.kind === 'public-parking') {
    const value = item.value;
    if (!hasCoordinates(value)) throw new Error('좌표가 없는 마커입니다.');
    return {
      id: value.id,
      label: `${value.name}, ${parkingFeeLabel(value)}`,
      latitude: value.latitude,
      longitude: value.longitude,
      tone: 'purple',
      glyph: 'P',
    };
  }
  const value = item.value;
  if (!hasCoordinates(value)) throw new Error('좌표가 없는 마커입니다.');
  return {
    id: value.id,
    label: `${value.propertyName}, ${value.dealType}`,
    latitude: value.latitude,
    longitude: value.longitude,
    tone: value.propertyType === '오피스텔' ? 'blue' : 'orange',
    glyph: value.propertyType === '오피스텔' ? '🏢' : '🏠',
  };
}

function goodPriceTone(category: string) {
  return `good-price-${goodPriceGroup(category)}`;
}

function goodPriceGlyph(category: string) {
  const normalized = category.trim();
  if (normalized === '\uD55C\uC2DD') return '\u{1F35A}';
  if (normalized === '\uC911\uC2DD') return '\u{1F35C}';
  if (normalized === '\uC77C\uC2DD') return '\u{1F41F}';
  if (normalized === '\uC591\uC2DD') return '\u{1F37D}';
  if (normalized.includes('\uC678\uC2DD')) return '\u2615';
  if (normalized.includes('\uBBF8\uC6A9')) return '\u2702';
  if (normalized.includes('\uC774\uC6A9')) return '\u{1F9D4}';
  if (normalized.includes('\uC138\uD0C1')) return '\u{1F9FA}';
  if (normalized.includes('\uC219\uBC15')) return '\u{1F3E8}';
  if (normalized.includes('\uBAA9\uC695')) return '\u{1F6C1}';
  return '\u{1F3EA}';
}

function goodPriceGroup(category: string) {
  const normalized = category.trim();
  if (normalized.includes('비요식')) return 'other';
  if (
    ['한식', '중식', '일식', '양식', '기타요식업'].includes(normalized) ||
    normalized.includes('음식') ||
    normalized.includes('요식')
  )
    return 'food';
  if (normalized.includes('미용')) return 'beauty';
  if (normalized.includes('이용')) return 'barber';
  if (normalized.includes('세탁')) return 'laundry';
  if (normalized.includes('숙박')) return 'lodging';
  if (normalized.includes('목욕')) return 'bath';
  return 'other';
}

function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  value: T,
): value is T & { latitude: number; longitude: number } {
  return (
    value.latitude !== null &&
    value.longitude !== null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude)
  );
}

function inBounds(value: { latitude: number; longitude: number }, bounds: MapBounds | null) {
  return (
    !bounds ||
    (value.latitude >= bounds.southWestLat &&
      value.latitude <= bounds.northEastLat &&
      value.longitude >= bounds.southWestLng &&
      value.longitude <= bounds.northEastLng)
  );
}

function distanceMeters(from: Coordinates, to: { latitude: number; longitude: number }) {
  const radius = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function distanceLabel(meters: number | null) {
  if (meters === null || !Number.isFinite(meters)) return '거리 정보 없음';
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

function feeLabel(facility: PublicFacility) {
  const value = facility.fee.trim();
  if (facility.paid === false || value === '0') return '무료';
  if (!value) return '요금 정보 없음';
  return value.includes('원') || !/\d/.test(value) ? value : `${value}원`;
}

function parkingFeeLabel(lot: PublicParkingLot) {
  if (lot.free) return '무료';
  if (
    lot.basicMinutes === null ||
    lot.basicMinutes <= 0 ||
    lot.basicFee === null ||
    lot.basicFee < 0
  ) {
    return '요금 정보 없음';
  }
  return `${lot.basicMinutes}분 ${lot.basicFee.toLocaleString('ko-KR')}원`;
}

function itemTitle(item: SelectedMapItem) {
  if (item.kind === 'good-price') return item.value.name;
  if (item.kind === 'public-facility') return item.value.name;
  if (item.kind === 'public-parking') return item.value.name;
  return item.value.propertyName || item.value.neighborhood;
}

function itemSubtitle(item: SelectedMapItem) {
  if (item.kind === 'good-price') return `${item.value.category} · ${item.value.address}`;
  if (item.kind === 'public-facility') {
    return `${item.value.category} · ${feeLabel(item.value)}`;
  }
  if (item.kind === 'public-parking') {
    return `공영주차장 · ${parkingFeeLabel(item.value)}`;
  }
  return `${item.value.propertyType} · ${housingPriceLabel(item.value)}`;
}

function itemIcon(item: SelectedMapItem) {
  if (item.kind === 'good-price') return <Store size={17} />;
  if (item.kind === 'public-facility') return <Building size={17} />;
  if (item.kind === 'public-parking') return <Car size={17} />;
  return <Home size={17} />;
}

function housingPriceLabel(deal: HousingRentDeal) {
  const deposit = `${deal.depositTenThousandWon.toLocaleString('ko-KR')}만원`;
  return deal.dealType === '월세'
    ? `보증금 ${deposit} / 월 ${deal.monthlyRentTenThousandWon.toLocaleString('ko-KR')}만원`
    : `보증금 ${deposit}`;
}

function regionLabel(region: MapRegion) {
  return [region.province, region.district].filter(Boolean).join(' ');
}

function emptyMessage(category: MapCategory) {
  if (category === 'favorites') return '아직 찜한 장소가 없어요.';
  if (category === 'good-price') return '현재 지도 화면에 확인된 업소가 없어요.';
  if (category === 'public-facility') return '현재 지도 화면에 확인된 공공시설이 없어요.';
  if (category === 'public-parking') return '현재 지도 화면에 확인된 공영주차장이 없어요.';
  return '현재 지도 화면에 표시할 최근 거래가 없어요.';
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
}

function locationErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = Number((error as { code: unknown }).code);
    if (code === 1) return '위치 권한이 거부되었어요.';
    if (code === 3) return '현재 위치 조회 시간이 초과되었어요.';
    return '현재 위치를 확인하지 못했어요.';
  }
  return errorMessage(error);
}

export default SavingsMapPage;
