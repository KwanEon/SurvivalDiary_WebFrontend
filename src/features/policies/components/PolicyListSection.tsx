import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleDollarSign,
  EyeOff,
  GraduationCap,
  Landmark,
  MapPin,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import type { PolicyApplicationPeriodType, PolicySummary, PolicySupportAmountType } from '../types';

const CATEGORY_VISUALS = {
  EMPLOYMENT: { icon: BriefcaseBusiness, tone: 'purple', label: '일자리' },
  HOUSING: { icon: Building2, tone: 'coral', label: '주거' },
  EDUCATION: { icon: GraduationCap, tone: 'blue', label: '교육' },
  WELFARE_CULTURE: { icon: Landmark, tone: 'mint', label: '복지·문화' },
  PARTICIPATION_RIGHTS: { icon: UsersRound, tone: 'yellow', label: '참여·권리' },
} as const;

function formatSupportAmount(amount: number, type: PolicySupportAmountType | null) {
  const formatted = `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
  switch (type) {
    case 'MAXIMUM':
      return `최대 ${formatted}`;
    case 'MONTHLY':
      return `월 ${formatted}`;
    case 'MONTHLY_MAXIMUM':
      return `월 최대 ${formatted}`;
    default:
      return formatted;
  }
}

function supportLabel(policy: PolicySummary) {
  if (policy.supportAmount !== null) {
    return formatSupportAmount(policy.supportAmount, policy.supportAmountType);
  }
  return policy.supportText || '지원 내용 확인';
}

function periodLabel(type: PolicyApplicationPeriodType, endDate: string | null, raw: string) {
  if (endDate) return endDate;
  switch (type) {
    case 'ALWAYS':
      return '상시 신청';
    case 'CLOSED':
      return '신청 마감';
    case 'UNTIL_BUDGET':
      return '예산 소진 시까지';
    default:
      return raw || '기간 확인 필요';
  }
}

interface PolicyCardProps {
  policy: PolicySummary;
  featured?: boolean;
  hiding: boolean;
  onOpen: (policy: PolicySummary) => void;
  onHide: (policy: PolicySummary) => void;
}

function PolicyCard({ policy, featured = false, hiding, onOpen, onHide }: PolicyCardProps) {
  const visual = policy.categoryType ? CATEGORY_VISUALS[policy.categoryType] : undefined;
  const Icon = visual?.icon ?? Landmark;
  const visualTone = visual?.tone ?? 'mint';
  const categoryName = visual?.label ?? (policy.category.trim() || '기타');
  const reason = policy.recommendationReasons[0] ?? policy.eligibilityReasons[0];

  return (
    <article className={`ui-card policy-card ${featured ? 'policy-card--featured' : ''}`}>
      <span className={`policy-card__icon policy-card__icon--${visualTone}`}>
        <Icon size={featured ? 26 : 22} aria-hidden="true" />
      </span>

      <div className="policy-card__body">
        <div className="policy-card__title-row">
          <span className="status-badge">
            {policy.recommendationStatus === 'RECOMMENDED'
              ? '추천'
              : policy.recommendationStatus === 'DISCOVER'
                ? '둘러보기'
                : '확인 필요'}
          </span>
          <span className="policy-card__category">{categoryName}</span>
        </div>
        <h2>{policy.title}</h2>
        <p>{policy.shortSummary || policy.summary}</p>
        {reason ? <p className="policy-card__reason">{reason}</p> : null}
        <div className="policy-card__meta">
          <span>
            <MapPin size={13} aria-hidden="true" />
            {policy.agency || '기관 확인'}
          </span>
          <span>
            <UserRoundCheck size={13} aria-hidden="true" />
            {policy.target || '지원 대상 확인'}
          </span>
          <span>
            <CircleDollarSign size={13} aria-hidden="true" />
            {supportLabel(policy)}
          </span>
        </div>
      </div>

      <div className="policy-card__action">
        <span>{policy.applicationEndDate ? '신청 마감' : '신청 기간'}</span>
        <strong>
          {periodLabel(
            policy.applicationPeriodType,
            policy.applicationEndDate,
            policy.applicationPeriodText,
          )}
        </strong>
        <button
          className="policy-card__detail"
          type="button"
          onClick={() => onOpen(policy)}
          aria-label={`${policy.title} 상세 보기`}
        >
          상세 보기 <ChevronRight size={15} aria-hidden="true" />
        </button>
        <button
          className="policy-card__hide"
          type="button"
          disabled={hiding}
          onClick={() => onHide(policy)}
          aria-label={`${policy.title} 관심 없음으로 설정`}
        >
          <EyeOff size={14} aria-hidden="true" /> 관심 없음
        </button>
      </div>
    </article>
  );
}

interface PolicyListSectionProps {
  id: string;
  title: string;
  policies: PolicySummary[];
  featuredFirst?: boolean;
  hidingPolicyIds: Set<string>;
  onOpen: (policy: PolicySummary) => void;
  onHide: (policy: PolicySummary) => void;
}

function PolicyListSection({
  id,
  title,
  policies,
  featuredFirst = false,
  hidingPolicyIds,
  onOpen,
  onHide,
}: PolicyListSectionProps) {
  if (policies.length === 0) return null;

  return (
    <section className="policies-section" aria-labelledby={id}>
      <header className="policies-section__heading">
        <h2 id={id}>{title}</h2>
        <span>{policies.length}개</span>
      </header>
      <div className="policies__list">
        {policies.map((policy, index) => (
          <PolicyCard
            key={policy.policyId}
            policy={policy}
            featured={featuredFirst && index === 0}
            hiding={hidingPolicyIds.has(policy.policyId)}
            onOpen={onOpen}
            onHide={onHide}
          />
        ))}
      </div>
    </section>
  );
}

export default PolicyListSection;
