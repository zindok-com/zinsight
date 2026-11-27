# HANDOFF — zinsight
갱신: 2026-11-27 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (origin/main과 같음, 모두 push)

## 목표
네이버 기사 수집 제거(저작권)는 끝남. 이어서 메인 화면 다듬기. 기록: docs/plan-naver-ingest-removal.md

## 현재 상태
- 완료·운영 정상: 네이버 기사 수집 제거
  - 배포 1: 코드 제거 (ca03c7a)
  - 배포 2: 외부 기사 테이블 4개 DROP. 마이그레이션 20261126210000 (8db9dcc)
  - Vercel의 NAVER_CLIENT_ID·NAVER_CLIENT_SECRET 삭제(사용자)
- 완료·push, 운영 확인 전: 메인 '이렇게 작동합니다' 보완 (e978aa2)
  - 사용자 피드백: 부제 줄바꿈 어색, 운영에서 모션이 안 보임
  - 원인: 코드는 운영에 배포돼 있었음. 화면 아래 끝에 30%만 걸쳐도 재생이 시작되고 짧아서 보기 전에 끝남
  - 부제는 데스크톱에서 "정리해," 뒤 줄바꿈, 모바일은 text-balance
  - 재생 시작을 화면 위 75% 선으로, 카드 이동·시간 늘림, 미니 화면은 카드 등장 뒤, 문의 강조 2회(약 3초)
  - 숨겨진 미리보기 창이라 실제 재생은 눈으로 보지 못함(계산된 CSS 값만 확인)
- 완료·push: 메인 '이렇게 작동합니다' B안 (c2acd43)
  - 단계별 미니 화면(검색·AI 답변 → 기업 프로필 → 홈페이지·문의)
  - 화면에 들어올 때 한 번 재생되는 모션(약 2.5초)
  - 로컬 데스크톱(1280)·모바일(375)에서 확인. 서버 HTML에는 내용이 그대로 있음(숨김은 스크립트가 처리)
  - 움직임 줄이기 설정을 실제로 켜서 보지는 않음
- 완료·push: .agents/AGENTS.md DB 규칙 변경(c7eea6b)
  - UPDATE·DELETE도 에이전트가 실행
  - 개발 DB는 바로, 운영 DB는 대상·SQL·행 수를 알리고 승인 후
  - DROP·TRUNCATE는 덤프 후 승인
  - 에이전트 메모리도 이 규칙으로 갱신함

## 다음 할 일 (우선순위 순)
1. (사용자) 운영 메인에서 '이렇게 작동합니다' 모션·줄바꿈·모바일 화면 다시 확인 (e978aa2 배포 후)
2. (사용자) 1단계 예시 질문 문구 확정. 지금은 임시 문구 "우리 동네 방수 업체 추천해줘" — AiCitationCases.tsx SearchVisual
3. (사용자) 네이버 개발자센터 앱 삭제. 완료 여부 미확인
4. (사용자) 루트 CLAUDE.md에 "DB 작업" 절 추가 여부. AGENTS.md가 이 절을 근거로 가리키지만 현재 루트 CLAUDE.md에는 없음
5. 이전 HANDOFF에서 이어진 사용자 할 일
   - 문의 메일 환경변수(RESEND_API_KEY 등) 확인
   - DB 문구 수정(H14·L17·C12)
   - 대표 결정 C1~C12 (docs/copy-audit-2026-11.md)

## 결정 사항
- 외부 수집 기사는 데이터까지 삭제, 덤프 없음 — 이유: 저작권, 보관하지 않기로(사용자)
- AEO 조직 점수의 newsArticleCount는 0으로 둠, AEO 데이터 정리는 보류 — 이유: 의미 없는 값(사용자)
- '이렇게 작동합니다'는 B안(미니 화면) + 1회 모션
  - 무한 반복 금지, 새 라이브러리 없이 CSS와 IntersectionObserver만 사용
  - Lottie 쓰지 않음 — 이유: 메인 무게, 미니 화면과 겹침

## 주의 · 막힌 점
- RevealOnView: 마운트 시 섹션 윗부분이 화면 높이 60% 위까지 올라와 있으면 바로 재생, 아니면 숨겼다가 윗부분이 화면 위 75% 선을 넘으면 재생(rootMargin -25%)
  - 기준을 바꾸면 첫 화면에서 모션이 미리 끝나 버릴 수 있음
- 개발 DB에는 이번과 무관한 기존 스키마 차이가 있음
  - organization_invites·organization_submissions의 외래 키·인덱스 이름, 컬럼 정밀도. 손대지 않음
- git 이력에 project_data의 수집 기사 제목·요약이 남아 있음. 이력 정리는 사용자 판단
- axios 의존성은 쓰는 곳 없음(남겨 둠)
- sed로 고친 파일은 dev 서버 SSR이 변경을 못 잡을 때가 있음 → Edit로 다시 저장
- dev 서버 실행 중 next typegen 금지, pnpm build 금지

## 핵심 파일
- src/components/public/home/AiCitationCases.tsx — 메인 AI 인용 사례 / 대체 3단계(HowItWorks, 미니 화면 3종)
- src/components/public/home/RevealOnView.tsx — 화면 진입 시 1회 모션 트리거(data-reveal)
- src/app/globals.css — hiw-* 모션 규칙, 움직임 줄이기 대응
- src/config/site.ts — aiCitations(공개 동의된 사례가 생기면 3단계 대신 사례 노출)
- .agents/AGENTS.md — DB·마이그레이션·커밋 규칙
- docs/plan-naver-ingest-removal.md — 네이버 수집 제거 기록

## 확인 방법
- pnpm exec tsc --noEmit (src 오류만 확인)
- pnpm dev → / 에서 '이렇게 작동합니다'까지 스크롤(모션 한 번), 375px 폭도 확인
