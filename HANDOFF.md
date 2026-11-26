# HANDOFF — zinsight
갱신: 2026-11-26 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (push 완료)

## 목표
진사이트 = "지역 기업을 취재하고 소개하는 기업 미디어 플랫폼". 독자에게는 미디어로, 기업 등록·제휴는 언론사 '광고·제휴 문의'처럼 눈에 띄지 않는 별도 경로(/services)로. 진사이트에는 가격을 싣지 않음(상담·진독에서 안내)

## 현재 상태
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
1. (사용자) 운영 배포 후 테크 기사 2편 분류를 '진사이트 소식'으로, 두 번째 기사 제목·본문 첫 'zinsight' → '진사이트(Zinsight)'
2. (사용자) Vercel Production 환경변수: RESEND_API_KEY, INQUIRY_MAIL_FROM, INQUIRY_NOTIFY_TO, INQUIRY_IP_SECRET
3. (보고만) 유료 기사 외부 링크 rel="sponsored": 개발 DB 유료 8편의 외부 링크 7개 모두 sponsored 없음. 메인 슬라이드에는 '파트너' 배지 없음. 처리 방향 사용자 결정 필요
4. (승인 대기) 매거진 JSON-LD: Local Hub 이동 경로 항목 제거, articleSection을 분류 이름으로
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
