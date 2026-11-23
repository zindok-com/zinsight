# HANDOFF — zinsight
갱신: 2026-11-23 01:47 (KST) · PC: DESKTOP-D7TTIN2 · 브랜치: main (origin/main보다 6커밋 앞섬, push 안 함)

## 목표
AI 활용 리포트 점검 항목 정리 — 비밀값·env·패스키·저장소 위생(1~5) 구현 완료, organization_links 단일화(6)·레이트 리밋(7)은 계획·보고만
(이전 목표: 공식 채널 데이터화·카드·영상 통계 — 완료, 운영 확인 항목은 아래 '이전 작업')

## 현재 상태
- 완료: LINK_STATS_SECRET 필수화 (커밋 cd14c29)
  - getLinkStatsSecret(src/lib/link-stats-secret.ts) — NEXTAUTH_SECRET·JWT_SECRET 대신 쓰기 제거. 개발 외 환경은 값 없으면 src/instrumentation.ts register()에서 서버 시작 중단, 개발은 경고 + 개발 전용 값
  - 운영 Vercel에는 11/5부터 값 있음(사용자 화면 확인) → 데이터 변화 없음
- 완료: 패스키 RP ID 고정 (커밋 1346434) — relyingParty()(src/lib/passkey.ts)가 WEBAUTHN_RP_ID·WEBAUTHN_ORIGINS만 사용. 개발은 localhost / http://localhost:3000. 값 없는 비개발 환경은 패스키 API 503(비밀번호 로그인은 정상)
- 완료: .env.example 갱신 (커밋 7886844) — 코드가 읽는 키 전부(VERCEL_ENV 제외). NEXTAUTH_SECRET은 코드에서 안 읽어 미추가
- 완료: 저장소 정리 (커밋 5a915aa) — tsconfig.tsbuildinfo·next-env.d.ts 추적 해제(Next 16 문서 권장 ignore), .claude/settings.local.json ignore, 루트 AGENTS.md 제거 + next.config.js agentRules: false(next dev가 다시 만들지 않음, 확인함)
- 완료: 비밀값 노출 방지 (커밋 981e98a) — .claude/settings.json deny(env·서비스 계정 키 Read, cat/Get-Content), .agents/AGENTS.md 0-3 규칙
- 확인: pnpm exec tsc --noEmit 통과, dev에서 패스키 옵션 rpId=localhost, 운영·개발 환경값별 동작은 함수 단위 실행으로 확인. 실제 운영 배포·패스키 로그인은 미확인

## 다음 할 일 (우선순위 순)
1. (사용자, push 전 필수) Vercel 환경변수
   - Production에 WEBAUTHN_RP_ID=www.zinsight.co.kr 추가 (없으면 운영 패스키 로그인 503)
   - Preview에 LINK_STATS_SECRET 추가 (현재 Production만 → 없으면 프리뷰 배포가 시작 시 중단). 운영과 다른 값 권장, 단 프리뷰도 운영 DB를 쓰므로 프리뷰에서는 운영 공유 링크 '복사'가 안 됨
2. push 후 운영에서 패스키 로그인 확인. 프리뷰 주소에서 등록한 패스키가 있으면 더는 안 됨 — 확인 쿼리(사용자 실행): admin_passkeys JOIN admins로 username·device_name·created_at·last_used_at 조회 (rpId 열은 없음, 기기에만 저장)
3. organization_links 단일화 (목표: 전시회 파일럿 참가사 등록 전, 단계마다 승인)
   - ① 채널 없는데 옛 값 있는 조직 조회(읽기 쿼리) → ② scripts/migrate-org-channels.ts 미리보기 후 사용자 --apply
   - ③ 읽기 전환: analytics-actions.ts(398), aeo-actions.ts(411·583), company-list-table.tsx(222), insight-radar-actions.ts(486), org-links.ts deriveDefaultOrgLinks, org-link-actions.ts legacy 모드, org-link-page.ts legacyCardLinks, org-channels.ts resolveOrgChannels 대신 쓰기 경로
   - ④ 쓰기 중단: channelsMirror → org-channel-store.ts(44), api/companies/import/route.ts(75·83·102)
   - ⑤ 삭제 마이그레이션: companies.backlinks·organization_links (company_url은 ③ 후 결정). 전에 link:·auto: 클릭 0 확인(docs/migrations/org-channels-verify.sql)
4. (선택) Vercel Firewall 레이트 리밋 규칙: /api/auth/login·verify-2fa·passkey/* 우선, /share/stats/*·/api/track은 선택. 요금제 제공 여부 확인 필요
5. (이전) 운영 검증 쿼리 org-channels-verify.sql 재실행, 진독 카드 휴대폰 video_auto→video 확인, getChannelGroupClicks 화면 연결, site.ts 교체

## 결정 사항
- 비밀값은 용도별로 분리, 다른 비밀값으로 대신하지 않음 — 이유: 하나가 새면 다른 용도까지 뚫림
- LINK_STATS_SECRET는 개발 외 모든 환경(프리뷰 포함) 필수 — 사용자 승인(A)
- LINK_STATS_SECRET 설명은 코드 동작대로: 바꿔도 공유 링크는 열림(SHA-256 해시, 비밀값 무관). 끊기는 것은 관리자 '복사'·당일 순방문·방문 기업 해시 연속성 — 사용자 승인(B)
- 패스키 RP ID는 www.zinsight.co.kr — 이유: apex는 www로 301, 기존 패스키 재등록 불필요 (C)
- 공유 링크 레이트 리밋은 메모리 기반 유지 — 이유: 토큰 256비트라 대입 불가, 제한은 DB 부하 방지용

## 주의 · 막힌 점
- 프리뷰도 DATABASE_URL이 운영 DB(Vercel 'Production and Preview'). 프리뷰에서 만든 데이터는 운영에 쌓임
- 레이트 리밋은 인스턴스별 메모리(src/lib/rate-limit.ts) — 서버리스에서 실제 한도는 인스턴스 수 × 한도
- settings.json deny는 Read와 흔한 출력 명령만 막음. 다른 셸 우회는 규칙(.agents/AGENTS.md 0-3)에 의존
- 운영 DB: 도커 안 MariaDB, 사용자가 Termius로 직접 작업. 에이전트는 운영 DB에 접속하지 않음
- 운영 DB 스크립트: PowerShell에서 $env:DATABASE_URL(운영)·$env:TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' 후 npx ts-node -T scripts/..., 끝나면 Remove-Item Env:DATABASE_URL
- 터널(pnpm db:tunnel)은 개발 DB 전용. 개발 DB 스키마 드리프트 있음(organization_invites·submissions 인덱스·FK 이름)
- .env 주석에 운영 DB 접속 정보 평문(커밋 안 됨). 비밀번호 교체 검토 권장
- 작업 규칙: pnpm build 금지(pnpm dev, pnpm exec tsc --noEmit), DB 스키마·데이터 변경은 사용자 승인 후
- 영상·애니메이션 검증은 헤드리스 Chrome(브라우저 패널 숨김 시 멈춤). 관리자 화면은 dev 전용 테스트 토큰(src/lib/token-config.ts)

## 이전 작업 — 남은 확인
- 정체성 1차 운영 확인(메인 제목·헤더 메뉴·푸터·/about·/services noindex·parentOrganization), tagline SQL 승인
- 전시회 패키지: 공유 링크·추가 자료·한글 파일명 확인, 운영 테스트 리드 삭제 승인

## 핵심 파일
- src/lib/link-stats-secret.ts, src/instrumentation.ts — 링크 통계 비밀값, 시작 시 검사
- src/lib/passkey.ts — relyingParty(환경변수 고정), 챌린지·세션
- src/lib/stats-share.ts — 공유 링크 토큰 해시·원문 암호화
- src/lib/rate-limit.ts, src/app/share/stats/[token]/load-shared-stats.ts — 레이트 리밋
- src/lib/org-channels.ts, org-channel-store.ts, org-link-page.ts — 공식 채널·옛 열 호환
- .claude/settings.json, .agents/AGENTS.md — 에이전트 차단·규칙
- .env.example — 환경변수 목록

## 확인 방법
- pnpm exec tsc --noEmit
- pnpm dev → /login에서 fetch('/api/auth/passkey/login/options',{method:'POST'}) 응답 options.rpId = localhost
- pnpm db:tunnel(개발 DB) → /admin/companies/233, /insight-radar/zindok/links
