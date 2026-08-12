export type PolicyCategory =
  'EMPLOYMENT' | 'HOUSING' | 'EDUCATION' | 'WELFARE_CULTURE' | 'PARTICIPATION_RIGHTS';

export type WorkStatus =
  | 'EMPLOYED'
  | 'SELF_EMPLOYED'
  | 'UNEMPLOYED'
  | 'FREELANCER'
  | 'DAILY_WORKER'
  | 'PROSPECTIVE_FOUNDER'
  | 'SHORT_TERM_WORKER'
  | 'FARMER'
  | 'OTHER';

export type EducationLevel =
  | 'MIDDLE_SCHOOL_OR_LESS'
  | 'HIGH_SCHOOL'
  | 'COLLEGE_2_3_YEAR'
  | 'UNIVERSITY_4_YEAR'
  | 'GRADUATE_SCHOOL'
  | 'OTHER';

export type EnrollmentStatus =
  'ENROLLED' | 'ON_LEAVE' | 'EXPECTED_GRADUATION' | 'GRADUATED' | 'DROPPED_OUT' | 'NOT_APPLICABLE';

export type PolicyInterest = PolicyCategory | 'ASSET_BUILDING' | 'TRANSPORT';

export type PolicyEligibilityStatus = 'MATCHED' | 'CHECK_REQUIRED';
export type PolicyRecommendationStatus = 'RECOMMENDED' | 'CHECK_REQUIRED' | 'DISCOVER';
export type PolicyApplicationPeriodType =
  'FIXED' | 'ALWAYS' | 'CLOSED' | 'UNTIL_BUDGET' | 'UNKNOWN';
export type PolicySupportAmountType = 'FIXED' | 'MAXIMUM' | 'MONTHLY' | 'MONTHLY_MAXIMUM';
export type PolicyOfficialLinkType =
  'APPLICATION_CANDIDATE' | 'LOGIN_REQUIRED' | 'INSTITUTION_HOME' | 'UNKNOWN' | 'UNAVAILABLE';

export interface PolicyPreference {
  saved: boolean;
  age: number | null;
  regionCode: string | null;
  districtCode: string | null;
  employmentStatus: string | null;
  incomeRange: string | null;
  category: string | null;
  workStatus: WorkStatus | null;
  jobSeeking: boolean | null;
  educationStatus: string | null;
  educationLevel: EducationLevel | null;
  enrollmentStatus: EnrollmentStatus | null;
  interests: PolicyInterest[];
}

export interface PolicyPreferenceInput {
  age: number | null;
  regionCode: string;
  districtCode: string | null;
  workStatus: WorkStatus | null;
  jobSeeking: boolean | null;
  educationLevel: EducationLevel | null;
  enrollmentStatus: EnrollmentStatus | null;
  interests: PolicyInterest[];
}

export interface PolicyRecommendationRequest {
  category: PolicyCategory | null;
  keyword: string | null;
  page: number;
  size: number;
}

export interface PolicySummary {
  policyId: string;
  category: string;
  categoryType: PolicyCategory | null;
  title: string;
  summary: string;
  shortSummary: string;
  supportAmount: number | null;
  supportAmountType: PolicySupportAmountType | null;
  supportText: string;
  applicationPeriodText: string;
  applicationPeriodType: PolicyApplicationPeriodType;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  target: string;
  agency: string;
  eligibilityStatus: PolicyEligibilityStatus;
  eligibilityReasons: string[];
  recommendationStatus: PolicyRecommendationStatus;
  recommendationReasons: string[];
  matchSignals: string[];
}

export interface PolicySearchResponse {
  items: PolicySummary[];
  partialResult: boolean;
  checkedProviderPages: number;
  nextPage: number | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface HiddenPolicyRequest {
  title: string;
  category: string | null;
  shortSummary: string | null;
}

export interface HiddenPolicySummary {
  policyId: string;
  title: string;
  category: string | null;
  shortSummary: string | null;
  hiddenAt: string;
}

export interface PolicyDetail {
  policyId: string;
  category: string;
  categoryType: PolicyCategory | null;
  title: string;
  description: string;
  supportAmount: number | null;
  supportAmountType: PolicySupportAmountType | null;
  supportText: string;
  applicationPeriodText: string | null;
  applicationPeriodType: PolicyApplicationPeriodType | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  target: string;
  agency: string;
  operatingAgency: string;
  applicationMethod: string;
  documents: string[];
  officialUrl: string | null;
  officialLinkType: PolicyOfficialLinkType;
  referenceUrls: string[];
}

export interface PolicyDetailNavigationState {
  summary: PolicySummary;
}

export interface PolicyHiddenNotice {
  policyId: string;
  title: string;
  hiddenAt: string;
  summary?: PolicySummary;
}

export interface PolicyListNavigationState {
  hiddenPolicy?: PolicyHiddenNotice;
}
