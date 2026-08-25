export type CommunityThumbnail = 'market' | 'meal' | 'house' | 'coffee';

export interface CommunityPost {
  id: number;
  category: string;
  author: string;
  avatar: string;
  time: string;
  title: string;
  excerpt: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  thumbnail: CommunityThumbnail;
}

export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    category: '정보 공유',
    author: '알뜰한콩',
    avatar: '콩',
    time: '24시간 전',
    title: '편의점 50% 할인 꿀팁 공유해요!',
    excerpt: '저녁 9시 이후 방문하면 할인하는 매장이 꽤 많아요. 동네별 정보를 모아봤습니다.',
    tags: ['편의점할인', '생활절약', '할인정보'],
    likes: 42,
    comments: 15,
    views: 231,
    thumbnail: 'market',
  },
  {
    id: 2,
    category: '절약 인증',
    author: '절약하는 대학생',
    avatar: '절',
    time: '5시간 전',
    title: '한 달 식비 20만원 도전기!',
    excerpt: '직접 장을 보고 도시락을 준비하면서 지출을 크게 줄였어요. 이번 주 식단도 공유합니다.',
    tags: ['식비절약', '자취생', '도시락'],
    likes: 38,
    comments: 22,
    views: 198,
    thumbnail: 'meal',
  },
  {
    id: 3,
    category: '질문',
    author: '정책지원 정보통',
    avatar: '정',
    time: '8시간 전',
    title: '청년 주택드림 청약통장 변경 내용 정리',
    excerpt: '신청 조건과 준비 서류를 정리했어요. 자격 조건이 헷갈리는 분들은 같이 확인해요.',
    tags: ['청년정책', '청약통장', '주거'],
    likes: 27,
    comments: 8,
    views: 156,
    thumbnail: 'house',
  },
  {
    id: 4,
    category: '자유게시판',
    author: '커피는못참지',
    avatar: '커',
    time: '어제',
    title: '텀블러 할인 다들 얼마나 활용하세요?',
    excerpt: '카페마다 할인 폭이 달라서 자주 가는 매장 기준으로 정리해 보려고 해요.',
    tags: ['카페', '텀블러', '잡담'],
    likes: 19,
    comments: 11,
    views: 92,
    thumbnail: 'coffee',
  },
];
