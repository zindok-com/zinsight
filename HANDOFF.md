# HANDOFF — zinsight
갱신: 2026-11-26 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (388f0bc 이후 커밋 push 안 함)

## 목표
진사이트 = "지역 기업을 취재하고 소개하는 기업 미디어 플랫폼". 독자에게는 미디어로, 기업 등록·제휴는 언론사 '광고·제휴 문의'처럼 눈에 띄지 않는 별도 경로(/services)로. 진사이트에는 가격을 싣지 않음(상담·진독에서 안내)

## 현재 상태
- 완료: 문구 점검(docs/copy-audit-2026-11.md) 상 H1~H13 반영 (이번 커밋, push 안 함)
  - 메타·OG·Organization·WebSite 설명을 새 정체성 문장으로, keywords '지역 기업'·'기업 미디어', 히어로·'이렇게 작동합니다' 문구
  - 프로필 제목 꼬리 '기업 프로필'(siteConfig.radarProfile.titleSuffix), ArticleTracker 정규식은 옛/새 꼬리 모두 처리, RSS 항목·채널 설명
  - 지역 지면 제목·설명, 테크 기사 설명·article:section·articleSection을 분류 이름으로, 이동 경로에서 'Tech & Marketing'·'Local Hub' 제거(진사이트 소식만 /magazine/news 단계)
  - 유료 기사 JSON-LD keywords '파트너' → 배지 이름('협찬'), 'Sponsored Content'는 C5 결정 전까지 유지
  - 스크린샷 docs/screenshots/copy-high-2026-11-26 (메인 4종)
- 완료: /about 공개 (이번 커밋, push 안 함)
  - 구성: 정체성 한 문장 → 매거진·인사이트 레이더 → (숨김) 편집 원칙·후원 표기 정책 → 운영사 진독 → 걸어온 길 → '기업 등록·제휴 문의' 글자 링크(about_footer)
  - 값은 siteConfig.about(문구·timeline·showEditorial=false), 운영사·정정 이메일은 company(correctionEmail). 걸어온 길 기사 링크는 postSlug로 DB에서 공개 기사 주소를 찾음(getPublishedPostPaths), NCP 그린하우스는 날짜 확인 중이라 visible:false
  - pages.about.published=true(색인·사이트맵), 상단 메뉴 자동 추가 코드 제거, 푸터 '진사이트 소개' → /about
  - JSON-LD: AboutPage에 publisher(@id), 메인과 같은 Organization(진독 parentOrganization) 블록 추가. publishingPrinciples는 편집 원칙 게시 후, NewsMediaOrganization은 보류
  - 후원 기사: 배지 '파트너' → '협찬'(edu-collab은 '협력 기관', sponsoredBadgeLabel), 메인 슬라이드 배지 추가, isPaid 기사의 외부 링크는 렌더링에서 모두 rel="sponsored noopener"(DB 본문은 그대로), 기사 끝 고지 '파트너 콘텐츠(협찬)'. article:tag도 배지와 같게, JSON-LD keywords('파트너','Sponsored Content')는 그대로
  - 스크린샷 docs/screenshots/about-2026-11-26 (editorial-draft-preview-1440은 숨김 블록을 잠시 켠 미리보기)
- 완료: 기업 등록·제휴 개편 (이번 커밋)
  - /services 제목 '기업 등록·제휴 안내', 가격표·프로모션·VAT·결제 수단 제거, '무엇을 해 드리나요' 카드 8개(siteConfig.partnership.offerings), 진행 안내 4단계, 진독 교차 문구
  - 가격 값(siteConfig.pricing, isPromoActive·formatWon)은 삭제하지 않고 아무 데서도 안 읽음 — 진독 견적 페이지 재사용용
  - 문의 폼 관심 항목 = 카드 8개(옛 상품 id는 서버에서 걸러짐), 완료 안내 문구 교체, 알림 메일 제목 '[진사이트 제휴 문의]'
  - 함정 필드 이름 website → zi_hp_check(자동 완성 회피), 라벨 제거, 버릴 때 서버 로그 "[inquiry] 저장하지 않음: 함정 필드|작성 시간 부족"
  - 진입 경로: 헤더·모바일 메뉴 '이용 문의' 버튼과 '이용 안내' 메뉴 제거, 메인 히어로 보조 버튼 '진사이트 매거진 읽기'(/magazine)로 복원, 푸터 '정보'에 '기업 등록·제휴 문의', 프로필·카드 하단 '우리 회사도 진사이트에 소개되고 싶다면 →'
  - /services JSON-LD: Service 목록을 카드 8개 이름으로, WebPage 설명은 새 메타 설명(가격 없음). Offer 없음 (사용자 승인)
- 확인함: tsc 통과, SSR에 가격·VAT·프로모션 없음, 개발 DB 저장(id 4, 옛 id 'video-standard' 걸러짐)·메일 발송, 함정 필드 요청 버림·로그. 스크린샷 docs/screenshots/services-2026-11-26 (before/after 4종, 프로필·헤더 전후, git 추적 안 함)
- 이전 완료: inquiries 테이블·Resend 메일, 메인 화면 정비, 매거진 메뉴 정리(71a1786)

## 다음 할 일 (우선순위 순)
- (사용자) H14: 관리자 '발행자' 화면에서 authors.bio(id 1·2) 수정 — 제안 문구는 audit 문서 H14
- 문구 점검 중·하 항목, 확인 필요 C1~C12(대표와 결정). tagline·footerIntro의 'SEO·AEO·GEO 통합'은 중 항목으로 남음
0. push (사용자 요청 시). 대표 확정 후 about.showEditorial=true + Organization publishingPrinciples(/about#editorial) 추가. NCP 그린하우스 날짜 받으면 timeline visible:true. 진독 당사자 기사 이해관계 고지는 정책 초안에만 있음(기사 고지 기능 없음)
1. (사용자) 운영 배포 후 테크 기사 2편 분류를 '진사이트 소식'으로, 두 번째 기사 제목·본문 첫 'zinsight' → '진사이트(Zinsight)'
2. (사용자) Vercel Production 환경변수: RESEND_API_KEY, INQUIRY_MAIL_FROM, INQUIRY_NOTIFY_TO, INQUIRY_IP_SECRET
5. 대림대·텔링 AI 인용 사례 데이터 받으면 aiCitations 채우고 consented=true
6. /services 공개 결정 시 pages.services.published=true (지금 noindex·사이트맵 제외)

## 결정 사항
- 상단 메뉴에 /services 진입 없음, 푸터·프로필·카드 하단 글자 링크만 — 미디어 정체성(사용자 2026-11-26)
- 기사 상세 하단·메인에는 등록 링크 넣지 않음
- 자체 문의 GA4: zinsight_register_cta_click(cta_placement: footer·card_footer·profile_footer·services_hero), 고객사 cta_inquiry_click·카드 통계와 분리
- 메일은 Resend(fetch), source는 서버가 Origin으로 결정

## 주의 · 막힌 점
- 개발 DB에 시험 문의 id 1~4 남음(삭제는 사용자 판단). 시험 접수로 알림 메일 1통 더 감
- 함정 필드로 버려진 과거 문의 건수는 기록이 없어 알 수 없음. 앞으로는 Vercel 로그로 셀 수 있음
- dev 서버 실행 중 next typegen 실행 금지(무한 새로고침)
- 운영 DB는 에이전트가 접속하지 않음. pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit)

## 핵심 파일
- src/config/site.ts — partnership(카드·문구), pricing(보관만), contact, crossLink
- src/lib/inquiry.ts — 입력 규칙·관심 항목·함정 필드 이름
- src/app/api/inquiries/route.ts, src/lib/inquiry-store.ts — 접수 API·저장·메일
- src/app/(public)/services/page.tsx, src/components/public/services/InquiryForm.tsx — 페이지·폼
- src/components/public/layout/public-navbar.tsx, public-footer.tsx, src/config/navigation.ts — 메뉴·푸터

## 확인 방법
- pnpm exec tsc --noEmit
- pnpm dev → /services, /insight-radar/{slug} 하단, /insight-radar/{slug}/links 하단, 푸터 '정보'
