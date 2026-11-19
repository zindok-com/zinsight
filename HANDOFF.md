# HANDOFF — zinsight
갱신: 2026-11-19 16:40 (KST) · PC: desktop-d7ttin2 · 브랜치: main

## 목표
링크 페이지(QR) + 방문 통계 리포트 + 연락처 수집을 전시회(MICE) 참가사 패키지로 다듬는다.
주최사 파일럿(이즈피엠피) 제안용으로 참가사가 전시 중·후에 직접 보는 방문 통계(외부 공유 링크)를 먼저 만들었다. 다음은 운영 배포 확인 후 P1 나머지.

## 현재 상태 (모두 origin/main 푸시함, 최신 bdb2b82)
- 완료: 링크 페이지 방문 통계 외부 공유 링크·요약 리포트 (커밋 bdb2b82)
  - 관리자 '링크 페이지 통계' 탭 상단 '통계 공유 링크' 패널: 만들기·복사·새로 발급·끊기, 기본 기간(전시 기간)·만료일 선택. 조직당 유효 링크 1개
  - 공유 페이지 /share/stats/[토큰] (로그인 없음): 기간(전시 기간·전체·7일·30일·직접), 방문·링크 클릭·외부 이동 비율·영상 재생·문의하기 클릭, 일자별·시간대별 방문, 유입 경로, 링크 순위
  - 요약 리포트 /share/stats/[토큰]/report: A4 인쇄 CSS, 브라우저 'PDF로 저장' (헤드리스 Chrome으로 1쪽 확인)
  - 집계는 관리자 화면과 같은 함수(lib/link-page-stats.ts computeLinkPageStats). 연락처(리드) 수·목록은 넣지 않음
  - 토큰: 무작위 43자, DB에는 sha256 해시 + AES-GCM 암호화 원문(관리자 재복사용)만 저장. 키는 LINK_STATS_SECRET 또는 JWT_SECRET에서 HKDF 파생
  - 끊김·만료·없는 토큰은 같은 404. IP당 분당 30회, 없는 토큰 10분 10회 제한(서버 메모리)
  - /share 헤더: no-referrer, X-Robots-Tag noindex, no-store. /share에서는 GA·SWG·Vercel 분석 미적용(src/components/RootScripts.tsx로 이동)
  - stats_share_links 테이블 (마이그레이션 20261119100000, 로컬 DB 적용함, 운영은 Vercel 빌드에서 자동 적용)
  - 로컬 확인: 관리자 화면과 숫자 일치, 끊은 링크 404, 공유 페이지 조회 후 link_page_events·daily 변화 없음, 375/390/1440/1920 가로 넘침 없음
- 완료: 조직 프로필 추가 자료(제안서 등) 최대 5개, companies.extra_materials (커밋 11437d3)
- 완료: 업로드 파일명 한글 유지(공백·기호만 하이픈), 공개 주소 경로 조각별 인코딩 (커밋 1e1ad6d)
- 완료: 관리자 화면 이동 진행 막대·로딩 뼈대 (커밋 c89832a), 분석 화면 휴대폰 가로 밀림 해결 (커밋 71d5910)
- 이전 완료: 관리자 패스키 로그인 (4a0952d), 관리자 모바일 대응 (348675e), KME 시연 전 P0 점검 (cb26953까지)
- 미커밋(의도적): next-env.d.ts, tsconfig.tsbuildinfo (next dev 생성), AGENTS.md, .claude/

## 다음 할 일 (우선순위 순)
### 배포 후 운영 확인 (사람)
1. Vercel 배포 성공·migrate 단계 확인 (stats_share_links, extra_materials 열)
2. 공유 링크: 조직에서 만들기 → 로그아웃 브라우저·휴대폰으로 열기 → 같은 기간 관리자 숫자와 비교 → 끊기 후 404
3. 추가 자료: 조직 편집에서 '제안서' 행 저장 → 공개 프로필 소개자료 옆 버튼 확인
4. 한글 이름 PDF 업로드 시 파일명 유지 확인. 기존 image*.pdf는 보관함 이름 변경으로 정리할지 결정
5. 기존 P0 남은 확인: 운영 테스트 리드 1건(이종섭, 2026-11-11 16:53 KST) 삭제 SQL은 사람 승인 후 실행
   - 확인: SELECT id, name, created_at FROM link_page_leads WHERE name = '이종섭' AND created_at BETWEEN '2026-11-11 07:50:00' AND '2026-11-11 07:56:00';  (created_at은 UTC)
   - 삭제: DELETE FROM link_page_leads WHERE id = <위에서 확인한 id>;
6. 비관리자 휴대폰으로 /go/zindok → 문의하기 → 통계 '문의하기 클릭' +1 확인

### P1 — 참가사 파일럿
1. 새 연락처 실시간 알림: 1차 이메일, 2차 문자/알림톡 검토
2. 참가사 로그인·리드(연락처) 목록 공유 — 이번 공유 링크는 익명 통계만
3. 제품·카탈로그 블록 (이미지·이름·설명·링크 카드, '제품' 종류로 집계)
4. 요일×시간 히트맵 (지금은 0~23시 막대만, 최근 90일 원본 기록 기준)

### P2 — 파일럿 이후
- 연락처 상태·메모, 현장용 간편 폼, 주최사 합산 화면, 리드-행동 연결, 매거진 카드 썸네일 작은 버전 사용

### 하지 않기로 한 것 (이번 범위)
- /go 리다이렉트 방식 변경 (302 + no-store 유지, 코드 주석 '301 금지'), PDF 생성 라이브러리, 결제

## 결정 사항
- 공유 링크는 조직 단위·유효 1개, 새로 발급하면 이전 링크 즉시 끊김 — 이유: 링크 페이지가 조직당 하나
- 토큰 원문 대신 해시 + 암호화 원문 저장(권장안 B) — 이유: 관리자가 언제든 같은 링크를 다시 복사, DB만 유출돼도 토큰 모름. 서버 비밀값을 바꾸면 복사만 멈추고 링크는 계속 열림(재발급 필요)
- 외부 이동 비율 = (외부 사이트 + SNS 클릭) ÷ 전체 링크 클릭 — 외부 사이트에는 소개자료·제안서 PDF 등도 포함되어 화면에 '홈페이지·SNS·자료 등'으로 표기
- 공유 페이지의 '전체' 기간은 첫 집계일~오늘, 366일 제한 없음. 직접 지정은 최대 366일
- sitemap·robots.txt는 바꾸지 않음 — 이유: 기존 SEO 설정 유지, noindex 헤더가 크롤러에 보이도록 Disallow 안 함
- GA 제외는 루트 layout에서 headers() 대신 클라이언트 usePathname — 이유: headers()를 쓰면 모든 페이지가 동적 렌더링이 됨
- 행사 구분은 QR 코드 여러 개가 아니라 기간으로 (11/16 결정 유지)
- 링크 페이지 noindex 유지, 내부 트래픽 판정은 서버 auth_token 기준 (기존)

## 주의 · 막힌 점
- 이번 작업 규칙: pnpm build 금지(검증은 pnpm dev, 타입은 pnpm tsc --noEmit). DB 스키마·데이터 변경은 사용자 승인 후에만
- .next/types가 예전 빌드 것이면 tsc가 'Route ... never' 오류를 냄 → `pnpm exec next typegen`으로 경로 타입만 다시 생성
- 공유 페이지 유입 경로 이름: /go 코드에 용도 이름(label)이 없으면 코드가 그대로 보임(예: zindok). 참가사용으로는 용도 이름 입력 권장
- 시간대별 방문은 원본 이벤트(90일 보관) 기준이라 일자별 합계와 다를 수 있음 (로컬 8 vs 7)
- 요청 제한은 서버 인스턴스별 메모리. 대량 시도는 Vercel Firewall 필요
- 로컬 테스트 데이터: 진독(233)의 공유 링크 1개(끊김 상태), 조직 246 '추가자료 테스트 조직'(slug test-extra-materials) — 지우려면 사람이 승인 후 DELETE
- 개발 모드(next dev)는 proxy가 모든 브라우저에 로컬 관리자 쿠키를 넣어 링크 페이지 통계가 내부 트래픽으로 빠짐. 비관리자 집계 확인은 쿠키 없는 curl로
- 로컬·프리뷰·운영이 같은 NCP 버킷을 씀 → 테스트 업로드는 끝나면 지움
- 운영 DB 조회는 에이전트 권한에서 막힘. 운영 데이터 확인은 사람이
- 공개 프로필의 문의 버튼 순서(문의 URL → 메일 → 전화)가 링크 페이지(전화 우선)와 다름 — 맞출지 결정 필요
- 패스키: 로컬 Windows Hello 동작 미확인. RP ID는 호스트별이라 운영에서 다시 등록해야 함
- next dev는 같은 폴더에서 두 번째 서버를 허용하지 않음. 스키마 변경 후 dev 서버 재시작 필요

## 핵심 파일
- src/lib/link-page-stats.ts — 링크 페이지 통계 집계(관리자·공유 공통), 시간대별·첫 집계일
- src/lib/stats-share.ts — 공유 토큰 생성·해시·암호화, resolveShareToken, 공개용 통계 변환
- src/actions/admin/stats-share-actions.ts — 공유 링크 발급·변경·끊기 (requireAdmin)
- src/app/admin/companies/[id]/link-analytics/StatsSharePanel.tsx — 관리자 공유 링크 패널
- src/app/share/ — 공유 페이지·리포트·404·layout(noindex), stats/[token]/load-shared-stats.ts(기간·요청 제한)
- src/components/share-stats/ — 공유 화면 조각(KPI·막대 그래프·목록), 인쇄 버튼
- src/components/RootScripts.tsx — GA·SWG·Vercel 분석 (/share 제외)
- src/lib/org-materials.ts — 추가 자료 정리, src/lib/storage-media.ts storageFileStem — 업로드 파일명
- src/components/admin/NavProgress.tsx — 관리자 진행 막대
- src/app/api/track/route.ts — 방문·클릭 수집(봇·관리자 제외), src/app/go/[code]/route.ts — QR 단축 경로

## 확인 방법
- 개발 DB 접속: `npx prisma migrate status` → 실패하면 `pnpm db:tunnel` 백그라운드 실행
- pnpm dev → /admin/companies/233/link-analytics 에서 공유 링크 만들기 → 공유 페이지·요약 리포트 열기
- 헤더: curl -D - http://localhost:3000/share/stats/<토큰> (Referrer-Policy·X-Robots-Tag·Cache-Control)
- 인쇄 확인: 헤드리스 Chrome --print-to-pdf 로 리포트 주소 출력
- pnpm exec tsc --noEmit
