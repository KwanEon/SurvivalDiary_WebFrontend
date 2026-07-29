export const recentExpenses = [
  { name: '스타벅스', category: '카페', amount: '5,000원', date: '05.12', tone: 'green' },
  { name: '교통비', category: '교통', amount: '1,450원', date: '05.12', tone: 'blue' },
  { name: '편의점', category: '식비', amount: '4,800원', date: '05.11', tone: 'orange' },
  { name: '저녁 식사', category: '식비', amount: '12,000원', date: '05.11', tone: 'red' },
  { name: '넷플릭스', category: '문화', amount: '5,500원', date: '05.10', tone: 'black' },
];

export const categorySpending = [
  { label: '식비', amount: '234,000원', percent: 48, color: 'var(--color-primary-600)' },
  { label: '교통', amount: '72,000원', percent: 15, color: 'var(--color-info)' },
  { label: '카페', amount: '58,900원', percent: 12, color: 'var(--color-warning)' },
  { label: '쇼핑', amount: '48,600원', percent: 10, color: 'var(--color-danger)' },
  { label: '기타', amount: '73,400원', percent: 15, color: 'var(--color-purple)' },
];

export const quickActions = [
  { label: '지출 등록', description: '직접 입력하기', to: '/expenses/new' },
  { label: '이번 달 통계', description: '소비 흐름 보기', to: '/expenses/statistics' },
  { label: '정책 찾기', description: '맞춤 혜택 보기', to: '/policies' },
  { label: '절약 장소', description: '주변 혜택 보기', to: '/map' },
];
