# Bearshare (시제품)

단국대학교 천안캠퍼스 유휴 공간을 지역주민과 재학생이 함께 쓰는 공간 공유 서비스의 시제품입니다.
캡스톤디자인2(공공정책) 쥬라기월드조.

## 화면 (10개)
| 파일 | 화면 |
|---|---|
| index.html | 홈 |
| spaces.html | 공간안내 |
| guide.html | 대관안내 (신청 기간·승인·이용 기준) |
| reserve.html | 대관신청 (공간별 시간표, 30분 단위) |
| classes.html | 수업 둘러보기 |
| propose.html | 재학생 수업 제안 |
| login.html | 로그인 (재학생 / 지역주민, 개인정보 동의) |
| mypage.html | 내 예약 (취소, 내 정보 삭제) |
| admin.html | 관리자 (대관 승인, 수업 제안 검토, 총무팀 주간 보고 메일) |
| privacy.html | 개인정보처리방침 |

## 내용 고치기
- 운영 시간, 공간, 이용 기준, 예시 수업, 공지, 이메일 주소: `assets/data.js`
- 색: `assets/style.css` 맨 위 `:root`

## 올리기 (Firebase Hosting)
이 폴더에서 `firebase deploy --only hosting --project 프로젝트ID`

## 알아 둘 점
- 서버 없이 동작하며, 입력한 정보는 각자의 브라우저에만 저장돼요. 다른 사람의 예약은 보이지 않아요.
- 시연 전 관리자 › 설정 › 예시 데이터 초기화를 누르면 깨끗하게 시작할 수 있어요.
