# HANDOFF — zinsight
갱신: 2026-11-20 09:15 (KST) · PC: desktop-d7ttin2 · 브랜치: main

## 목표
진사이트 정체성 정비: "AEO 중심 + 고려·전환 단계 + 숫자로 측정", 대표 슬로건 "AI가 가장 먼저 찾는 기업으로 만듭니다".
1차는 문구·회사 정보·메뉴를 설정 한곳에서 바꾸는 구조 + 제안 문구 기본값. 확정 문구·주소·메뉴·가격은 대표 확정 후 설정값만 교체.
(이전 목표였던 전시회 참가사 패키지의 배포 후 확인·P1은 아래 '이전 작업'에 그대로 남김)

## 현재 상태
- 완료: 정체성·문구·메뉴 1차 (커밋 60c20a3, origin/main 푸시함 2026-11-19, 운영 화면은 아직 확인 안 함)
  - src/config/site.ts 한 파일: 회사 정보 6개(주소는 기존 값), 정체성 문구, 문의 연결(기본 zindok.com), 테크·마케팅 저널 노출, 현황 숫자 블록 노출, AI 노출 진단 버튼(꺼짐), 카드 이름 '진사이트 카드', 레이더 목록 제목·설명, /about·/services 공개 여부(false), 서비스 예시 2개, AI 인용 사례(빈 배열)
  - 메인: 영문 장식 문구 제거, 슬로건 h1, 버튼 [인사이트 레이더 둘러보기][진사이트 매거진 읽기], 사례 블록(비면 숨김)
  - 매거진 슬라이드: 서버 HTML에 원본 1벌, 복제본은 마운트 후 inert+aria-hidden (로컬 12개 → SSR 12, 화면 36 중 24 inert)
  - 헤더: 매거진 / 인사이트 레이더 / (서비스·진사이트 소개는 공개 후) / 문의. 푸터 '진사이트 소개'는 공개 전 zindok.com
  - /about, /services: noindex,nofollow, sitemap 제외 (published=true면 자동 포함·메뉴 노출)
  - JSON-LD: 메인 Organization에서 legalName·sameAs·alternateName 진독 제거 → parentOrganization(@id …/insight-radar/zindok#organization, 주소·전화·이메일·taxID). 기사 publisher에 @id 추가
  - 링크 페이지 제목 '{조직명} 진사이트 카드 | 진사이트', 하단 '진사이트 인사이트 레이더' → '진사이트'(→ /, 통계 key home 유지)
  - 개인정보처리방침 문의 이메일 cto@ → 대표 이메일(설정값)
  - 확인: tsc 통과, 메인·서비스·소개·레이더 목록·진독 카드 × 375/390/1440/1920 가로 넘침 없음
- 미커밋(의도적): next-env.d.ts, tsconfig.tsbuildinfo, AGENTS.md, .claude/, docs/screenshots/identity-2026-11-19/ (스크린샷 20장, 커밋 여부 미정)

## 다음 할 일 (우선순위 순)
1. 운영 배포 확인(사람): Vercel 배포 성공(스키마 변경 없음) → 메인 제목·영문 문구 없음, 헤더 '매거진 / 인사이트 레이더 / 문의', 푸터 사업자 정보, /about·/services robots 'noindex, nofollow', 메인 JSON-LD parentOrganization
2. 운영 DB에서 진독 slug가 'zindok'인지 확인 (아니면 site.ts company.radarSlug 수정)
3. 한 줄 소개 통일 SQL 승인·실행(사람): tagline 열 채우기 11건, 설계안은 이 세션 보고 기준
   - 확인: SELECT id, company_name, tagline FROM companies WHERE id IN (233..243);
   - 적용: UPDATE companies SET tagline='…' WHERE id=… AND company_name='…' AND tagline IS NULL; (운영 id는 이름으로 재확인)
4. 대표 확정 후 site.ts 교체: 문구, 주소, 문의 연결, 카드 이름, 서비스 메뉴·가격, AI 인용 사례·캡처 → 확정되면 pages.*.published=true
5. 링크 페이지 '문의하기'/'연락처 남기기' 통합안 결정: A(버튼 하나+선택 시트) / B(주 버튼+보조 글자 링크, 통계 유지)
6. /about·/services 공개 시 헤더 메뉴 5개 → 768px 폭 줄바꿈 확인

## 이전 작업 (전시회 참가사 패키지) — 남은 확인
- 배포 후(사람): stats_share_links·extra_materials 마이그레이션, 공유 링크 만들기→외부 브라우저 열기→끊기 404, 추가 자료 버튼, 한글 PDF 파일명, /go/zindok 문의하기 클릭 +1
- 운영 테스트 리드 1건(2026-11-11 16:53 KST) 삭제 SQL은 사람 승인 후
- P1: 새 연락처 실시간 알림, 참가사 로그인·리드 공유, 제품 카탈로그 블록, 요일×시간 히트맵

## 결정 사항
- 대표 이메일 하나로 고정(개인정보 문의 포함) — 이유: 사용자 결정
- 헤더 '진독 바로가기' 자리를 '문의'가 대신 — 이유: 사용자 결정
- 운영사 연결은 parentOrganization — 이유: 진사이트는 진독 소유 서비스, publisher는 콘텐츠 발행 주체 의미
- 한 줄 소개는 business_summary가 아니라 비어 있는 tagline 열을 명사형으로 채움(기업 아니면 '사업단' 등 유형 명사) — 이유: 프로필 본문 유지
- 공개 전 페이지는 메뉴 숨김·noindex,nofollow·sitemap 제외 — 이유: 초안 문구 노출 방지
- 약관 제1조 'B2B 비즈니스 인텔리전스 플랫폼' 표현은 유지 — 이유: 약관 개정은 개정일·고지 필요, 확정 문구 후 별도
- 매거진 슬라이드 복제본은 클라이언트에서만 생성 — 이유: aria-hidden만으로는 크롤러·텍스트 추출에서 3번 읽힘

## 주의 · 막힌 점
- 개인정보처리방침 이메일 변경했지만 시행일(2026.11.11) 그대로 — 개정 고지 필요 여부 사용자 판단 필요
- 설정의 회사명 뒤 조사(은/이)는 '진독' 기준으로 고정 표기. 이름이 바뀌면 문장 조사 확인
- 헤드리스 Chrome --window-size는 Windows에서 약 500px 아래로 안 줄어듦 → 모바일 스크린샷은 CDP Emulation.setDeviceMetricsOverride로 찍음(스크립트는 세션 임시 폴더, 필요 시 다시 작성)
- 메인 휴대폰 스크린샷의 통계 0은 카운트업 애니메이션 시점, 주황 '1 Insight'는 next dev 표시
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit), DB 스키마·데이터 변경은 사용자 승인 후
- 운영 DB 조회는 에이전트 권한에서 막힘. 로컬 개발 DB는 .env DATABASE_URL(터널 필요 시 pnpm db:tunnel)
- .next/types가 오래되면 tsc 'Route ... never' 오류 → pnpm exec next typegen

## 핵심 파일
- src/config/site.ts — 사이트 설정 전부(회사·문구·노출 스위치·서비스·사례)
- src/config/navigation.ts — 헤더·푸터 메뉴 정의(공개 여부 반영)
- src/lib/site.ts — SITE_* 상수, buildSiteOrganizationJsonLd, buildArticlePublisherJsonLd, buildSocialMetadata
- src/app/(public)/page.tsx — 메인 히어로·현황·사례·매거진, 메인 JSON-LD
- src/components/public/home/MagazineCarousel.tsx — 무한 슬라이드(useIsClient로 복제본 지연 생성)
- src/components/public/home/AiCitationCases.tsx — AI 인용 사례 블록
- src/components/public/layout/public-navbar.tsx, public-footer.tsx — 헤더·푸터
- src/app/(public)/about/page.tsx, services/page.tsx — 새 페이지(초안)
- src/app/(links)/insight-radar/[id]/links/page.tsx — 진사이트 카드(링크 페이지)
- src/lib/radar.ts buildListTagline — 한 줄 소개(tagline 없으면 요약 첫 문장)

## 확인 방법
- pnpm dev → /, /about, /services, /insight-radar, /insight-radar/zindok/links
- /about·/services: meta robots 'noindex, nofollow', /sitemap.xml에 없음
- 메인 JSON-LD: Organization.parentOrganization, 기사 페이지 publisher.@id
- 슬라이드: fetch('/') HTML에서 .snap-start 수 = 기사 수
- pnpm exec tsc --noEmit
