export type MapMarkerTone = 'green' | 'blue' | 'orange';

export const mapMarkers = [
  { id: 1, label: '착한가격업소', top: '22%', left: '27%', tone: 'green' as MapMarkerTone },
  { id: 2, label: '공영주차장', top: '35%', left: '60%', tone: 'blue' as MapMarkerTone },
  { id: 3, label: '지역 평균가', top: '54%', left: '35%', tone: 'orange' as MapMarkerTone },
  { id: 4, label: '공공시설', top: '68%', left: '72%', tone: 'green' as MapMarkerTone },
  { id: 5, label: '공영주차장', top: '76%', left: '18%', tone: 'blue' as MapMarkerTone },
  { id: 6, label: '착한가격업소', top: '42%', left: '81%', tone: 'green' as MapMarkerTone },
  { id: 7, label: '지역 평균가', top: '18%', left: '72%', tone: 'orange' as MapMarkerTone },
];

export const mapCategories = [
  '전체',
  '착한가격업소',
  '지역 평균가',
  '공공시설',
  '공영주차장',
  '주거지 실거래가',
];
