# HANDOFF — zinsight
갱신: 2026-11-26 22:10 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (origin/main과 같음, 모두 push)

## 목표
네이버 기사 수집을 들어내고 외부 수집 기사 데이터까지 완전히 제거(저작권). 배포 두 번: 배포 1 코드만 → 운영 확인 → 배포 2 테이블 삭제. 계획·현황: docs/plan-naver-ingest-removal.md

## 현재 상태
- 완료·push: /services 첫 문단 문장마다 한 줄 (a140ee7)
- 완료·push: 배포 1 — 수집·키워드·기사 관리·내보내기 화면·액션 삭제, 프로필·기사 수·최근 활동일·AEO에서 외부 기사 제외, 관리자 대시보드·사이드바·조직 편집 정리, project_data의 related_articles 삭제, 문서·.env.example 네이버 키 삭제 (ca03c7a)
  - pnpm dev로 메인·/insight-radar·프로필(bethemuse, zindok)·/admin·조직 편집(243, 246) 확인, /admin/articles 404 확인. 스크린샷 docs/screenshots/naver-removal-2026-11-26 (git 추적 안 함)
  - tsc: src 오류 없음(.next/types의 지운 페이지 참조만 남음 — dev 서버가 다시 만들면 사라짐, 추정)
- 완료·push(2026-11-26, 사용자 승인): 배포 2 — 스키마에서 모델 4개·관계 필드 삭제, 마이그레이션 20261126210000(DROP TABLE IF EXISTS 4개). 개발 DB 적용·화면 200 확인 (8db9dcc). 운영 배포 정상(사용자 확인 2026-11-26)
- 완료·push: 메인 '이렇게 작동합니다' B안 — 단계별 미니 화면 + 화면 진입 시 1회 모션 (src/components/public/home/AiCitationCases.tsx HowItWorks, RevealOnView.tsx, globals.css의 hiw-* 규칙). 데스크톱·모바일 확인, 서버 HTML엔 내용 그대로. 1단계 예시 질문 문구 "우리 동네 방수 업체 추천해줘"는 임시(사용자 확인 필요). 움직임 줄이기 설정 환경은 실제로 켜서 보지는 않음
- 개발 DB에는 이번과 무관한 기존 스키마 차이가 있음(organization_invites·organization_submissions의 외래 키·인덱스 이름, 컬럼 정밀도). 손대지 않음

## 다음 할 일 (우선순위 순)
1. (완료) 배포 1 운영 정상(사용자 확인 2026-11-26)
2. (완료) 배포 2 운영 적용·배포 정상(사용자 확인 2026-11-26)
3. (완료) Vercel 환경변수 NAVER_CLIENT_ID·NAVER_CLIENT_SECRET 삭제(사용자 2026-11-26)
4. (사용자) 네이버 개발자센터 앱 삭제 — 완료 여부 미확인
5. 이전 HANDOFF에서 이어진 사용자 할 일: 문의 메일 환경변수(RESEND_API_KEY 등) 확인, DB 문구 수정(H14·L17·C12), 대표 결정 C1~C12 (docs/copy-audit-2026-11.md)

## 결정 사항
- C안(외부 기사 데이터까지 삭제), 배포 2회 분리 — 이유: 저작권(사용자 2026-11-26)
- 배포 2 전 덤프 뜨지 않음 — 이유: 수집 기사 데이터를 보관하지 않기로(사용자 2026-11-26)
- AEO 조직 점수의 newsArticleCount는 0으로(파라미터는 기사 단위 진단이 써서 남김). AEO 데이터는 의미 없는 값이라 정리는 보류(사용자)
- 대시보드 카드는 등록 지역·등록 조직·발행 매거진 기사

## 주의 · 막힌 점
- project_data의 수집 기사 제목·요약은 git 이력에 남아 있음(이력 정리는 사용자 판단)
- axios 의존성은 이제 쓰는 곳 없음(남겨 둠)
- sed로 고친 파일은 dev 서버 SSR이 변경을 못 잡을 때가 있음(사이드바에서 하이드레이션 불일치) → 에디터/Edit로 다시 저장하면 해결
- 운영 DB는 접속하지 않음. DROP 마이그레이션은 되돌릴 수 없음(덤프 없이 진행하기로 함)
- dev 서버 실행 중 next typegen 금지, pnpm build 금지

## 핵심 파일
- docs/plan-naver-ingest-removal.md — 배포 1 내역, 배포 2 대상·순서·덤프 명령·자동 마이그레이션 동작
- src/actions/insight-radar-actions.ts — 프로필·카드·통계(매거진 기사만)
- src/actions/aeo-actions.ts — AEO 점수(newsArticleCount)
- src/app/admin/companies/[id]/CompanyArticlesPanel.tsx — 조직 편집의 연결 매거진 기사
- prisma/schema.prisma — 배포 2에서 지울 모델 4개와 Region·Organization 관계 필드

## 확인 방법
- pnpm exec tsc --noEmit
- pnpm dev → /, /insight-radar, /insight-radar/bethemuse, /admin, /admin/companies/243, /admin/articles(404)
