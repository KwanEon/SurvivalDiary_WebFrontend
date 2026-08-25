import type {
  EducationLevel,
  EnrollmentStatus,
  PolicyCategory,
  PolicyInterest,
  WorkStatus,
} from './types';
import { REGION_OPTIONS } from './regions';

export { getDistrictOptions, REGION_OPTIONS } from './regions';

interface Option<T extends string> {
  value: T;
  label: string;
}

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

export const EDUCATION_LEVEL_OPTIONS: Option<EducationLevel>[] = [
  { value: 'MIDDLE_SCHOOL_OR_LESS', label: '중학교 졸업 이하' },
  { value: 'HIGH_SCHOOL', label: '고등학교' },
  { value: 'COLLEGE_2_3_YEAR', label: '2·3년제 대학' },
  { value: 'UNIVERSITY_4_YEAR', label: '4년제 대학' },
  { value: 'GRADUATE_SCHOOL', label: '대학원 이상' },
  { value: 'OTHER', label: '기타 교육 과정' },
];

export const ENROLLMENT_STATUS_OPTIONS: Option<EnrollmentStatus>[] = [
  { value: 'ENROLLED', label: '재학 중' },
  { value: 'ON_LEAVE', label: '휴학 중' },
  { value: 'EXPECTED_GRADUATION', label: '졸업 예정' },
  { value: 'GRADUATED', label: '졸업' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'NOT_APPLICABLE', label: '해당 없음' },
];

export const POLICY_CATEGORY_OPTIONS: Option<PolicyCategory>[] = [
  { value: 'EMPLOYMENT', label: '일자리' },
  { value: 'HOUSING', label: '주거' },
  { value: 'EDUCATION', label: '교육' },
  { value: 'WELFARE_CULTURE', label: '복지·문화' },
  { value: 'PARTICIPATION_RIGHTS', label: '참여·권리' },
];

const POLICY_CATEGORY_VALUES = new Set<string>(
  POLICY_CATEGORY_OPTIONS.map((option) => option.value),
);

export const POLICY_INTEREST_OPTIONS: Option<PolicyInterest>[] = [
  ...POLICY_CATEGORY_OPTIONS,
  { value: 'ASSET_BUILDING', label: '자산 형성' },
  { value: 'TRANSPORT', label: '교통' },
];

export function isPolicyCategory(value: string): value is PolicyCategory {
  return POLICY_CATEGORY_VALUES.has(value);
}

export function regionLabel(code: string | null) {
  if (!code) return null;
  return REGION_OPTIONS.find((option) => option.value === code)?.label ?? `지역 ${code}`;
}

export function workStatusLabel(status: WorkStatus | null) {
  if (!status) return null;
  return WORK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function educationLevelLabel(level: EducationLevel | null) {
  if (!level) return null;
  return EDUCATION_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
}

export function enrollmentStatusLabel(status: EnrollmentStatus | null) {
  if (!status) return null;
  return ENROLLMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
