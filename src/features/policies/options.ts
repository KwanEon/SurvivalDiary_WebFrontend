import type { EducationStatus, PolicyCategory, PolicyInterest, WorkStatus } from './types';

interface Option<T extends string> {
  value: T;
  label: string;
}

export const REGION_OPTIONS = [
  { value: '11', label: '서울특별시' },
  { value: '26', label: '부산광역시' },
  { value: '27', label: '대구광역시' },
  { value: '28', label: '인천광역시' },
  { value: '29', label: '광주광역시' },
  { value: '30', label: '대전광역시' },
  { value: '31', label: '울산광역시' },
  { value: '36', label: '세종특별자치시' },
  { value: '41', label: '경기도' },
  { value: '43', label: '충청북도' },
  { value: '44', label: '충청남도' },
  { value: '46', label: '전라남도' },
  { value: '47', label: '경상북도' },
  { value: '48', label: '경상남도' },
  { value: '50', label: '제주특별자치도' },
  { value: '51', label: '강원특별자치도' },
  { value: '52', label: '전북특별자치도' },
] as const;

export const WORK_STATUS_OPTIONS: Option<WorkStatus>[] = [
  { value: 'EMPLOYED', label: '재직 중' },
  { value: 'SELF_EMPLOYED', label: '자영업' },
  { value: 'UNEMPLOYED', label: '미취업' },
  { value: 'FREELANCER', label: '프리랜서' },
  { value: 'DAILY_WORKER', label: '일용근로자' },
  { value: 'PROSPECTIVE_FOUNDER', label: '예비 창업자' },
  { value: 'SHORT_TERM_WORKER', label: '단기근로자' },
  { value: 'FARMER', label: '농어업인' },
  { value: 'OTHER', label: '기타' },
];

export const EDUCATION_STATUS_OPTIONS: Option<EducationStatus>[] = [
  { value: 'STUDENT', label: '재학 중' },
  { value: 'ON_LEAVE', label: '휴학 중' },
  { value: 'GRADUATED', label: '졸업' },
  { value: 'NOT_STUDENT', label: '비학생' },
  { value: 'OTHER', label: '기타' },
];

export const POLICY_CATEGORY_OPTIONS: Option<PolicyCategory>[] = [
  { value: 'EMPLOYMENT', label: '일자리' },
  { value: 'HOUSING', label: '주거' },
  { value: 'EDUCATION', label: '교육' },
  { value: 'WELFARE_CULTURE', label: '복지·문화' },
  { value: 'PARTICIPATION_RIGHTS', label: '참여·권리' },
];

export const POLICY_INTEREST_OPTIONS: Option<PolicyInterest>[] = [
  ...POLICY_CATEGORY_OPTIONS,
  { value: 'ASSET_BUILDING', label: '자산 형성' },
  { value: 'TRANSPORT', label: '교통' },
];

export function regionLabel(code: string | null) {
  if (!code) return null;
  return REGION_OPTIONS.find((option) => option.value === code)?.label ?? `지역 ${code}`;
}

export function workStatusLabel(status: WorkStatus | null) {
  if (!status) return null;
  return WORK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function educationStatusLabel(status: EducationStatus | null) {
  if (!status) return null;
  return EDUCATION_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
