/* =========================================================
   Bearshare 설정 · 예시 데이터
   운영 시간, 공간, 이용 기준, 예시 수업, 공지는 이 파일에서 고치면 됩니다.
   ========================================================= */
window.BS = window.BS || {};

BS.config = {
  slotMinutes: 30,        // 예약 단위(분)
  dayStart: 7,            // 시간표 시작 시각 (베어토피아가 07시에 열어서 7)
  dayEnd: 22,             // 시간표 종료 시각
  maxSlots: 8,            // 1회 최대 예약 칸 수 (30분 x 8 = 4시간)
  applyFromDays: 30,      // 이용일 30일 전부터 신청 가능
  applyUntilDays: 3,      // 이용일 3일 전까지 신청 가능
  approvalDays: 2,        // 신청 후 2일(평일) 이내 승인·반려
  feeText: '무료 (시범 운영 기간)',
  teamName: 'Bearshare 운영팀 (캡스톤디자인2 쥬라기월드조)',
  teamEmail: '[팀 이메일 주소]',
  adminOfficeEmail: '[총무팀 이메일 주소]',
  policyDate: '2026년 10월 26일'
};

/* hours: [여는 시각, 닫는 시각] (시 단위). weekday = 월~금, weekend = 토·일 */
BS.spaces = [
  {
    id: 'beartopia', name: '베어토피아', category: 'lounge', type: '지역 개방 커뮤니티 공간',
    capacity: 40, size: '강의실 1개 크기',
    location: '충남 천안시 동남구 단대로 119 (안서동) 승차대기실 101호 2층',
    equipment: ['테이블·의자', '화이트보드', '빔프로젝터 (확인 필요)'],
    hours: { weekday: [7, 21], weekend: [7, 21] },
    desc: '이미 지역 주민에게 개방된 공간으로, Bearshare 1단계 시범 운영 장소입니다. 스터디, 소모임, 원데이클래스에 알맞아요.',
    example: false
  },
  {
    id: 'fl-hall', name: '외국어대학 강당', category: 'hall', type: '강당',
    capacity: 200, size: '약 350㎡', location: '천안캠퍼스 외국어대학 1층',
    equipment: ['무대', '음향 시스템', '무선마이크 2개', '빔프로젝터'],
    hours: { weekday: [19, 22], weekend: [9, 22] },
    desc: '설명회, 발표회, 공연 연습처럼 많은 인원이 모이는 행사에 알맞아요.',
    example: true
  },
  {
    id: 'field', name: '대운동장', category: 'sports', type: '운동장',
    capacity: 100, size: '축구장 · 400m 트랙', location: '천안캠퍼스 대운동장',
    equipment: ['야간 조명', '트랙', '축구 골대', '벤치'],
    hours: { weekday: [19, 22], weekend: [18, 22] },
    desc: '러닝, 축구, 생활체육 동호회 활동에 알맞아요. 운동부 훈련 일정이 우선이에요.',
    example: true
  },
  {
    id: 'gym', name: '체육관', category: 'sports', type: '실내 체육관',
    capacity: 80, size: '배드민턴 코트 4면 · 농구 코트 1면', location: '천안캠퍼스 체육관 1층',
    equipment: ['배드민턴 네트', '농구 골대', '탈의실'],
    hours: { weekday: [19, 22], weekend: [18, 22] },
    desc: '배드민턴, 농구, 실내 생활체육에 알맞아요. 실내화를 꼭 준비해 주세요.',
    example: true
  },
  {
    id: 'hum-201', name: '인문관 201호', category: 'classroom', type: '일반 강의실',
    capacity: 40, size: '약 70㎡', location: '천안캠퍼스 인문관 2층',
    equipment: ['빔프로젝터', '전자교탁', '화이트보드'],
    hours: { weekday: [19, 22], weekend: [9, 22] },
    desc: '강의형 수업, 특강, 설명회에 알맞아요.',
    example: true
  },
  {
    id: 'eng-305', name: '공학관 305호', category: 'classroom', type: '실습형 강의실',
    capacity: 30, size: '약 60㎡', location: '천안캠퍼스 공학관 3층',
    equipment: ['PC 30대', '빔프로젝터', '화이트보드'],
    hours: { weekday: [19, 22], weekend: [9, 22] },
    desc: '디지털 기기 교육, 코딩 체험처럼 컴퓨터가 필요한 수업에 알맞아요.',
    example: true
  },
  {
    id: 'edu-104', name: '사범관 104호 세미나실', category: 'classroom', type: '세미나실',
    capacity: 16, size: '약 35㎡', location: '천안캠퍼스 사범관 1층',
    equipment: ['회의 테이블', 'TV 모니터', '화이트보드'],
    hours: { weekday: [19, 22], weekend: [9, 22] },
    desc: '소규모 스터디, 회의, 독서 모임에 알맞아요.',
    example: true
  }
];

BS.categories = { lounge: '모임·스터디', classroom: '강의실', hall: '행사', sports: '체육' };

BS.purposes = ['스터디', '동아리·동호회 활동', '비영리 소모임', '소규모 강습·원데이클래스', '지역 주민 교류 행사', '기타'];

BS.rejectReasons = ['학교 일정과 겹침', '이용 기준 위반 (정치·종교·영리 목적)', '신청 인원이 수용 인원 초과', '신청 내용이 불명확함', '기타'];

/* 대관 안내 · 신청서에 함께 표시되는 이용 기준 */
BS.rules = {
  allowed: [
    '개인·그룹 스터디, 회의, 독서·취미 모임',
    '동아리·생활체육 동호회 활동',
    '비영리 소모임, 지역 주민 교류 행사',
    '재료비·실비 수준의 참가비만 받는 소규모 강습·원데이클래스'
  ],
  banned: [
    '정치 목적의 모임 (특정 정당·후보 지지, 선거운동, 정치 집회 등)',
    '종교 목적의 모임 (예배, 포교, 종교 행사 등)',
    '영리 행위 (상품 판매, 광고·홍보, 다단계 설명회, 입장료를 받는 행사 등)',
    '예약한 공간을 다른 사람에게 넘기거나 다시 빌려주는 행위'
  ],
  notes: [
    '수업과 학사 일정이 항상 우선이에요. 학교 일정과 겹치면 승인 후에도 예약이 취소될 수 있어요.',
    '준비·정리 시간을 포함해 신청하고, 예약한 시간에 맞춰 들어오고 나가 주세요.',
    '캠퍼스 안에서는 음주·흡연을 할 수 없어요.',
    '사용한 공간은 원래대로 정리하고, 쓰레기는 직접 수거해 주세요.',
    '시설물을 파손하면 원상복구 또는 배상 책임이 있어요.'
  ]
};

/* 예시 수업: dow = 요일(0 일 ~ 6 토), week = 몇 주 뒤(0 = 가장 가까운 그 요일) */
BS.classSeeds = [
  { id: 'c-phone', title: '어르신 스마트폰 기초 교실', field: '디지털', host: '김○○', dept: '소프트웨어학과 3학년',
    spaceId: 'beartopia', dow: 6, week: 0, start: '10:00', end: '12:00', capacity: 12, applied: 7,
    target: '스마트폰이 낯선 주민 누구나', fee: '무료',
    desc: '카카오톡 사진 보내기, 버스 앱으로 도착 시간 보기, 키오스크 주문까지 천천히 함께 연습해요.' },
  { id: 'c-badminton', title: '처음 치는 배드민턴', field: '생활체육', host: '이○○', dept: '체육교육과 4학년',
    spaceId: 'gym', dow: 6, week: 0, start: '18:30', end: '20:30', capacity: 16, applied: 11,
    target: '배드민턴 입문자 (초등학생 이상)', fee: '무료 (라켓 대여 가능)',
    desc: '라켓 잡는 법과 기본 스윙부터 간단한 복식 경기까지 해 봐요.' },
  { id: 'c-english', title: '아이와 함께하는 영어 그림책 읽기', field: '교육', host: '박○○', dept: '영미인문학과 2학년',
    spaceId: 'beartopia', dow: 3, week: 0, start: '16:00', end: '17:30', capacity: 10, applied: 4,
    target: '6~9세 어린이와 보호자', fee: '재료비 3,000원',
    desc: '그림책 한 권을 같이 읽고, 나만의 미니북을 만들어 가져가요.' },
  { id: 'c-policy', title: '생활 속 공공정책 이야기', field: '인문·사회', host: '정○○', dept: '공공정책학과 3학년',
    spaceId: 'hum-201', dow: 2, week: 1, start: '19:00', end: '20:30', capacity: 30, applied: 9,
    target: '지역 주민 누구나', fee: '무료',
    desc: '청년·노인 복지 제도, 천안시 지원사업을 어떻게 찾고 신청하는지 쉽게 알려 드려요.' },
  { id: 'c-excel', title: '소상공인을 위한 엑셀 장부 정리', field: '디지털', host: '한○○', dept: '경영학과 4학년',
    spaceId: 'eng-305', dow: 6, week: 1, start: '14:00', end: '16:00', capacity: 20, applied: 20,
    target: '가게 매출·지출 정리가 필요한 주민', fee: '무료',
    desc: '매출·지출 표 만들기, 월별 합계 자동 계산까지 따라 하며 배워요.' }
];

BS.notices = [
  { date: '2026-10-26', title: '대관 신청 기간·승인 기간 안내 (이용 30일 전~3일 전 신청, 2일 이내 승인)', href: 'guide.html' },
  { date: '2026-10-26', title: '개인정보처리방침을 게시했어요', href: 'privacy.html' },
  { date: '2026-10-16', title: 'Bearshare 1단계 시범 운영 안내 (베어토피아)', href: 'spaces.html' },
  { date: '2026-10-12', title: '시범 운영 기간 동안 모든 공간 이용료 무료', href: 'guide.html' },
  { date: '2026-10-08', title: '재학생 원데이클래스 제안 접수를 시작합니다', href: 'propose.html' }
];
