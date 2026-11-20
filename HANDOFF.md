# HANDOFF — zinsight
갱신: 2026-11-20 03:35 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (origin/main과 같음)

## 목표
공식 채널 목록 데이터화 + 진사이트 카드·영상 통계 정리 — 구현·운영 이전까지 완료. 남은 것은 운영 확인과 후속 작업
(이전 목표: 진사이트 정체성 1차 — 커밋 60c20a3, 운영 확인 항목은 아래 '이전 작업')

## 현재 상태
- 완료: 공식 채널 구현 (커밋 d2bd155)
  - 새 테이블 organization_channels(채널)·organization_card_items(카드 표시 설정). organization_links는 읽기 전용 유지
  - 채널 종류 14개 코드 상수(src/lib/org-channels.ts). 틱톡·티스토리·네이버 카페는 '기타'
  - URL 정리: https, 추적·언어 파라미터 제거, 모바일 주소→일반, 끝 / 제거
  - 프로필 편집 '공식 채널' 섹션(자동 종류 선택·중복/오류 안내·대표 홈페이지·소개자료 보관함), '진사이트 카드 링크'는 순서·노출·형태만
  - 클릭 키 ch:{채널 id}, 그룹별 클릭 getChannelGroupClicks(화면 미반영), sameAs는 sameAs 종류의 정리된 주소
  - 채널 저장 시 company_url·backlinks·brochure_url·extra_materials에도 기록(호환), 채널 없는 조직은 기존 방식(auto:{n})
- 완료: 운영 반영 (2026-11-20)
  - 마이그레이션 20261120000000은 Vercel 빌드로 적용 확인(테이블 존재)
  - 데이터 이전은 사용자가 직접 --apply: 13개 조직 채널 36개, 진독 auto: 13건 → ch:, 클릭 합계 35 → 35, 매핑 안 한 클릭 없음, 기타 5건
  - 운영 사이트: 진독 카드 키 ch:1~4, sameAs = zindok.com·블로그·스레드
  - 개발 DB(터널)도 같은 이전 완료
- 완료: 카드 하단 바 통합 B안 (커밋 0455995) — 연락 수단 있으면 [문의하기] + '연락처 남기기 →' 글자 링크, 없으면 [연락처 남기기] 주 버튼. 키 inquiry·lead 유지. 운영 진독 375px 확인
- 완료: 소개 영상 통계 자동재생/시청 분리 (커밋 48c6f57)
  - video_auto = 자동재생 시작(노출), video = 시청(직접 재생·소리 켬·전체화면·절반 이상 보인 채 10초, 짧은 영상은 끝까지)
  - 유튜브 자동재생은 iframe 누름 또는 보인 채 10초(근사 — 재생 여부 확인 불가)
  - GA: video_autoplay / video_play(watch_trigger, autoplay). 관리자·공유 통계 문구 '영상 시청', 자동재생 횟수 표시
  - VIDEO_WATCH_SINCE=2026-11-20 이전 video 기록은 자동재생 포함(나눌 수 없음, 관리자 화면에 안내)
  - 확인: 헤드리스 Chrome에서 카드 영상 4가지 경우 확인. 프로필 #play·유튜브는 미확인(개발 DB에 영상 있는 조직 없음)
- 스크린샷(로컬만, docs/screenshots/는 .gitignore): docs/screenshots/official-channels-2026-11-20/

## 다음 할 일 (우선순위 순)
1. (사용자) 운영 검증 쿼리(docs/migrations/org-channels-verify.sql) 재실행 — 기대: channels = src_links(뉴데이 0), 진독 clicks_auto 0·clicks_ch 13·clicks_total 35, 대표 중복 0행
2. 배포 후 운영 진독 카드를 휴대폰으로 열어 link_page_daily에 video_auto → 10초 뒤 video 기록되는지 확인. 프로필 /insight-radar/zindok#play도
3. 공유 통계 화면에 getChannelGroupClicks 연결(외부 이동 비율을 그룹별로) — 별도 작업
4. 운영 이전 확인 후 backlinks 열·organization_links 테이블 삭제 마이그레이션 — 별도 작업, 사용자 승인 필요
5. (이전) 대표 확정 후 site.ts 교체

## 결정 사항
- 채널 종류는 코드 상수 — 이유: 아이콘·판별 규칙이 코드에 있어야 함
- 같은 종류 여러 개 허용, 대표 홈페이지만 1개 — 이유: 계정 2개·서비스 사이트 여러 개 존재
- 소개자료도 채널(brochure, sameAs 제외) / 스마트스토어 상품 주소 → 스토어 주소 / 네이버 카페 '기타' — 사용자 승인
- 채널 삭제는 소프트 삭제 — 이유: 지난 ch:{id} 클릭의 종류 집계 유지
- organization_links는 바꾸지 않고 새 테이블 — 이유: 데이터 손실 방지
- 카드 하단은 주 버튼 하나 + 보조 글자 링크(B안) — 사용자 선택
- 영상 자동재생은 유지하고 통계 정의만 변경(A안, 시청 기준 권장안) — 이유: 전시회·QR 모바일 유입에 자동재생 효과, 숫자 의미는 분리로 확보

## 주의 · 막힌 점
- 운영 DB: 도커 안 MariaDB. 사용자가 Termius로 직접 작업(docker exec -it <컨테이너> mariadb ...). 에이전트는 운영 DB에 접속하지 않음
- 운영 DB 스크립트 실행: PowerShell에서 $env:DATABASE_URL(운영)·$env:TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' 설정 후 npx ts-node -T scripts/... (공인 주소 직접 접속 가능, 포트 포워딩 불필요). 끝나면 Remove-Item Env:DATABASE_URL
- 터널(pnpm db:tunnel, ssh zinsight-db)은 개발 DB 전용. 개발 DB에 스키마 드리프트 있음(organization_invites·submissions 인덱스·FK 이름)
- .env 주석에 운영 DB 접속 정보가 평문으로 있음(커밋 안 됨). 비밀번호 교체 검토 권장
- 이전 스크립트는 기존 열을 바꾸지 않음(되돌리기용). 이미 채널 있는 조직은 건너뜀(재실행 안전)
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit), DB 스키마·데이터 변경은 사용자 승인 후
- 브라우저 패널이 숨겨지면 CSS 전환·IntersectionObserver·rAF가 멈춤 → 영상·애니메이션 검증은 헤드리스 Chrome(CDP, --autoplay-policy=no-user-gesture-required)
- 관리자 화면 검증은 dev 전용 로컬 테스트 토큰 쿠키(src/lib/token-config.ts)

## 이전 작업 — 남은 확인
- 정체성 1차 운영 확인(메인 제목·헤더 메뉴·푸터·/about·/services noindex·parentOrganization), tagline SQL 승인
- 전시회 패키지: 공유 링크·추가 자료·한글 파일명 확인, 운영 테스트 리드 삭제 승인

## 핵심 파일
- src/lib/org-channels.ts — 채널 종류·판별·URL 정리·검사·이전 전 값 변환·sameAs·헤더 목록
- src/lib/org-channel-store.ts — saveOrgChannels(소프트 삭제·호환 열 기록), ACTIVE_CHANNELS
- src/lib/org-link-page.ts — 카드 링크(cardLinksFromChannels / legacyCardLinks)
- src/lib/link-page-stats.ts — 통계 합계(videoAutoStarts·VIDEO_WATCH_SINCE), getChannelGroupClicks
- src/app/api/track/route.ts — 수집(view·click·video·video_auto)
- src/components/public/insight-radar/video-watch.ts — 시청 판정 훅 useVideoWatch
- src/components/public/insight-radar/links/LinkPageVideo.tsx, profile/ProfileVideo.tsx — 영상
- src/app/(links)/insight-radar/[id]/links/page.tsx, links/LinkPageLeadForm.tsx — 카드·하단 바
- src/app/admin/companies/[id]/OfficialChannelsEditor.tsx, OrgLinksManager.tsx, link-analytics/ — 관리자
- scripts/migrate-org-channels.ts, docs/migrations/org-channels-verify.sql — 이전·검증

## 확인 방법
- pnpm db:tunnel(개발 DB) → pnpm dev → /admin/companies/233, /insight-radar/zindok, /insight-radar/zindok/links, /admin/companies/233/link-analytics
- 카드 data-link-key="ch:{id}", JSON-LD Organization.sameAs
- pnpm exec tsc --noEmit
