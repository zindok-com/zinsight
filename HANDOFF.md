# HANDOFF — zinsight
갱신: 2026-11-20 (KST) · PC: desktop-d7ttin2 · 브랜치: main

## 목표
조직 외부 링크를 "공식 채널 목록" 하나로 데이터화. 프로필 헤더·진사이트 카드·JSON-LD sameAs가 같은 목록을 쓰고, 채널 종류(집계 그룹)로 리포트 집계가 가능하게.
(이전 목표: 진사이트 정체성 1차 — 커밋 60c20a3 푸시, 운영 확인 항목은 아래 '이전 작업')

## 현재 상태
- 완료: 공식 채널 구현 1차 (커밋 d2bd155, 푸시 안 함). tsc 통과, 검증용 DB에서 이전·화면·클릭 흐름 확인
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
- 스크린샷(미커밋, 로컬): docs/screenshots/official-channels-2026-11-20/ (4화면 × 375/390/1440/1920 = 16장 + 붙여넣기 흐름 1장), 가로 넘침 0

## 다음 할 일 (우선순위 순)
1. 사용자 검토 후 푸시 → Vercel 배포(마이그레이션 자동 적용)
2. 배포 후 사람이 운영 DB에서: 검증 쿼리(docs/migrations/org-channels-verify.sql) 실행 → 이전 스크립트 계획 출력 확인 → --apply → 검증 쿼리 재실행 비교
   - 실행: npx ts-node -T -O '{"module":"commonjs","moduleResolution":"node"}' scripts/migrate-org-channels.ts [--apply] [--org 233]
3. 개발 DB(터널 zinsight_db)에도 마이그레이션 적용 필요(사용자 승인 후). 미적용 상태로 터널 DB에 pnpm dev 하면 새 테이블이 없어 프로필·카드가 오류
4. 공유 통계 화면에 getChannelGroupClicks 연결(별도 작업)
5. backlinks·organization_links 열/테이블 삭제는 운영 이전 확인 후 다음 작업
6. (이전) 링크 페이지 '문의하기'/'연락처 남기기' 통합안 결정, 대표 확정 후 site.ts 교체

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
- 터널 DB(zinsight_db)는 .env 주석상 'Dev DB'. 이번 세션 분포 조회는 이 DB 기준(조직 12, 카드 저장 링크 0, 채널 클릭 3). 운영 분포는 미확인
- 로컬 검증: Docker 컨테이너 zinsight-verify-db(MariaDB 10.6, 127.0.0.1:3317, 개발 DB 덤프+새 마이그레이션). .env.development.local이 pnpm dev를 이 DB로 돌림(.git/info/exclude 처리). 터널 DB로 돌아가려면 그 파일 삭제
- 개발 DB에 스키마 드리프트 있음(organization_invites·submissions 인덱스·FK 이름). 이번 마이그레이션에는 넣지 않음
- 이전 스크립트는 기존 열을 지우거나 바꾸지 않음(되돌리기용). auto:{n}은 당시 문구가 맞을 때만 매핑, 안 맞으면 보고만
- 등록 폼·조직 추가 버튼은 입력 화면 그대로(제목+URL), 서버에서 채널로 변환
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit), DB 스키마·데이터 변경은 사용자 승인 후
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
