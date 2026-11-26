# HANDOFF — zinsight
갱신: 2026-11-26 18:23 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (origin/main과 같음, 모두 push)

## 목표
진사이트 = "지역 기업을 취재하고 소개하는 기업 미디어 플랫폼". 독자에게는 미디어로, 기업 등록·제휴는 언론사 '광고·제휴 문의'처럼 눈에 띄지 않는 별도 경로(/services)로. 진사이트에는 가격을 싣지 않음(상담·진독에서 안내)

## 현재 상태
- 완료·push: 매거진 에디터 선택 상자 정렬 수정(ec4f742, ui/select.tsx 공통 — 왼쪽 정렬·말줄임, 기본 정보 3열)
- 완료·push: 분류 '뉴스레터'·'디지털 마케팅' 삭제(b78fe3a) — 마이그레이션 20261126200000이 남은 기사를 '진사이트 소식'으로 옮기고 빈 분류만 삭제. 개발 DB 적용함. 운영은 사용자가 두 기사를 이미 진사이트 소식으로 옮겨 둠 → 이번 Vercel 빌드에서 빈 분류 삭제만 일어날 것(추정, 배포 결과 미확인)
  - 남은 분류: 기업 스포트라이트·지원사업·정책 브리핑·산학협력·교육(지역), 진사이트 소식. 새 기사 기본값 기업 스포트라이트, 뉴스레터 연·월·자동 슬러그 제거
- 완료·push: 문구 점검(docs/copy-audit-2026-11.md) 코드 반영 — 상 9688ce2, 중 36cbfc0, 하 002ee19
  - 정체성 문장을 메타·OG·Organization·WebSite JSON-LD·RSS·푸터에, 히어로·'이렇게 작동합니다' 문구
  - 프로필 제목 꼬리 '기업 프로필'(siteConfig.radarProfile.titleSuffix, ArticleTracker 정규식은 옛/새 모두)
  - 기사 JSON-LD: 이동 경로에서 'Tech & Marketing'·'Local Hub' 제거, articleSection·article:section은 분류 이름, 유료 기사 keywords '협찬'+'Sponsored Content'(C5 전까지 유지)
  - 분류 표시 magazineCategoryLabel 하나(DB 이름, 없으면 '매거진'), 바이라인 '글', 하단 '에디터'(C7 전 잠정), 협찬 고지 문구, 루트 404 한글(src/app/not-found.tsx)
  - 지역 표기 '안양·광명·의왕'(site.ts SERVICE_AREAS / identity.serviceAreas), 메인의 주석 처리된 옛 예시 블록 삭제
  - 보고서 표에 ✅ 반영 / ⏳ 결정 대기 표시. 스크린샷 docs/screenshots/copy-{high,mid,low}-2026-11-26 (git 추적 안 함)
- 완료·push: /about 공개(388f0bc) — 편집 원칙·후원 정책은 about.showEditorial=false로 숨김, 걸어온 길은 siteConfig.about.timeline, 후원 배지 '협찬'·유료 기사 외부 링크 rel="sponsored"
- 완료·push: 기업 등록·제휴 개편(0ae0a74) — /services 가격 없음, 카드 8개(partnership.offerings), 함정 필드 zi_hp_check, 상단 메뉴 진입 없음
- 확인 안 함: Vercel 운영 배포 결과(마이그레이션 20261126200000 포함)

## 다음 할 일 (우선순위 순)
0. (사용자) 배포 후 확인: 관리자 에디터 카테고리가 4개(기업 스포트라이트·지원사업·정책 브리핑·산학협력·교육·진사이트 소식)인지, /magazine/news에 두 편이 보이는지
1. (사용자) Vercel Production 환경변수 확인: RESEND_API_KEY, INQUIRY_MAIL_FROM, INQUIRY_NOTIFY_TO, INQUIRY_IP_SECRET — 없으면 문의 알림 메일이 안 감
2. (사용자) 관리자에서 DB 문구 수정: H14 authors.bio(id 1·2, '발행자' 화면), L17 magazine_categories 이름·설명, C12 진독 프로필 소개·소재지. 제안 문구는 보고서에
3. (대표 결정) 확인 필요 C1~C12 → 결정 나면 반영: M10 /services 메타(C1), M14 약관(C10 법무), L14 AeoLeadMagnetBanner·L15 MagazineAeoCTA 파일 삭제(C11), C3 footerIntro, C5 'Sponsored Content', C7 호칭
4. (사용자 확인) 히어로 위 tagline 'SEO·AEO·GEO 통합 기업 미디어 플랫폼'(site.ts identity.tagline)은 점검표에 없음 — 유지할지
5. 대표 확정 후 about.showEditorial=true + Organization publishingPrinciples(/about#editorial). NCP 그린하우스 날짜 받으면 timeline visible:true
6. (사용자) 두 번째 진사이트 소식 기사 제목·본문 첫 'zinsight' → '진사이트(Zinsight)'
7. 대림대·텔링 AI 인용 사례 데이터 받으면 aiCitations 채우고 consented=true
8. /services 공개 결정 시 pages.services.published=true (지금 noindex·사이트맵 제외)

## 결정 사항
- 상단 메뉴에 /services 진입 없음, 푸터·프로필·카드 하단 글자 링크만 — 이유: 미디어 정체성(사용자 2026-11-26)
- 기사 상세 하단·메인에는 등록 링크 넣지 않음
- 문구 점검의 JSON-LD 변경안은 "상 우선순위부터" 지시로 승인된 것으로 보고 반영(2026-11-26)
- 결정 전 항목은 임시값으로 넣고 설정 한 곳에서 바꿀 수 있게: footerIntro(C3), 에디터 호칭(C7)
- 자체 문의 GA4: zinsight_register_cta_click(cta_placement: footer·card_footer·profile_footer·services_hero·about_footer)
- 메일은 Resend(fetch), source는 서버가 Origin으로 결정(zinsight/zindok, 메일에는 이름으로 표시)

## 주의 · 막힌 점
- 헤드라인 관리의 '테크·마케팅 피처드' 탭은 지역이 아닌 기사(=진사이트 소식)를 대상으로 그대로 남아 있음(공개 화면 사용처 없음, 정리 여부 미정)
- 개발 DB에 시험 문의 id 1~4 남음(삭제는 사용자 판단)
- 함정 필드로 버려진 과거 문의 건수는 알 수 없음. 앞으로는 Vercel 로그 "[inquiry] 저장하지 않음"으로 셈
- DB 문구(UPDATE)는 에이전트가 바꾸지 않음 — 위치만 보고. 운영 DB는 접속하지 않음
- dev 서버 실행 중 next typegen 실행 금지(무한 새로고침). pnpm build 금지
- 태그 페이지 머리말(magazineIntro)은 검색 모드가 아닐 때만 보여 실제 노출은 확인 못 함

## 핵심 파일
- docs/copy-audit-2026-11.md — 문구 점검 보고서(반영 여부 표시, 확인 필요 C1~C12)
- src/config/site.ts — identity(정체성·serviceAreas·footerIntro), about, partnership, sponsorship, magazineCategoryLabel·sponsoredBadgeLabel
- src/components/public/magazine/MagazinePostDetail.tsx — 기사 본문·바이라인·협찬 고지
- src/app/(public)/magazine/{local/[region]/[slug],tech-marketing/[slug]}/page.tsx — 기사 메타·JSON-LD
- src/app/(public)/insight-radar/[id]/page.tsx — 기업 프로필 메타·JSON-LD
- src/app/(public)/about/page.tsx, src/app/(public)/services/page.tsx — 소개·제휴 안내
- src/lib/inquiry.ts, src/lib/inquiry-store.ts, src/app/api/inquiries/route.ts — 문의 접수·메일

## 확인 방법
- pnpm exec tsc --noEmit
- pnpm dev → /, /about, /magazine, /magazine/local/anyang, 기사 상세, /insight-radar/{slug}, /rss.xml, 없는 주소(404)
