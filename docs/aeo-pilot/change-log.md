# 사이트 변경 이력

AEO 파일럿 기간(2026-10-28 ~ 12월 중순)에 측정 결과에 영향을 줄 수 있는 변경을 기록한다.
**기준선 측정 기간(2026-11-01 ~ 11-14) 중 변경은 반드시 기록한다.**

기록 대상:
- 진사이트: 나리보 프로필·관련 기사, 사이트 전체에 영향을 주는 변경(robots.txt, sitemap, JSON-LD, 메타, 렌더링 방식, llms.txt, 리다이렉트, 배포 장애 등)
- 나리보 자체 사이트(narrivo.io 계열)와 대조군 사이트의 눈에 띄는 변경(알게 된 경우)
- 외부 요인: 나리보 언론 보도, 엔진 측 모델·검색 기능 업데이트 등

영향 범위 표기: `나리보만` / `진사이트 전체` / `대조군` / `엔진` / `기타`

| 날짜 | 변경 내용 | 영향 범위 | 기록자 | 비고 |
|---|---|---|---|---|
| 2026-10-09 | 나리보 기사 게재: `/magazine/local/uiwang/career-analysis-narrivo-profile` (진사이트 PARTNER) | 나리보만 | (사전 기록) | 파일럿 설계 이전 게재. 기준선은 게재 후 시점임 |
|  |  |  |  |  |

---

## 기준선 시작 전 사이트 상태 (2026-10-27 확인)

기준선 이후 변경과 비교하기 위한 출발점. 코드는 `main` 브랜치 `86d0a3d` 기준.

- robots.txt: 모든 봇에 `/` 허용, `/admin` `/login` `/register` `/api`만 차단. AI 봇별 규칙 없음(= GPTBot 등 허용)
- llms.txt: 없음 (`/llms.txt` → 404)
- sitemap.xml: 매거진 기사, 조직 프로필(`/insight-radar/{slug}`), 필진 포함, 1시간 주기 재생성
- 나리보 프로필 `/insight-radar/narrivo`: ISR(1시간), 본문 서버 렌더링, JSON-LD(ProfilePage + BreadcrumbList + Organization, makesOffer·knowsAbout·sameAs·subjectOf 포함)
- 나리보 기사: ISR(1시간), 본문 서버 렌더링, JSON-LD(BreadcrumbList + NewsArticle, about/mentions로 프로필 연결)
- 나리보 자체 사이트 `narrivo.io`: robots.txt·llms.txt 경로가 HTML 페이지를 반환함(별도 파일 없는 것으로 보임)
