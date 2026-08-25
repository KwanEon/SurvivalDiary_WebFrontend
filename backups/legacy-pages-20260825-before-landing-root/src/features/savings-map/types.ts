export type MapCategory =
  'favorites' | 'good-price' | 'public-facility' | 'public-parking' | 'housing';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  southWestLat: number;
  southWestLng: number;
  northEastLat: number;
  northEastLng: number;
}

export interface MapRegion {
  province: string;
  district: string;
  lawdCode: string | null;
}

export interface GoodPriceMenu {
  name: string;
  price: string;
}

export interface GoodPriceStore {
  id: string;
  province: string;
  district: string;
  category: string;
  name: string;
  phone: string;
  address: string;
  menus: GoodPriceMenu[];
  latitude: number | null;
  longitude: number | null;
}

export interface PublicFacility {
  id: string;
  name: string;
  locationName: string;
  category: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  paid: boolean | null;
  fee: string;
  weekdayHours: string;
  weekendHours: string;
  closedDays: string;
  institution: string;
  department: string;
  homepageUrl: string;
  imageUrl: string;
  capacity: string;
  area: string;
  amenities: string;
  applicationMethod: string;
  referenceDate: string;
}

export interface PublicParkingLot {
  id: string;
  name: string;
  parkingType: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  free: boolean;
  capacity: number | null;
  operationDays: string;
  weekdayHours: string;
  saturdayHours: string;
  holidayHours: string;
  basicMinutes: number | null;
  basicFee: number | null;
  additionalMinutes: number | null;
  additionalFee: number | null;
  dailyFee: number | null;
  monthlyFee: number | null;
  paymentMethods: string;
  notes: string;
  institution: string;
  accessibleParking: boolean;
  referenceDate: string;
}

export interface HousingRentDeal {
  id: string;
  propertyType: string;
  propertyName: string;
  dealType: string;
  depositTenThousandWon: number;
  monthlyRentTenThousandWon: number;
  contractDate: string;
  areaSquareMeters: number;
  floor: number | null;
  neighborhood: string;
  lotNumber: string;
  buildYear: number | null;
  contractTerm: string;
  contractType: string;
  previousDepositTenThousandWon: number | null;
  previousMonthlyRentTenThousandWon: number | null;
  renewalRequestRightUsed: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: string;
}

export interface DirectionsRoute {
  distanceMeters: number;
  durationMillis: number;
  path: Coordinates[];
}

export type SelectedMapItem =
  | { kind: 'good-price'; value: GoodPriceStore }
  | { kind: 'public-facility'; value: PublicFacility }
  | { kind: 'public-parking'; value: PublicParkingLot }
  | { kind: 'housing'; value: HousingRentDeal };

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
