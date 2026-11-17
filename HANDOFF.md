# HANDOFF — zinsight
갱신: 2026-11-17 15:52 (KST) · PC: desktop-d7ttin2 · 브랜치: main

## 목표
링크 페이지(QR) + 방문 통계 리포트 + 연락처 수집을 전시회(MICE) 참가사 패키지로 다듬는다.
AEO 프로필·기사는 덤. 11/17~19 KOREA MICE EXPO(코엑스 마곡) 중 11/18(수)에 대표가 고문님 소개로 주최사에 시연한다. P1 개발은 시연 후.

## 현재 상태
- 완료(P0 1~5, 11/16): KME 시연 전 점검 항목 전부. origin/main까지 푸시함 (cb26953까지)
  - 관리자 트래픽 통계 제외 (커밋 1885443)
  - 문의하기 전화 우선 (커밋 3e1a53d). 이후 가운데 보조 메일 아이콘 버튼 제거, 하단 바는 [문의하기 | 연락처 남기기] 2칸 (커밋 bc28efa, 11/16 푸시함 — 배포 후 운영 화면 확인 필요)
    - 전화번호 있는 조직의 화면은 미확인: 로컬 zindok에 전화·메일이 없음
  - 소개 영상 실제 비율·세로 280px·빈 검은 화면 방지 (커밋 a465b43)
  - 관리자 조직 탭 모바일 한 줄 표시 (커밋 ec64a6f)
  - Threads 링크: 코드 변경 없음. 관리자 편집 '링크' 카드에서 라벨·주소 수정, 표시 체크 해제, 삭제 가능 (사람이 처리)
- 관리자 패스키(지정 기기) 로그인 (커밋 4a0952d, 11/17 푸시): 보안 설정에서 기기 등록·삭제(2FA 켠 계정은 OTP 재확인, 최대 10대), 로그인 화면 '등록된 기기로 로그인'. admin_passkeys 테이블(마이그레이션 20261117000000, 배포 시 운영 자동 적용). 로그인 callbackUrl 내부 경로만 허용
  - 로컬 API·Windows Hello 동작 미확인: 실행 중이던 dev 서버가 옛 Prisma 클라이언트를 잡고 있어 500. dev 서버 재시작 필요
  - 휴대폰은 운영(https)에서 다시 등록해야 함. 로컬에서 등록한 패스키는 운영에서 안 됨
- 관리자 모바일 대응 (커밋 348675e, 11/17 푸시): 휴대폰 main 여백 p-3, 링크 통계 표 2개는 휴대폰에서 목록, 조직 목록은 이름 아래 요약, 탭·기간·그래프 버튼 높이 확대. 375px에서 페이지·표 가로 넘침 없음 확인 (로컬, 받은 연락처는 데이터 없어 목록 화면 미확인)
- 규칙: .agents/AGENTS.md 0번에 'HANDOFF.md 먼저 읽기·작업 후 갱신' 추가 (커밋 cb26953). 단순 INSERT 허용·UPDATE/DELETE는 SQL 보고 (커밋 ead3f55)
- 이전 완료: 연락처 남기기·받은 연락처·통계 개선 (765560b), 업로드 WebP 변환 (29119b9, f1fa9e2)
- 미커밋: next-env.d.ts, tsconfig.tsbuildinfo 수정, AGENTS.md 신규 (next dev가 생성·수정, 커밋하지 않음)

## 다음 할 일 (우선순위 순)
### P0 남은 확인 (배포 후, 사람)
- 운영 테스트 리드 1건(이종섭, 2026-11-11 16:53 KST) 삭제: 아래 SQL을 사람이 승인 후 실행
  - 확인: SELECT id, name, created_at FROM link_page_leads WHERE name = '이종섭' AND created_at BETWEEN '2026-11-11 07:50:00' AND '2026-11-11 07:56:00';  (created_at은 UTC 저장)
  - 삭제: DELETE FROM link_page_leads WHERE id = <위에서 확인한 id>;
- 비관리자 휴대폰으로 /go/zindok → 문의하기(전화 앱 열림) → 통계 '문의하기 클릭' +1 확인
- 관리자 로그인 휴대폰으로 링크 페이지를 열고 버튼을 눌러도 통계 숫자가 변하지 않는지 확인
- zindok 조직에 전화번호(contact_phone)가 있어야 전화 우선으로 바뀜. 없으면 지금처럼 메일
- 이미지 변환(11/11 배포) 후속: 운영 보관함 업로드가 .webp로 저장되는지, Vercel Image Optimization 사용량이 멈췄는지 아직 사람 확인 안 함
- 재압축 원본 백업 NCP 버킷 _backup/2026-11-11/ (비공개, 약 125MB): 이상 없으면 삭제 여부 사람이 결정

### P1 — 참가사 파일럿 전
1. 행사 기간 등록 → 기간별 통계·연락처: 조직에 행사(이름·시작일·종료일, KST)를 등록하고 통계·받은 연락처를 그 기간으로 필터. QR(/go/ 코드)은 조직당 하나 고정. 5번 리포트 PDF와 같은 행사 기준으로 묶어서 진행
2. 새 연락처 실시간 알림: 1차 이메일, 2차 문자/알림톡 검토. 이름·연락처·메모·유입 경로·시각 포함
3. (보류, 11/17 사용자) 참가사 전용 보기: 자기 통계·연락처만 보는 화면. 1차는 비밀 링크(토큰)+만료일, noindex, 토큰 재발급 필수. 현재 외부 공유 기능 없음(CSV만). OrganizationInvite의 토큰·만료 구조 참고 가능
4. 시간대별 통계: 기간 7일 이하면 시간 단위 그래프 또는 요일×시간 히트맵(KST)
5. 성과 리포트 PDF: 통계 화면을 1번의 행사 기간 기준 1~2쪽으로. 연락처는 건수만, 원본은 CSV. 로드맵 F-11과 같은 틀
6. 제품·카탈로그 블록: 이미지·이름·한 줄 설명·링크/PDF 카드, 클릭은 '제품' 종류로 집계
7. 업로드 파일명: 한글 파일명이 슬러그에서 전부 지워져 image.mp4 / image.pdf로 저장됨. 다운로드 이름은 Content-Disposition으로 지정 검토

### P2 — 파일럿 이후 (반응 보고 결정)
8. 연락처 상태(신규/연락함/미팅/계약)와 메모
9. 현장용 간편 폼(전화번호만) — 폼 열기 6 대비 접수 1이나 표본 작아 보류
10. 주최사 합산 화면(행사 코드 기준 참가사 전체 합산)
11. 리드-행동 연결(연락처 남긴 방문자의 이전 행동 표시, 미제출자는 집계만)
12. 매거진 카드 썸네일이 1600px 원본으로 56px 표시 → 작은 버전 사용

## 결정 사항
- 패키지 메인은 QR 페이지·통계 리포트·연락처 수집, AEO·기사는 덤 — 이유: 증명된 기능부터 앞에 세움
- 참가사에게 큰 비용은 받지 않음 — 이유: 사용자(CTO) 방침
- KME에서는 판매보다 시연과 고객 반응 확인 — 이유: 지불 의향은 아직 검증 전
- 행사 구분은 QR 코드 여러 개가 아니라 행사 기간으로 — 이유: 현장에서 QR 교체가 어려워 조직당 하나로 고정할 가능성이 큼 (사용자 판단, 11/16). 같은 날 여러 행사·행사장 밖 유입은 구분 못 함. 필요해지면 코드 분리를 나중에 추가
- 링크 페이지는 noindex 유지 — 이유: 검색 노출은 인사이트 레이더 프로필로 모음
- 내부 트래픽 판정은 서버(auth_token 세션)가 기준, 클라이언트는 응답 헤더(X-Zi-Internal)로 그 탭의 이후 전송·GA만 멈춤 — 이유: 로그아웃 기능이 없어 영구 플래그는 오판 위험
- 관리자가 남긴 '연락처 남기기' 접수는 제외하지 않음 — 이유: 시연에서 접수→관리자 화면 반영을 보여 줘야 함 (폼 열기 클릭만 제외)
- 문의하기는 연결처 하나: 전화 → 문의 URL → 메일 순 — 이유: 보조 메일 아이콘이 UI상 애매함 (사용자 결정, 11/16). 통계의 inquiry_alt 합산은 과거 데이터용으로 유지

## 주의 · 막힌 점
- '문의하기 클릭' 0회 원인: 코드상 추적 누락은 없음 (#org-links 클릭 위임 → sendBeacon, inquiry 키 허용). 운영 DB 조회가 권한상 막혀 실제 0인지는 미확인 — 추정: 실제 클릭이 없었음
- 개발 모드(next dev)에서는 proxy가 모든 브라우저에 로컬 관리자 쿠키를 넣어 링크 페이지 통계가 전부 내부 트래픽으로 빠짐. 비관리자 집계 확인은 쿠키 없는 curl로 해야 함
- next dev가 가끔 '.next/dev/logs' 기록 → 재컴파일 → 브라우저 새로고침 루프에 빠짐 (Compiled in 2ms 반복). dev 서버 재시작으로 해소
- 공개 프로필(src/app/(public)/insight-radar/[id]/page.tsx)의 문의 버튼은 아직 예전 순서(문의 URL → 메일 → 전화). 링크 페이지만 전화 단일로 바뀜 — 맞출지 결정 필요
- 운영 DB 읽기 전용 조회도 에이전트 권한 확인에서 막힘 (11/16). 운영 데이터 확인이 필요하면 사람이 조회하거나 권한 규칙을 추가해야 함
- 개발 DB는 ssh 터널이 떠 있어야 접속됨: `pnpm db:tunnel` (백그라운드, ~/.ssh/config의 zinsight-db 별칭 사용). 'Address already in use'면 이미 떠 있는 것. 자세한 건 .agents/AGENTS.md 0-1
- 로컬·프리뷰·운영이 같은 NCP 버킷을 쓰므로 테스트 업로드는 끝나면 지움
- 영상: 포스터가 없으면 src에 #t=0.001을 붙이고 preload=auto로 첫 장면을 불러옴 (모바일 데이터 사용량 약간 증가)
- 연락처는 개인정보: 알림·리포트·공유 화면에서 노출 범위 주의
- 운영 DB 데이터 삭제는 사전 승인 (ead3f55 규칙). 마이그레이션은 schema.prisma 변경 때만

- 패스키 RP ID는 요청 호스트 기준(src/lib/passkey.ts relyingParty). www·프리뷰·localhost마다 따로 등록됨
- next dev는 같은 폴더에서 두 번째 서버를 허용하지 않음. 스키마 변경 후에는 기존 dev 서버를 재시작해야 새 모델이 보임

## 핵심 파일
- src/lib/passkey.ts, src/app/api/auth/passkey/ — 패스키 등록·로그인·목록·삭제
- src/app/admin/settings/PasskeySettings.tsx, src/app/login/LoginForm.tsx — 패스키 UI
- src/app/(links)/insight-radar/[id]/links/page.tsx — 공개 링크 페이지 (하단 문의 바)
- src/lib/org-link-page.ts — 링크 페이지 데이터, 문의 주·보조 수단 결정
- src/components/public/insight-radar/links/ — LeadForm·Tracker(isInternalTraffic)·Video·BrandIcon
- src/app/api/track/route.ts — 방문·클릭·영상 수집, isAdminSession으로 내부 제외
- src/actions/admin/link-page-stats-actions.ts — 통계 집계 (inquiry + inquiry_alt 합산)
- src/app/admin/companies/[id]/OrgAdminTabs.tsx — 조직 관리 공통 탭
- src/app/admin/companies/[id]/link-analytics/, leads/ — 통계·받은 연락처 화면
- src/app/admin/companies/[id]/OrgLinksManager.tsx — 링크(SNS 포함) 편집
- src/app/go/[code]/route.ts — QR 단축 경로(/go/코드)

## 확인 방법
- 개발 DB 접속: `npx prisma migrate status` → 실패하면 `pnpm db:tunnel` 백그라운드 실행 후 다시 확인
- pnpm dev 후 /insight-radar/zindok/links 를 모바일 뷰(375px)로 확인
- 통계: /admin/companies/233/link-analytics, 연락처: /admin/companies/233/leads
- 비관리자 집계 확인: 쿠키 없이 curl로 POST /api/track (관리자 쿠키면 응답에 x-zi-internal: 1)
- npx tsc --noEmit. 단순 마크업 수정은 build 생략, 스키마 변경 시에만 마이그레이션
