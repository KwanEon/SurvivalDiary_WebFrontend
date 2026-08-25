import { apiRequest } from '../auth/api';
import type {
  DirectionsRoute,
  GoodPriceStore,
  HousingRentDeal,
  MapBounds,
  MapRegion,
  PageResponse,
  PublicFacility,
  PublicParkingLot,
} from './types';

export interface MapLocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const stringValue = (value: unknown) => (value == null ? '' : String(value).trim());

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const booleanValue = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const objectValue = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

async function mapRequest<T>(path: string, signal: AbortSignal, timeoutMs: number): Promise<T> {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);
  const abortFromCaller = () => timeoutController.abort();
  signal.addEventListener('abort', abortFromCaller, { once: true });
  try {
    return await apiRequest<T>(path, { signal: timeoutController.signal });
  } catch (error) {
    if (timeoutController.signal.aborted && !signal.aborted) {
      throw new Error('서버 응답이 늦어지고 있어요. 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal.removeEventListener('abort', abortFromCaller);
  }
}

export async function fetchGoodPriceStores(
  province: string,
  district: string,
  bounds: MapBounds,
  signal: AbortSignal,
): Promise<GoodPriceStore[]> {
  const query = new URLSearchParams({
    page: '0',
    size: '100',
    province,
    district,
    sort: 'name',
    southWestLat: String(bounds.southWestLat),
    southWestLng: String(bounds.southWestLng),
    northEastLat: String(bounds.northEastLat),
    northEastLng: String(bounds.northEastLng),
  });
  const page = await mapRequest<PageResponse<unknown>>(
    `/map/good-price-stores?${query}`,
    signal,
    60_000,
  );
  return page.content.map((raw) => {
    const item = objectValue(raw);
    const menus = Array.from({ length: 4 }, (_, menuIndex) => ({
      name: stringValue(item[`menu${menuIndex + 1}`]),
      price: stringValue(item[`price${menuIndex + 1}`]),
    })).filter((menu) => menu.name !== '' || menu.price !== '');
    const itemProvince = stringValue(item.province);
    const itemDistrict = stringValue(item.district);
    const name = stringValue(item.name);
    const address = stringValue(item.address);
    return {
      id: `${itemProvince}|${itemDistrict}|${name}|${address}`,
      province: itemProvince,
      district: itemDistrict,
      category: stringValue(item.category),
      name,
      phone: stringValue(item.phone),
      address,
      menus,
      latitude: validLatitude(item.latitude),
      longitude: validLongitude(item.longitude),
    };
  });
}

export async function fetchMapRegion(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
  address?: string | null,
): Promise<MapRegion> {
  const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  if (address?.trim()) query.set('address', address.trim());
  const response = objectValue(await mapRequest<unknown>(`/map/region?${query}`, signal, 8_000));
  const province = stringValue(response.province);
  const district = stringValue(response.district);
  if (!province || !district) throw new Error('현재 지도 영역의 지역을 확인하지 못했어요.');
  return { province, district, lawdCode: stringValue(response.lawdCode) || null };
}

export async function fetchPublicFacilities(
  bounds: MapBounds,
  latitude: number,
  longitude: number,
  freeOnly: boolean,
  signal: AbortSignal,
): Promise<PublicFacility[]> {
  const query = new URLSearchParams({
    page: '0',
    size: '100',
    southWestLat: String(bounds.southWestLat),
    southWestLng: String(bounds.southWestLng),
    northEastLat: String(bounds.northEastLat),
    northEastLng: String(bounds.northEastLng),
    latitude: String(latitude),
    longitude: String(longitude),
    freeOnly: String(freeOnly),
    sort: freeOnly ? 'free' : 'distance',
  });
  const page = await mapRequest<PageResponse<unknown>>(
    `/map/public-facilities?${query}`,
    signal,
    60_000,
  );
  return page.content.map((raw) => {
    const item = objectValue(raw);
    const name = stringValue(item.name);
    return {
      id: stringValue(item.id) || `${name}|${stringValue(item.address)}`,
      name,
      locationName: stringValue(item.locationName),
      category: stringValue(item.category),
      address: stringValue(item.address),
      phone: stringValue(item.phone),
      latitude: validLatitude(item.latitude),
      longitude: validLongitude(item.longitude),
      distanceMeters: integerValue(item.distanceMeters),
      paid: booleanValue(item.paid),
      fee: stringValue(item.fee),
      weekdayHours: stringValue(item.weekdayHours),
      weekendHours: stringValue(item.weekendHours),
      closedDays: stringValue(item.closedDays),
      institution: stringValue(item.institution),
      department: stringValue(item.department),
      homepageUrl: stringValue(item.homepageUrl),
      imageUrl: stringValue(item.imageUrl),
      capacity: stringValue(item.capacity),
      area: stringValue(item.area),
      amenities: stringValue(item.amenities),
      applicationMethod: stringValue(item.applicationMethod),
      referenceDate: stringValue(item.referenceDate),
    };
  });
}

export async function fetchPublicParkingLots(
  bounds: MapBounds,
  latitude: number,
  longitude: number,
  freeOnly: boolean,
  signal: AbortSignal,
): Promise<PublicParkingLot[]> {
  const query = new URLSearchParams({
    page: '0',
    size: '100',
    southWestLat: String(bounds.southWestLat),
    southWestLng: String(bounds.southWestLng),
    northEastLat: String(bounds.northEastLat),
    northEastLng: String(bounds.northEastLng),
    latitude: String(latitude),
    longitude: String(longitude),
    freeOnly: String(freeOnly),
    sort: 'distance',
  });
  const page = await mapRequest<PageResponse<unknown>>(
    `/map/public-parking?${query}`,
    signal,
    60_000,
  );
  return page.content.map((raw) => {
    const item = objectValue(raw);
    const name = stringValue(item.name);
    return {
      id: stringValue(item.id) || `${name}|${stringValue(item.address)}`,
      name,
      parkingType: stringValue(item.parkingType),
      address: stringValue(item.address),
      phone: stringValue(item.phone),
      latitude: validLatitude(item.latitude),
      longitude: validLongitude(item.longitude),
      distanceMeters: integerValue(item.distanceMeters),
      free: booleanValue(item.free) ?? false,
      capacity: integerValue(item.capacity),
      operationDays: stringValue(item.operationDays),
      weekdayHours: stringValue(item.weekdayHours),
      saturdayHours: stringValue(item.saturdayHours),
      holidayHours: stringValue(item.holidayHours),
      basicMinutes: integerValue(item.basicMinutes),
      basicFee: integerValue(item.basicFee),
      additionalMinutes: integerValue(item.additionalMinutes),
      additionalFee: integerValue(item.additionalFee),
      dailyFee: integerValue(item.dailyFee),
      monthlyFee: integerValue(item.monthlyFee),
      paymentMethods: stringValue(item.paymentMethods),
      notes: stringValue(item.notes),
      institution: stringValue(item.institution),
      accessibleParking: booleanValue(item.accessibleParking) ?? false,
      referenceDate: stringValue(item.referenceDate),
    };
  });
}

export async function fetchHousingRentDeals(
  lawdCode: string,
  region: string,
  bounds: MapBounds,
  signal: AbortSignal,
): Promise<HousingRentDeal[]> {
  const today = new Date();
  const dealYmd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const query = new URLSearchParams({
    lawdCd: lawdCode,
    dealYmd,
    months: '3',
    neighborhood: '',
    region,
    limit: '100',
    southWestLat: String(bounds.southWestLat),
    southWestLng: String(bounds.southWestLng),
    northEastLat: String(bounds.northEastLat),
    northEastLng: String(bounds.northEastLng),
  });
  const response = await mapRequest<unknown[]>(`/map/housing-rent-deals?${query}`, signal, 60_000);
  return response.map((raw) => {
    const item = objectValue(raw);
    return {
      id:
        stringValue(item.id) ||
        `${stringValue(item.propertyName)}|${stringValue(item.contractDate)}|${stringValue(item.neighborhood)}|${stringValue(item.lotNumber)}|${stringValue(item.floor)}`,
      propertyType: stringValue(item.propertyType),
      propertyName: stringValue(item.propertyName),
      dealType: stringValue(item.dealType),
      depositTenThousandWon: integerValue(item.depositTenThousandWon) ?? 0,
      monthlyRentTenThousandWon: integerValue(item.monthlyRentTenThousandWon) ?? 0,
      contractDate: stringValue(item.contractDate),
      areaSquareMeters: numberValue(item.areaSquareMeters) ?? 0,
      floor: integerValue(item.floor),
      neighborhood: stringValue(item.neighborhood),
      lotNumber: stringValue(item.lotNumber),
      buildYear: integerValue(item.buildYear),
      contractTerm: stringValue(item.contractTerm),
      contractType: stringValue(item.contractType),
      previousDepositTenThousandWon: integerValue(item.previousDepositTenThousandWon),
      previousMonthlyRentTenThousandWon: integerValue(item.previousMonthlyRentTenThousandWon),
      renewalRequestRightUsed: stringValue(item.renewalRequestRightUsed),
      address: stringValue(item.address),
      latitude: validLatitude(item.latitude),
      longitude: validLongitude(item.longitude),
      locationAccuracy: stringValue(item.locationAccuracy),
    };
  });
}

export async function fetchDirections(
  startLatitude: number,
  startLongitude: number,
  goalLatitude: number,
  goalLongitude: number,
  signal: AbortSignal,
): Promise<DirectionsRoute> {
  const query = new URLSearchParams({
    startLatitude: String(startLatitude),
    startLongitude: String(startLongitude),
    goalLatitude: String(goalLatitude),
    goalLongitude: String(goalLongitude),
  });
  const raw = await mapRequest<unknown>(`/map/directions?${query}`, signal, 15_000);
  const item = objectValue(raw);
  const path = Array.isArray(item.path)
    ? item.path
        .map((point) => objectValue(point))
        .map((point) => ({
          latitude: validLatitude(point.latitude),
          longitude: validLongitude(point.longitude),
        }))
        .filter(
          (point): point is { latitude: number; longitude: number } =>
            point.latitude !== null && point.longitude !== null,
        )
    : [];
  if (path.length < 2) throw new Error('서버의 길찾기 응답 형식을 확인하지 못했어요.');
  return {
    distanceMeters: integerValue(item.distanceMeters) ?? 0,
    durationMillis: integerValue(item.durationMillis) ?? 0,
    path,
  };
}

export async function fetchMapLocationSearch(
  queryValue: string,
  signal: AbortSignal,
): Promise<MapLocationSearchResult[]> {
  const query = new URLSearchParams({ query: queryValue });
  const response = await mapRequest<unknown[]>(`/map/location-search?${query}`, signal, 8_000);
  return response
    .map((raw) => objectValue(raw))
    .map((item) => ({
      name: stringValue(item.name),
      address: stringValue(item.address),
      latitude: validLatitude(item.latitude),
      longitude: validLongitude(item.longitude),
    }))
    .filter(
      (item): item is MapLocationSearchResult & { latitude: number; longitude: number } =>
        item.latitude !== null && item.longitude !== null,
    );
}

function integerValue(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function validLatitude(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed !== null && parsed >= -90 && parsed <= 90 ? parsed : null;
}

function validLongitude(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed !== null && parsed >= -180 && parsed <= 180 ? parsed : null;
}
