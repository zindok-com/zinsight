# HANDOFF — zinsight
갱신: 2026-11-20 (KST) · PC: desktop-d7ttin2 · 브랜치: main

## 목표
조직 외부 링크를 "공식 채널 목록" 하나로 데이터화. 프로필 헤더·진사이트 카드·JSON-LD sameAs가 같은 목록을 쓰고, 채널 종류(집계 그룹)로 리포트 집계가 가능하게.
(이전 목표: 진사이트 정체성 1차 — 커밋 60c20a3 푸시, 운영 확인 항목은 아래 '이전 작업')

## 현재 상태
- 완료: 공식 채널 구현 1차 (커밋 d2bd155, origin/main 푸시 2026-11-20). tsc 통과
- 완료: 개발 DB(터널)에 마이그레이션 적용 + 이전 스크립트 --apply (클릭 합계 전후 동일, auto 3건 → ch:, 기타 5건)
  - 스키마: organization_channels(채널), organization_card_items(카드 표시 설정) 새 테이블. 기존 organization_links는 읽기 전용으로 유지
  - 마이그레이션 파일 prisma/migrations/20261120000000_add_organization_channels (운영 반영은 Vercel 빌드 migrate)
  - 채널 종류 14개 코드 상수(src/lib/org-channels.ts). 틱톡·티스토리는 '기타'(사용자 결정)
  - URL 정리: https, utm_*·hl·fbclid·igshid·igsh·si·feature·ref·nl-query·nl-ts-pid 등 제거, 모바일 주소→일반, 끝 / 제거
  - 프로필 편집: '공식 채널' 섹션(붙여 넣으면 종류 자동 선택, 칸 벗어나면 정리, 중복·오류 안내, 대표 홈페이지, 소개자료 보관함). 기존 백링크·소개자료·추가 자료 입력은 이 섹션으로 통합
  - 링크 페이지 관리 → '진사이트 카드 링크': 채널별 순서·노출·형태만. 새 채널은 기본 형태로 맨 뒤 자동 노출
  - 클릭 키 ch:{채널 id}. 그룹별 클릭 함수 getChannelGroupClicks (lib/link-page-stats.ts, 화면 미반영)
  - JSON-LD sameAs = sameAs 포함 종류의 정리된 주소. 진독: zindok.com, 블로그, 스레드(?hl=ko 제거)
  - 채널 저장 시 company_url·backlinks·brochure_url·extra_materials에도 같은 값 기록(기존 코드 호환)
  - 채널 없는 조직(이전 전)은 기존 방식 그대로 표시(auto:{n} 키)
- 완료: 진사이트 카드 하단 바 통합 B안 (커밋 0455995, 푸시). 연락 수단 있으면 [문의하기(전화 우선)] + '연락처 남기기 →' 글자 링크, 없으면 [연락처 남기기] 주 버튼. 통계 키 inquiry·lead 유지. tsc 통과
  - 운영 진독 /links 375px에서 [문의하기] + '연락처 남기기 →' 배치 확인
- 완료: 운영 DB 데이터 이전 (2026-11-20, 사용자가 직접 --apply). 13개 조직 채널 36개, 진독 auto: 13건 → ch:, 클릭 합계 35 → 35, 매핑 안 한 클릭 없음. 기타 5건은 개발 DB와 동일
  - 운영 사이트 확인: 진독 카드 키 ch:1~4, sameAs = zindok.com·블로그·스레드
- 완료: 소개 영상 통계 자동재생/시청 분리 (커밋 48c6f57). 자동재생 시작 = video_auto(노출), 시청 = video(직접 재생·소리 켬·전체화면·절반 이상 보인 채 10초, 짧은 영상은 끝까지). 유튜브 자동재생은 iframe 누름 또는 보인 채 10초(근사)
  - 훅 src/components/public/insight-radar/video-watch.ts → LinkPageVideo·ProfileVideo. GA: video_autoplay / video_play(watch_trigger, autoplay)
  - 관리자·공유 통계 '영상 시청'으로 문구 변경, 자동재생 횟수 표시. VIDEO_WATCH_SINCE=2026-11-20 이전 video 기록은 자동재생 포함(나눌 수 없음)
  - 확인: 헤드리스 Chrome 375/1440에서 카드 영상 4가지 경우(자동재생 대기·화면 밖·소리 켬·클릭) 확인. 프로필 #play·유튜브는 브라우저 미확인(개발 DB에 영상 있는 조직 없음)
- 스크린샷(로컬, docs/screenshots/는 .gitignore): docs/screenshots/official-channels-2026-11-20/ (4화면 × 375/390/1440/1920 = 16장 + 붙여넣기 흐름 1장), 가로 넘침 0

## 다음 할 일 (우선순위 순)
1. (사용자) 운영 검증 쿼리 재실행 결과 확인 — 기대: channels = src_links, 진독 clicks_auto 0·clicks_ch 13
2. 배포 후 운영 진독 카드에서 영상 자동재생 → video_auto, 10초 후 video 기록되는지 link_page_daily로 확인
3. 공유 통계 화면에 getChannelGroupClicks 연결(별도 작업)
4. backlinks·organization_links 열/테이블 삭제는 운영 이전 확인 후 다음 작업
5. (이전) 대표 확정 후 site.ts 교체

## 결정 사항
- 채널 종류는 DB 마스터가 아니라 코드 상수 — 이유: 아이콘·판별 규칙이 코드에 있어야 함, 추가는 항목 하나
- 같은 종류 여러 개 허용, 대표 홈페이지만 1개 — 이유: 계정 2개·서비스 사이트 여러 개 존재
- 소개자료도 채널(brochure, sameAs 제외)로 통합 — 사용자 승인(추천안 A)
- 스마트스토어 상품 주소는 이전 시 스토어 주소로 — 사용자 승인
- 네이버 카페는 '기타' — 요구 목록 유지
- 채널 삭제는 소프트 삭제 — 이유: 지난 ch:{id} 클릭의 종류 집계 유지
- 기존 organization_links는 바꾸지 않고 새 테이블 — 이유: 운영 DB 행 수 미확인, 데이터 손실 방지
- '기타' 판별 5건: 브라보캠프 네이버 카페, 나리보 narrivo.io·biz.narrivo.io, 예스넷 aicodai.com·qnector.kr

## 주의 · 막힌 점
- 운영 DB 작업은 사용자가 Termius(도커 MariaDB, docker exec)로 직접. 스크립트는 PowerShell에서 $env:DATABASE_URL(운영)·$env:TS_NODE_COMPILER_OPTIONS 설정 후 실행
- 터널 DB(zinsight_db)는 ssh zinsight-db → 집 서버 MariaDB = 개발 DB. 운영 DB는 다른 호스트(.env 주석 'Real DB'). 분포 조회는 개발 DB 기준(조직 12, 카드 저장 링크 0, 채널 클릭 3)
- 개발 DB에 스키마 드리프트 있음(organization_invites·submissions 인덱스·FK 이름). 이번 마이그레이션에는 넣지 않음
- 이전 스크립트는 기존 열을 지우거나 바꾸지 않음(되돌리기용). auto:{n}은 당시 문구가 맞을 때만 매핑, 안 맞으면 보고만
- 등록 폼·조직 추가 버튼은 입력 화면 그대로(제목+URL), 서버에서 채널로 변환
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit), DB 스키마·데이터 변경은 사용자 승인 후
- 브라우저 패널이 숨겨져 있으면 CSS 전환·IntersectionObserver·rAF가 멈춤 → 영상·애니메이션 검증은 헤드리스 Chrome(CDP)으로
- 모바일 스크린샷은 헤드리스 Chrome + CDP(Emulation.setDeviceMetricsOverride). 관리자 화면은 dev 전용 로컬 테스트 토큰 쿠키

## 이전 작업 — 남은 확인
- 정체성 1차 운영 확인(메인 제목·헤더 메뉴·푸터·/about·/services noindex·parentOrganization), 진독 slug 'zindok' 확인, tagline SQL 승인
- 전시회 패키지: stats_share_links·extra_materials 마이그레이션 확인, 공유 링크·추가 자료·한글 파일명, 운영 테스트 리드 삭제 승인

## 핵심 파일
- src/lib/org-channels.ts — 채널 종류·판별·URL 정리·검사·이전 전 값 변환·sameAs·헤더 목록
- src/lib/org-channel-store.ts — saveOrgChannels(소프트 삭제·호환 열 기록), ACTIVE_CHANNELS
- src/lib/org-link-page.ts — cardLinksFromChannels, 이전 전 legacyCardLinks
- src/lib/org-links.ts — 이전 전 기본 목록(deriveDefaultOrgLinks), 클릭 키 패턴(ch: 추가)
- src/lib/link-page-stats.ts — getChannelGroupClicks
- src/app/admin/companies/[id]/OfficialChannelsEditor.tsx, OrgLinksManager.tsx — 관리자 화면
- src/actions/company-actions.ts updateCompany(channels), src/actions/admin/org-link-actions.ts saveOrganizationCardItems
- src/app/(public)/insight-radar/[id]/page.tsx — 헤더·소개자료·sameAs
- scripts/migrate-org-channels.ts, docs/migrations/org-channels-verify.sql — 이전·검증

## 확인 방법
- pnpm dev → /admin/companies/233, /insight-radar/zindok, /insight-radar/zindok/links
- JSON-LD: Organization.sameAs에 ?hl 없음, 카드 data-link-key="ch:{id}"
- pnpm exec tsc --noEmit
