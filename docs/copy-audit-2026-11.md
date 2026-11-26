# 진사이트 문구 점검 보고 (2026-11-26)

점검 보고입니다. **상 H1~H13은 2026-11-26 코드에 반영함**(H10은 '협찬'+'Sponsored Content' 유지, C5 결정 대기). H14는 DB라 사용자 수정 대기. 중·하는 미반영.

처음 점검 때는 코드·DB를 바꾸지 않았습니다. DB는 개발 DB를 읽기만 했고 운영 DB는 보지 않았습니다.
줄 번호는 커밋 `388f0bc` 기준입니다. 기준 번호는 요청서의 1~5입니다.

## 요약

### 문제 건수 (표의 한 줄 = 1건, 같은 문구가 여러 곳이면 묶어서 1건. 유형이 둘이면 앞 번호로 셈)

| 유형 | 상 | 중 | 하 | 합계 |
|---|---|---|---|---|
| 1. 공식 정체성 문장 누락·불일치 | 1 | 1 | 0 | 2 |
| 2. 역할 구분(판매·대행처럼 읽힘) | 1 | 3 | 0 | 4 |
| 3. 금지·옛 정체성·내부 용어 | 7 | 3 | 5 | 15 |
| 4. 표기 통일(브랜드·후원·주소·문체·영문) | 3 | 8 | 11 | 22 |
| 5. 효과 단정 | 2 | 0 | 1 | 3 |
| **합계** | **14** | **15** | **17** | **46** |
| 확인 필요(대표와 정할 것) | | | | 12 |

- **금지 표현이 그대로 남은 곳은 없습니다.** "홍보 플랫폼", "기사 판매", "노출 보장", "상위 노출", "마케팅 대행", "퍼널", "BM", "AEO 검증 실험군"은 공개 화면 코드에서 찾지 못했습니다.
  - 예외 1: 설정의 `keywords`에 "기업 홍보"가 있습니다.
  - 예외 2: 화면에 보이지 않는 가격 보관값(`pricing`)에 "기사 1건"이 있습니다.
- **가격·할인·프로모션 문구도 공개 화면에는 없습니다.** `pricing` 설정에만 남아 있고, 그 값을 읽는 화면이 없습니다.
- **"리드"는 화면에 없습니다.** 코드 주석에만 있습니다. 고객사 '연락처 남기기' 기능도 화면 문구에는 "리드"를 쓰지 않습니다.

### 상 우선순위 (검색·AI에 노출되는 메타·JSON-LD·메인)

1. 사이트 기본 meta·OG 설명에 공식 정체성 문장이 없습니다. Organization·WebSite JSON-LD 설명에도 같은 문장이 쓰입니다. (H1)
2. 메타 keywords에 "기업 홍보", "AI 검색 노출"이 있습니다. (H2)
3. 기업 프로필 제목·JSON-LD·RSS에 "기업 분석 프로필"이 쓰입니다. 옛 '인텔리전스' 정체성의 표현입니다. (H3)
4. 기업 프로필 설명 기본값이 "비즈니스 전문 프로필과 시장 인사이트를 확인하세요"입니다. (H4)
5. 프로필 JSON-LD 설명 기본값에 "비즈니스 프로필 및 기술 분석"이 있습니다. (H5)
6. 지역 지면 meta에 "지자체 전용 지면", "그로스 스토리", "진흥원 자금 혜택"이 있습니다. 지자체가 운영하는 지면으로 잘못 읽힐 수 있습니다. (H6)
7. 비지역 기사 설명 기본값이 "리서치 콘텐츠"입니다. (H7)
8. 기사 JSON-LD·OG에 영문·폐지된 섹션 이름이 남아 있습니다: 'Tech & Marketing', 'Local Hub', articleSection '테크 · 마케팅'. (H8, H9)
9. 후원 기사 JSON-LD keywords가 '파트너', 'Sponsored Content'입니다. (H10)
10. RSS 채널 설명이 "AEO·SEO·GEO 통합 마케팅 인텔리전스"입니다. (H11)
11. 메인 히어로 설명이 효과를 단정합니다: "연락까지 이어지게 합니다". (H12)
12. 메인 '이렇게 작동합니다' 3단계 문구가 효과를 단정합니다. (H13)
13. DB의 기자(에디터) 소개 2건에 "AI 기반 B2B 인텔리전스 미디어 플랫폼", "Zinsight"가 있습니다. 기자 페이지 meta 설명으로도 나갑니다. (H14)

### 설정 파일로 모을 문구

| 문구 | 지금 하드코딩된 곳 | 모을 위치 제안 |
|---|---|---|
| 기본 기자명 "진사이트 편집부" | `src/app/layout.tsx:31`, `MagazinePostDetail.tsx:354·458`, `MagazineCarousel.tsx:283`, `magazine/page.tsx:159·259·299`, `magazine/tags/[slug]/page.tsx:165·237·275`, `RegionHubClient.tsx:100·200`, 기사 상세 2종 `local/[region]/[slug]/page.tsx:159·330`, `tech-marketing/[slug]/page.tsx:138·277` (14곳) | `siteConfig.brand.editorialName` |
| 브랜드명 '진사이트' (siteName·isPartOf name·OG 제목 꼬리) | `insight-radar/[id]/page.tsx:63·96·228`, `local/[region]/[slug]/page.tsx:110·162`, `tech-marketing/[slug]/page.tsx:90·141` | 이미 있는 `SITE_NAME`(=`brand.name`) 사용 |
| 분류 이름 표 (`getCategoryLabel`: 테크 · 마케팅 / 기업 스포트라이트 / 관내 소식 / 뉴스레터) | `MagazinePostDetail.tsx:246-254`, `local/[region]/[slug]/page.tsx:11-19`, `tech-marketing/[slug]/page.tsx:11-19` (같은 함수가 3벌) | `src/lib/site.ts` 함수 하나 + 이름은 DB `magazine_categories.name` 우선 |
| 지역 지면 탭 설명 3종 | `RegionHubClient.tsx:60·66·72` (DB `magazine_categories.description`과 같은 내용이 따로 있음) | DB 설명을 읽거나 `siteConfig.magazine.sectionDescriptions` |
| 서비스 지역 나열 "안양·광명·의왕" (순서도 제각각) | `about/page.tsx:42`, `magazine/page.tsx:19`(안양·의왕·광명), `site.ts:145-146` | `siteConfig.serviceAreas` 배열 + 이어 붙이는 함수 |
| 매거진 소개 문장 | `magazine/page.tsx:19·119`, `site.ts:111 magazineIntro`, `tags/[slug]/page.tsx:124-125`(다른 문구) | `identity.magazineIntro` 하나로 |
| 후원 기사 고지문 2종 | `MagazinePostDetail.tsx:512-514` | `siteConfig.sponsorship.notice` / `eduNotice` |
| 프로필 하단 '인사이트 레이더 안내' 문구 | `MagazinePostDetail.tsx:550` | `siteConfig.radarProfile.articleCta` |
| 빈 목록 문구 | `magazine/page.tsx:270-273·310`, `tags/[slug]/page.tsx:246-249·286`, `RegionHubClient.tsx:211`, `news/page.tsx:79`, `radar-article-feed.tsx:15`, `RadarCompanyList.tsx:64-65` | `siteConfig.emptyStates` |
| 프로필 제목 꼬리 "기업 분석 프로필" | `insight-radar/[id]/page.tsx:60·223`, `ArticleTracker.tsx:126`(제목에서 이 문구를 떼어 내는 정규식), `rss.xml/route.ts:74·79` | `siteConfig.radarProfile.titleSuffix`. **고칠 때 ArticleTracker 정규식도 함께 바꿔야 통계 이름이 깨지지 않습니다** |

주소는 이미 한곳(`site.ts:86` `company.address`, JSON-LD는 `site.ts:266-270` `jsonLd.address`)에서 읽습니다. 코드 안에 다른 주소 표기는 없습니다. DB 표기 차이는 아래 DB 절에 있습니다.

---

## 상 — 메타·JSON-LD·메인

| ID | 위치 | 현재 문구 | 유형 | 제안 문구 | 우선순위 |
|---|---|---|---|---|---|
| H1 | `src/config/site.ts:105`(metaDescription), `:109`(ogDescription) → `src/app/layout.tsx:29·57·70`, JSON-LD `src/lib/site.ts:120`(Organization), `src/app/(public)/page.tsx:56`(WebSite) | 진사이트는 기업 프로필과 기사로 검색엔진과 AI 답변에 우리 회사가 정확히 소개되도록 돕는 SEO·AEO·GEO 통합 기업 미디어 플랫폼입니다. 진독(ZINDOK)이 운영합니다. | 1 | 진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 기사와 기업 프로필로 검색과 AI 답변에 회사가 정확히 소개되도록 돕습니다. 진독(ZINDOK)이 운영합니다. (JSON-LD 설명도 같은 값을 쓰므로 **JSON-LD 변경안**으로 승인 필요) | 상 ✅ 반영 |
| H2 | `src/config/site.ts:112` keywords | '기업 홍보', 'AI 검색 노출' | 3 | '기업 홍보' → '지역 기업', 'AI 검색 노출' → '기업 미디어'. 나머지는 유지 | 상 ✅ 반영 |
| H3 | `src/app/(public)/insight-radar/[id]/page.tsx:60`(title), `:223`(JSON-LD ProfilePage name), `:81`(keywords '기업 분석'), `src/app/rss.xml/route.ts:74·79` | {회사}: {지역} {키워드} 기업 분석 프로필 / [기업 프로필] {회사} - {지역} 기업 분석 정보 / 관내 기업 {회사} 비즈니스 분석 프로필 | 3 | {회사}: {지역} {키워드} 기업 프로필 / [기업 프로필] {회사} - {지역} 기업 정보. keywords '기업 분석' → '기업 프로필'. title이 바뀌므로 `ArticleTracker.tsx:126` 정규식도 함께 수정 (JSON-LD name은 변경안) | 상 ✅ 반영 |
| H4 | `insight-radar/[id]/page.tsx:69` (business_summary가 없을 때 meta description) | {지역}소재 {회사}의 … 비즈니스 전문 프로필과 시장 인사이트를 확인하세요. | 3·4 | {지역} 소재 {회사}의 사업 소개, 제품·서비스, 관련 기사를 정리한 기업 프로필입니다. | 상 ✅ 반영 |
| H5 | `insight-radar/[id]/page.tsx:224` JSON-LD description 기본값 | {회사}의 비즈니스 프로필 및 기술 분석 | 3 | {회사}의 사업 소개와 관련 기사를 정리한 기업 프로필 (JSON-LD 변경안) | 상 ✅ 반영 |
| H6 | `src/app/(public)/magazine/local/[region]/page.tsx:54`(title), `:55`(description) | {지역} 비즈니스 허브: 관내 기업·지원사업 소식 / {지역} 관내 혁신 스타트업 성공 사례 및 소상공인 그로스 스토리, 진흥원 자금 혜택을 한데 모은 지자체 전용 지면입니다. | 2·3 | {지역} 지면: 지역 기업·기관 소식 / 진사이트 매거진 {지역} 지면입니다. {지역} 기업과 기관을 취재한 기사와 지원사업 소식을 모았습니다. | 상 ✅ 반영 |
| H7 | `src/app/(public)/magazine/tech-marketing/[slug]/page.tsx:103` (요약 없을 때 description) | {제목} — 진사이트 매거진 리서치 콘텐츠 | 3 | {제목} — 진사이트 매거진 기사 | 상 ✅ 반영 |
| H8 | `tech-marketing/[slug]/page.tsx:137`(OG article:section), `:225`(JSON-LD Breadcrumb), `:253`(articleSection) | 'Tech & Marketing' / '테크 · 마케팅' | 4 | 분류 이름(`post.category.name`, 예: '진사이트 소식'), 이동 경로 주소 `/magazine/news` (JSON-LD 변경안, 2026-11-26 매거진 정리 때 보고한 안과 같음) | 상 ✅ 반영 |
| H9 | `src/app/(public)/magazine/local/[region]/[slug]/page.tsx:257` JSON-LD Breadcrumb | 'Local Hub' (`/magazine/local`, 지금은 301 주소) | 4 | 이 항목을 빼서 홈 › 매거진 › {지역} › 기사 4단계로 (JSON-LD 변경안) | 상 ✅ 반영 |
| H10 | `local/[region]/[slug]/page.tsx:227`, `tech-marketing/[slug]/page.tsx:195` JSON-LD keywords | '파트너', 'Sponsored Content' | 4 | '협찬', '파트너 콘텐츠(협찬)' (영문 'Sponsored Content'는 유지할지 확인 필요) (JSON-LD 변경안) | 상 ✅ 반영 |
| H11 | `src/app/rss.xml/route.ts:99` 채널 description | 진사이트 AEO·SEO·GEO 통합 마케팅 인텔리전스 및 관내 기업 분석 피드 | 3 | 진사이트 매거진 기사와 인사이트 레이더 기업 프로필 피드. 진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. | 상 ✅ 반영 |
| H12 | `src/config/site.ts:103` heroDescription (메인 히어로) | 기업 이야기를 기사와 프로필로 정리해 검색과 AI 답변에 남기고, 찾아온 고객이 연락까지 이어지게 합니다. | 5 | 기업 이야기를 기사와 프로필로 정리해, 검색과 AI가 회사를 정확히 소개하도록 돕습니다. | 상 ✅ 반영 |
| H13 | `src/components/public/home/AiCitationCases.tsx:75`, `:76`, `:89` (메인 '이렇게 작동합니다') | 정리된 기사와 기업 프로필이 답변의 근거 자료가 됩니다. / 프로필과 카드에서 홈페이지 방문과 문의로 이어집니다. / …찾아온 고객이 우리 회사까지 오게 합니다. | 5 | 기사와 기업 프로필을 답변의 근거로 쓰기 좋게 정리합니다. / 프로필과 카드에서 홈페이지와 문의로 바로 갈 수 있게 합니다. / …찾아온 고객이 우리 회사를 쉽게 찾도록 돕습니다. | 상 ✅ 반영 |
| H14 | DB `authors.bio` (id 1 '이종섭', id 2 '이태경') → 기자 페이지 `author/[slug]/page.tsx:22`(meta description)·`:88`, 기사 하단 `MagazinePostDetail.tsx:461` | "데이터 가치 증명 플랫폼 진독(Zindok)…AI 기반 B2B 인텔리전스 미디어 플랫폼 '진사이트(Zinsight)'…" / "AI 기반 B2B 인텔리전스 미디어 플랫폼 Zinsight를 운영하는 진독의 대표로서…검색 노출 전략…" | 3·4 | 예) "진독(ZINDOK) 기술전략이사. 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼 진사이트의 기술을 맡고 있습니다." / "진독(ZINDOK) 대표. 진사이트를 운영합니다." (관리자 '발행자' 화면에서 사용자가 수정. DB라 위치만 보고) | 상 ⏳ 사용자 |

## 중 — 공통 영역·자주 보이는 화면

| ID | 위치 | 현재 문구 | 유형 | 제안 문구 | 우선순위 |
|---|---|---|---|---|---|
| M1 | `src/config/site.ts:110` footerIntro (모든 페이지 푸터) | AI가 가장 먼저 찾는 기업으로 만듭니다. SEO·AEO·GEO 통합 기업 미디어 플랫폼, 진독(ZINDOK)이 운영합니다. | 1 | 진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 진독(ZINDOK)이 운영합니다. (슬로건·보조 문구를 푸터에도 남길지는 확인 필요 C3) | 중 |
| M2 | 루트 `not-found.tsx` 없음 (`src/app/share/not-found.tsx`만 있음) | Next.js 기본 영문 "404 This page could not be found." | 4 | 페이지를 찾을 수 없습니다. 주소를 확인하시거나 매거진·인사이트 레이더에서 찾아 주세요. (+ 매거진 홈·인사이트 레이더 링크) | 중 |
| M3 | `MagazinePostDetail.tsx:246-254`, `local/[region]/[slug]/page.tsx:11-19`, `tech-marketing/[slug]/page.tsx:11-19` (`getCategoryLabel`, 배지·article:tag·keywords에 씀) | 'tech-marketing' → '테크 · 마케팅', 분류 없음 → '뉴스레터' | 4 | DB 분류 이름 그대로(예: '진사이트 소식'), 분류 없음 → '매거진' | 중 |
| M4 | `src/app/(public)/magazine/tags/[slug]/page.tsx:124-125` (태그 목록 머리말) | 데이터의 깊이와 저널리즘의 통찰이 만난 곳, 마케팅의 격을 높이는 프리미엄 미디어 | 2·3 | 지역 기업과 기관의 이야기를 기사로 정리해 전합니다. (`identity.magazineIntro`) | 중 |
| M5 | `local/[region]/page.tsx:93`, `:101`, `:104`, `:109-110` (지역 지면 머리) | Magazine / {지역} 관내 기업 소식 & 지원 정보 / {지역} 비즈니스 허브 / …요약 전달하는 진사이트 기획 파트너 미디어 코너입니다. | 4 | 매거진 / {지역} 기업·기관 소식과 지원 정보 / {지역} 지면 / 진사이트 매거진이 {지역} 기업과 기관을 취재해 전하는 지면입니다. ('파트너'는 협찬 표기와 헷갈림) | 중 |
| M6 | `MagazinePostDetail.tsx:354`(바이라인), `:481`, `:492` vs 기자 페이지 `author/[slug]/page.tsx:21·81·98` | 발행: {이름} / 발행자 / 발행자 프로필 보기 → (기자 페이지에서는 "에디터") | 4 | 글 {이름} / 에디터 / 에디터 프로필 보기 (호칭은 확인 필요 C7) | 중 |
| M7 | `MagazinePostDetail.tsx:550` (기사 속 연관 기업 카드) | 최신 기사, 투자 유치, GEO 마케팅 인덱스를 인사이트 레이더에서 확인해보세요. | 3·5 | 사업 소개와 관련 기사를 인사이트 레이더 프로필에서 볼 수 있습니다. ('투자 유치', 'GEO 마케팅 인덱스'는 프로필에 없는 정보) | 중 |
| M8 | `MagazinePostDetail.tsx:514` (후원 기사 끝 고지) | 본 콘텐츠는 진사이트와 제휴 계약을 체결한 파트너사의 의뢰로 제작된 파트너 콘텐츠(협찬)입니다. 콘텐츠의 편집 방향과 서술 방식은 진사이트 편집부가 독립적으로 결정합니다. | 4 | 이 기사는 기업의 의뢰로 제작한 파트너 콘텐츠(협찬)입니다. 기사의 구성과 표현은 진사이트 편집부가 정했습니다. | 중 |
| M9 | `src/app/(public)/author/[slug]/page.tsx:88` (소개가 없을 때 기본 문구) | 안녕하세요. 진사이트 매거진 에디터입니다. 깊이 있는 비즈니스 분석과 마켓 인사이트를 전해드립니다. | 3 | 진사이트 매거진 에디터입니다. 지역 기업과 기관을 취재해 소개합니다. | 중 |
| M10 | `src/config/site.ts:210` partnership.metaDescription (/services) | …무료 마케팅 기본 진단부터 맞춤 제안까지 상담해 드립니다. | 2 | 진사이트 기업 프로필·진사이트 카드 등록과 기업 취재·제휴 문의 안내입니다. 진단과 제안은 운영사 진독(ZINDOK)이 맡습니다. (C1과 함께 결정) | 중 |
| M11 | `src/app/(links)/insight-radar/[id]/links/page.tsx:27` (진사이트 카드 meta, 소개 없을 때) | {회사}의 홈페이지·SNS·소식을 한 곳에서 확인하세요. | 4 | {회사}의 홈페이지·SNS·소식을 한곳에 모은 진사이트 카드입니다. | 중 |
| M12 | `src/app/(public)/privacy/page.tsx:187` | 진사이트 이용 문의 접수 내용 | 4 | 기업 등록·제휴 문의 접수 내용 (제1조·제2조 누락은 C9) | 중 |
| M13 | `privacy/page.tsx:245` | 수집된 분석 정보는 마케팅 개선을 위해서만 활용됩니다. | 2 | 수집된 분석 정보는 서비스 개선을 위해서만 씁니다. | 중 |
| M14 | `src/app/(public)/terms/page.tsx:110`, `:121`, `:147` | 온라인 B2B 비즈니스 인텔리전스 플랫폼 및 매거진 서비스 / '인사이트 레이더(Insight Radar)' 기업/산업 데이터 분석 대시보드, '진사이트 매거진' 뉴스레터 콘텐츠 / B2B 기업 시장 정보 수집 가공 및 매거진 구독 서비스 | 3 | 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼 '진사이트'(매거진·인사이트 레이더·진사이트 카드) / '인사이트 레이더' 기업 프로필, '진사이트 매거진' 기사 / 기사와 기업 프로필 제공 서비스 (약관이라 C10과 함께 법무 확인) | 중 |
| M15 | `src/app/register/org/[token]/complete/page.tsx:14` (초대받은 기관이 보는 완료 화면) | 지인사이트 레이더 서비스에서 | 4 | 인사이트 레이더에서 (오타) | 중 |

## 하 — 기타

| ID | 위치 | 현재 문구 | 유형 | 제안 문구 | 우선순위 |
|---|---|---|---|---|---|
| L1 | `magazine/page.tsx:103·114`, `tags/[slug]/page.tsx:111·119` | 최신 에디션 / 전체 에디션 보기 | 4 | 최신 기사 / 전체 기사 보기 | 하 |
| L2 | `magazine/page.tsx:273`, `tags/[slug]/page.tsx:249` | 독자 여러분을 위한 새로운 에디션과 깊이 있는 리포트를 준비 중입니다. 조금만 기다려 주세요! | 4 | 새 기사를 준비하고 있습니다. | 하 |
| L3 | `magazine/page.tsx:310`, `tags/[slug]/page.tsx:286` | 추가적인 주요 헤드라인을 준비 중입니다. | 4 | 다른 기사를 준비하고 있습니다. | 하 |
| L4 | `RegionHubClient.tsx:211` | 이 탭에 등록된 소식이 없습니다. 조만간 새로운 소식을 전해드리겠습니다! | 4 | 이 분류에는 아직 기사가 없습니다. | 하 |
| L5 | `src/components/public/layout/public-footer.tsx:52` vs 헤더 '매거진 홈' | 매거진 아카이브 | 4 | 매거진 (또는 헤더와 같게 '매거진 홈') | 하 |
| L6 | `magazine/tags/[slug]/page.tsx:34` (태그 meta) | …관련 기사 {n}건을 모아 보세요. | 4 | …관련 기사 {n}건을 모았습니다. | 하 |
| L7 | `src/app/(public)/insight-radar/page.tsx:46-47` (검색 결과 meta, noindex) | "{q}" 관련 기업 및 기술 동향 / …관내 기업, 비즈니스 포지셔닝, 핵심 기술 및 최신 뉴스 타임라인을 확인하세요. | 3·4 | "{q}" 관련 기업 / 진사이트 인사이트 레이더에서 "{q}"와 관련된 지역 기업·기관 프로필을 모았습니다. | 하 |
| L8 | `src/components/public/insight-radar/RadarSearchBar.tsx:74` | 관심 있는 조직과 기술 트렌드를 탐색하세요 | 3 | 지역 기업·기관 프로필을 찾아보세요 | 하 |
| L9 | `insight-radar/[id]/page.tsx:555`, `:560`, `:537`, `CollapsibleBusinessSummary.tsx:69` | 핵심 기술 (Tech) / 타겟 시장 (Market) / 등록된 비즈니스 요약이 없습니다. / 비즈니스 요약 더보기 | 4 | 핵심 기술 / 주요 고객·시장 / 등록된 회사 소개가 없습니다. / 회사 소개 더보기 | 하 |
| L10 | `src/app/share/stats/[token]/report/page.tsx:57` vs 통계 화면 `page.tsx:48` | 링크 페이지 방문 요약 / 진사이트 카드(링크 페이지) 방문 통계 | 4 | 진사이트 카드 방문 요약 (이름 통일) | 하 |
| L11 | `src/components/public/services/InquiryForm.tsx:114` | …로 메일 주세요. | 4 | …로 메일을 보내 주세요. | 하 |
| L12 | `src/lib/inquiry-store.ts:105` (알림 메일 본문) | 출처: zinsight | 4 | 출처: 진사이트(/services) — 내부 코드값 대신 이름 | 하 |
| L13 | `src/config/site.ts:145`(radarList.title), `:146`, `about/page.tsx:42`, `magazine/page.tsx:19` | 안양·광명·의왕 / 안양·의왕·광명 (순서 불일치) | 4 | 한 순서로 통일 (설정 `serviceAreas`) | 하 |
| L14 | `src/components/public/aeo/AeoLeadMagnetBanner.tsx:91-312` (지금 숨김, `insight-radar/page.tsx:123`에서 주석 처리) | 리빙 프로필·매거진 발행 시 예상 상승률 / AI 인용률을 {n}% 수준까지 끌어올릴 수 있습니다 / AI 인용률 상승 전략 / 4대 생성형 AI 엔진 / 리빙 프로필 | 5 | 다시 켤 계획이 없으면 파일 삭제. 켠다면 효과 수치·'리빙 프로필'(내부 용어)을 빼고 전면 재작성 (C11) | 하 |
| L15 | `src/components/public/MagazineAeoCTA.tsx:19-25` (어디서도 쓰지 않는 파일) | 진사이트 레이더 / 차세대 AI 검색 최적화(GEO)와 웹 표준 SEO를 통해 비즈니스 가치를 입증하는 혁신 기업 리스트입니다. | 3 | 파일 삭제 권장 | 하 |
| L16 | `src/app/(public)/page.tsx:171-281` (주석 처리된 예시 블록) | 반도체 HBM 시장…, Replicate AI, Signal Strength, 글로벌 투자 심리 지수, Bullish Neutral | 3 | 화면에는 안 나옴. 옛 '마켓 인텔리전스' 시안이라 삭제 권장 | 하 |
| L17 | DB `magazine_categories` name·description (아래 DB 절) | 디지털 마케팅 / AEO/GEO 최적화 디지털 마케팅 리포트 및 지면 / 비즈니스 테크 & 디지털 마케팅 뉴스레터 피드 | 3 | 아래 DB 절 참고 | 하 |

---

## DB에 저장된 공통 문구 (위치만, 개발 DB 기준)

| 위치 | 현재 값 | 화면 노출 | 비고 |
|---|---|---|---|
| `authors.bio` id 1, 2 | 위 H14 | 기자 페이지 본문·meta description, 기사 하단 기자 소개 | 상. 관리자 '발행자' 편집에서 수정 |
| `magazine_categories` id 2 (slug `tech-marketing`) name | 디지털 마케팅 | 이 분류 기사의 목록 배지·상세 라벨 (코드 `getCategoryLabel`은 '테크 · 마케팅'으로 덮어씀 — 이름이 두 개) | 테크 기사 2편을 '진사이트 소식'으로 옮기면 이 분류를 쓰는 기사가 없어질 것(추정) |
| `magazine_categories` description id 1·2·3·4 | 비즈니스 테크 & 디지털 마케팅 뉴스레터 피드 / AEO/GEO 최적화 디지털 마케팅 리포트 및 지면 / 관내 스타트업…성장 성공사례 / 관내 및 경기도 산하 진흥원의…요약 브리핑 | 코드 검색상 화면에서 읽는 곳 없음 | 관리자 화면에만 보이는 것으로 보임(추정) |
| `magazine_categories` id 1 name | 뉴스레터 | 분류 라벨 | 쓰는 기사가 있는지 확인 필요 |
| `organizations` (slug `zindok`) `business_summary` | …AEO, SEO, GEO 통합 검색최적화 미디어 플랫폼 진사이트(ZINSIGHT)를 운영한다… | 진독 프로필 본문·meta description·Organization JSON-LD | 콘텐츠지만 운영사 프로필이라 정체성 문장과 직결 → C12 |
| `organizations` (slug `zindok`) `hq_location` | 경기도 안양시 동안구 시민대로327번길 11-41, 9층 26-4호(관양동) | 진독 프로필 '소재지', 프로필 JSON-LD 주소 | 명함 표기와 다름(쉼표·'관양동'). 사이트 설정값으로 된 DB 공통 문구 테이블(사이트 설정 테이블)은 없음 |

운영 DB 값은 보지 않았습니다. 운영 DB 값이 다를 수 있습니다.

---

## 확인 필요 (대표와 정할 것)

| ID | 내용 | 위치 | 선택지 |
|---|---|---|---|
| C1 | /services의 진단·영상·채널 정리·꾸준한 관리는 제작·대행 성격입니다. 기준 2로 보면 진독 업무입니다. | `src/config/site.ts:211-219` offerings, `:209` intro | ① 카드마다 "운영사 진독(ZINDOK) 제공" 표기 ② 진사이트 카드에는 미디어 항목(프로필·취재·카드)만 남기고 나머지는 진독 페이지로 ③ 지금대로 |
| C2 | 슬로건 "AI가 가장 먼저 찾는 기업으로 만듭니다"도 효과를 단정하는 문장입니다. (기준 1에서 유지하기로 함) | `site.ts:99`, defaultTitle·ogTitle `:106-107` | 유지 / "AI가 먼저 찾는 기업 정보를 만듭니다"처럼 완화 |
| C3 | 푸터 소개에 슬로건·보조 문구를 남길지, 공식 정체성 문장으로 바꿀지 (M1) | `site.ts:110` | 정체성 문장만 / 정체성 문장 + 보조 문구 |
| C4 | Organization JSON-LD에 `slogan` 속성이 없습니다. | `src/lib/site.ts:112-141` | `slogan: identity.slogan` 추가 / 그대로 |
| C5 | 'Sponsored Content'(영문)를 JSON-LD 키워드에 남길지 (H10) | 기사 상세 2종 | 남김 / 한글만 |
| C6 | "1기 검증 파트너 모집"의 '파트너'가 협찬 표기 '파트너 콘텐츠(협찬)'와 헷갈릴 수 있습니다. | `site.ts:187` 걸어온 길 | "1기 검증 참여 기업 모집" 등으로 / 그대로 |
| C7 | 기사 작성자 호칭: 지금은 '발행자'(기사)와 '에디터'(기자 페이지)가 섞여 있습니다. (M6) | `MagazinePostDetail.tsx`, `author/[slug]/page.tsx` | 에디터 / 기자 / 글 |
| C8 | 개인정보처리방침이 숨겨 둔 'AEO 진단·상담 신청'을 계속 안내합니다. | `privacy/page.tsx:146·162·185` | 기능을 안 쓰면 삭제 / 유지 |
| C9 | 개인정보처리방침에 '기업 등록·제휴 문의'(/services 폼)의 처리 목적(제1조)·수집 항목(제2조)이 없습니다. 보유 기간(제3조)에만 있습니다. | `privacy/page.tsx:145-165` | 목적·항목 추가 권장 (회사명·담당자명·전화번호·이메일·관심 항목·메시지) |
| C10 | 약관·처리방침이 회원제를 전제로 씁니다('회원', '회원님', 계정 등록, 매거진 구독). 사이트에는 회원 가입이 없습니다. 처리방침 책임자 표기('개인정보보호 및 기술지원 운영실', '최고보안책임자(CISO)')도 실제와 맞는지 확인이 필요합니다. 약관 제6조 상자 "당사는 의사결정의 참고 자료에 대해서만 보증합니다"(`terms:192`)와 본문 "신뢰성…에 대하여 보증하지 않으며"(`terms:199`)가 서로 맞지 않습니다. | `terms/page.tsx:110-147·192·199`, `privacy/page.tsx:81·182·251-252·327-332` | 법무 검토 후 일괄 개정 |
| C11 | 숨겨 둔 AEO 진단 배너와 쓰지 않는 CTA 파일을 지울지 (L14, L15) | 위 경로 | 삭제 / 보관 |
| C12 | 진독 프로필 소개(DB)의 "통합 검색최적화 미디어 플랫폼 진사이트(ZINSIGHT)"와 소재지 표기 | DB `organizations` slug `zindok` | 관리자에서 새 정체성 문장·명함 주소로 수정 / 그대로 |

## 문제없음으로 본 것 (참고)

- 헤더 메뉴: 매거진·매거진 홈·{지역} 지면·인사이트 레이더 (`public-navbar.tsx`)
- 푸터 사업자 정보: 설정 `company`에서 읽고, 주소는 명함 기준과 같습니다.
- /about, /services 본문 문구: 2026-11-26에 새로 쓴 문구입니다. 판매처럼 읽히는 항목만 C1로 올렸습니다.
- 문의 폼 라벨·오류 메시지: `src/lib/inquiry.ts:67-84`, `InquiryForm.tsx`. 모두 '~해 주세요'·'~합니다'체입니다.
- 알림 메일 제목 "[진사이트 제휴 문의] {회사} · {담당자}"
- 진사이트 카드·공유 통계 화면 문구: 이름 통일 1건(L10)만 해당합니다.
- 후원 배지: 화면 배지는 모두 "협찬"/"협력 기관"입니다. 남은 "파트너"는 JSON-LD 키워드(H10)와 고지문(M8)입니다. '제휴'는 '기업 등록·제휴 문의'(의도된 이름)와 고지문(M8)에만 쓰입니다. 관리자 화면 표기(`LinkInsertModal.tsx:128` "고객사·파트너 링크 (Sponsored)")는 외부에 보이지 않습니다.
- 로딩 화면: 별도 `loading.tsx`가 없어 문구가 없습니다.
- 관리자 로그인·패스키 문구: 외부 방문자에게 보이는 곳은 `/login` 화면뿐이고 문제 표현은 없습니다.
