# HANDOFF — zinsight
갱신: 2026-11-26 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (로컬 커밋 9개, push 안 함)

## 목표
진사이트 자체 상품 페이지(/services)와 "우리 회사도 등록하기" 이용 문의 흐름. 고객사 '문의하기'(카드·프로필) 리드·통계와 완전히 분리
(이전 목표: AI 활용 리포트 점검 항목 1~5 — 완료·push, 운영 확인은 아래 '이전 작업')

## 현재 상태
- 완료: 상품·가격·프로모션 설정 siteConfig.pricing / crossLink / contact(src/config/site.ts), isPromoActive·formatWon (커밋 80a1ffc)
- 완료: POST /api/inquiries — 검증(src/lib/inquiry.ts), 함정 필드 website·최소 작성 3초, IP당 1시간 5회(메모리 + DB ip_hash 기준), 저장 후 after()로 Resend 메일. 저장 실패 시 메일만 가도 접수 성공 처리 (커밋 e01de17)
- 완료: /services 페이지 재작성(표·모바일 카드·결제 안내·문의 폼·진독 교차 링크), GA4 이벤트 ZinsightCtaTracker (커밋 55a57ff)
- 완료: 진입 링크 — 헤더 버튼 "이용 문의"(data-zi-cta=header/header_drawer), 푸터 "진사이트 이용 문의"(footer), 카드 하단(card_footer, data-link-key 없음), 프로필 하단(profile_footer) (커밋 e37ec08)
- 완료: 개인정보처리방침 보관 기간에 "진사이트 이용 문의 1년" (커밋 b9cba63)
- 확인함: tsc 통과, dev에서 SSR 본문·noindex·canonical, API 403(외부 origin)·422·함정/빠른 제출 200, 테이블 없을 때 503(메일 설정 없음 로그), 375/390/1440/1920 가로 넘침 없음. 스크린샷 docs/screenshots/services-2026-11-25 (git 추적 안 함)
- 완료: inquiries 테이블 — Inquiry 모델·마이그레이션 20261126000000_add_inquiries, 개발 DB에 migrate deploy 적용, inquiry-store를 prisma.inquiry로 교체 (커밋 0b3caf0). 운영 DB는 push 후 Vercel 배포 시 자동 적용
- 완료: 모바일 메뉴 지역 지면을 '로컬 비즈니스 허브' 하위로 들여 표시, PC 드롭다운 제목 '로컬 허브 · 지역 지면' (커밋 852a2fa)
- 확인함: 개발 DB 실제 저장(출처·관심 상품·UTM·ip_hash 저장 확인). 개발 DB에 테스트 행 id 1~3 남음(1은 셸 인코딩으로 글자 깨짐) — 삭제는 사용자 판단
- 확인함: 알림 메일 — Resend 도메인 send.zinsight.co.kr 인증, 로컬 .env.local에 키 설정, 시험 문의(id 3) 메일 수신·notified_at 기록 확인 (2026-11-26)
- 미확인: GA4 이벤트 수신, 운영 환경변수

- 완료: 메인 화면 정비 — 숫자 블록 제거, AI 인용 사례(consented만 노출, 없으면 '이렇게 작동합니다'), 히어로 보조 문구·'우리 회사도 등록하기'(home_hero), 푸터 문구, 명함 주소 (커밋 b902eb5). meta·OG description 교체, title은 기존 유지(사용자 A안)
- 확인함: 메인 SSR 매거진 기사 제목 각 1회, 375/390/1440/1920 가로 넘침 없음. 스크린샷 docs/screenshots/home-2026-11-26 (git 추적 안 함)

- 완료: 매거진 메뉴 정리 — 메뉴는 매거진 홈+지역 지면, /magazine/tech-marketing·/magazine/local 목록 301→/magazine(next.config redirects, 목록 페이지 삭제), 사이트맵 정리, 매거진 홈 제목 '진사이트 매거진 — 로컬 비즈니스 허브'·지역 카드·목록 작성일, /magazine/news(진사이트 소식, 푸터 링크만), 메인 슬라이드 최신 12편 자동+홈 노출 고정, 분류 zinsight-news 데이터 마이그레이션(개발 DB 적용)
- 주의: dev 서버 실행 중 next typegen 실행 금지(무한 새로고침 발생, dev 재시작으로 해결)

## 다음 할 일 (우선순위 순)
0-1. (사용자) 운영 배포 후 테크 기사 2편 분류를 '진사이트 소식'으로 변경, 두 번째 기사 제목·본문 첫 언급 '진사이트(Zinsight)' 수정. (승인 시) JSON-LD 이동 경로 Local Hub 항목 제거·articleSection을 분류 이름으로
0. push 전 커밋 있음(9ea3c4a부터). JSON-LD 설명·주소는 새 값으로 맞춤(사용자 승인, siteConfig.jsonLd.address). 대림대·텔링 인용 사례 데이터(질문 원문·날짜·캡처) 받으면 aiCitations 채우고 동의 후 consented=true. 진독 프로필 DB 본사 주소는 관리자에서 사용자 확인
1. push → Vercel 배포로 운영 DB에 inquiries 생성 확인
2. (사용자) Vercel Production 환경변수(Resend 도메인 인증은 완료): RESEND_API_KEY, INQUIRY_MAIL_FROM, INQUIRY_NOTIFY_TO, INQUIRY_IP_SECRET (zindok 연동 시 INQUIRY_EXTERNAL_ORIGINS)
3. 공개 결정 시 pages.services.published=true → index·sitemap·헤더/푸터 "이용 안내" 메뉴 노출
4. (승인 후) Service/Offer JSON-LD — 지금은 기존 services 배열 기반 ItemList 그대로. 안: Service마다 offers{Offer, price, priceCurrency KRW, valueAddedTaxIncluded false, validThrough promo.endsAt}, 상담 후 안내는 offers 생략
5. (시안만) 관리자 /admin/inquiries 목록 메뉴: 접수일·출처·회사·담당자·연락처·관심 상품·상태, 출처·상태 필터
6. (이전) organization_links 단일화 ①~⑤, Vercel Firewall 레이트 리밋(/api/inquiries 포함 검토)

## 결정 사항
- /services 경로 유지, 당분간 noindex — 사용자 결정(2026-11-25)
- 메일은 Resend(fetch, 패키지 없음) — 사용자 승인
- 헤더 "문의"는 zindok.com 대신 /services — 상품 표(메뉴판)부터 보이게(사용자 요청 2026-11-26), 폼은 페이지 안 버튼(#inquiry). 푸터 '진사이트 소개'는 /about 공개 전까지 zindok.com
- 자체 문의 GA4 이벤트: zinsight_register_cta_click(cta_placement), zinsight_inquiry_form_start, zinsight_inquiry_submit. generate_lead·cta_inquiry_click·/api/track은 쓰지 않음 — 고객사 통계와 섞지 않기 위해
- source는 서버가 Origin으로 결정(같은 사이트 zinsight, 허용 외부 origin zindok)
- IP 해시는 INQUIRY_IP_SECRET 전용(다른 비밀값 재사용 안 함). 없으면 DB 기준 제한 생략

## 주의 · 막힌 점
- 저장 실패 시 접수는 메일로만 남음, 메일 키도 없으면 503
- 프로모션 숨김은 revalidate 3600 기준이라 종료 후 최대 1시간 늦을 수 있음
- 헤드리스 스크린샷 스크립트는 scratchpad에 둠(세션 임시). 브라우저 패널이 숨겨지면 navigate 실패
- 기존 스키마 드리프트: organization_submissions invite_id 인덱스 이름 차이(이번 작업과 무관, 손대지 않음)
- 프리뷰도 DATABASE_URL이 운영 DB. 운영 DB는 에이전트가 접속하지 않음
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit)

## 이전 작업 — 남은 확인
- 운영 배포 후 패스키 로그인·LINK_STATS_SECRET 오류 없음·관리자 GA4/GSC 통계 확인, 각 PC .env.local에 GOOGLE_SERVICE_ACCOUNT_JSON
- 정체성 1차 운영 확인, 전시회 패키지 확인

## 핵심 파일
- src/config/site.ts — pricing·crossLink·contact, isPromoActive·formatWon
- src/lib/inquiry.ts — 입력 규칙(클라이언트·서버 공용)
- src/lib/inquiry-store.ts — 저장(prisma.inquiry)·IP 해시·Resend 메일
- src/app/api/inquiries/route.ts — 접수 API(CORS·스팸·요청 제한)
- src/app/(public)/services/page.tsx, src/components/public/services/InquiryForm.tsx — 페이지·폼
- src/components/public/analytics/ZinsightCtaTracker.tsx — 자체 문의 GA4·UTM·진입 경로
- prisma/migrations/20261126000000_add_inquiries — 테이블 생성 (docs/migrations/inquiries.sql은 쿼리안 원본·1년 정리 쿼리)
- src/components/public/layout/public-navbar.tsx — 헤더·모바일 메뉴(지역 지면은 LOCAL_HUB_HREF 하위)

## 확인 방법
- pnpm exec tsc --noEmit
- pnpm dev → /services (noindex·본문), /insight-radar/zindok/links·/insight-radar/zindok 하단 링크
- curl -X POST localhost:3000/api/inquiries -H "Origin: https://evil.example" → 403
