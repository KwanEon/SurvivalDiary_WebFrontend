export type PolicyTone = 'coral' | 'purple' | 'mint' | 'blue' | 'yellow';

export interface PolicyItem {
  id: number;
  category: string;
  title: string;
  summary: string;
  region: string;
  target: string;
  benefit: string;
  deadline: string;
  tone: PolicyTone;
  tag: string;
}

export const policies: PolicyItem[] = [
  {
    id: 1,
    category: '주거',
    title: '청년 월세 한시 특별지원',
    summary: '월 최대 20만원의 월세를 최대 12개월 동안 지원해요.',
    region: '전국',
    target: '만 19~34세',
    benefit: '최대 240만원',
    deadline: '2024.06.30',
    tone: 'coral',
    tag: '주거비',
  },
  {
    id: 2,
    category: '취업',
    title: '청년 구직활동 지원금',
    summary: '구직 준비 중인 청년에게 활동비와 상담을 제공해요.',
    region: '서울',
    target: '미취업 청년',
    benefit: '월 50만원',
    deadline: '2024.07.15',
    tone: 'purple',
    tag: '구직지원',
  },
  {
    id: 3,
    category: '금융',
    title: '청년내일저축계좌',
    summary: '근로 청년이 저축하면 정부가 추가 적립금을 지원해요.',
    region: '전국',
    target: '근로·사업 청년',
    benefit: '최대 360만원',
    deadline: '2024.06.10',
    tone: 'mint',
    tag: '금융·자산',
  },
  {
    id: 4,
    category: '문화',
    title: '청년 문화예술패스',
    summary: '공연과 전시 관람에 사용할 수 있는 문화비를 지원해요.',
    region: '전국',
    target: '만 19세',
    benefit: '최대 15만원',
    deadline: '2024.08.31',
    tone: 'blue',
    tag: '문화생활',
  },
  {
    id: 5,
    category: '교통',
    title: '청년 대중교통비 지원사업',
    summary: '대중교통 이용금액 일부를 교통 마일리지로 돌려드려요.',
    region: '서울',
    target: '만 19~24세',
    benefit: '연 12만원',
    deadline: '2024.09.30',
    tone: 'yellow',
    tag: '교통비',
  },
];
