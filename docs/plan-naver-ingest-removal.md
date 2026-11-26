# 네이버 기사 수집 제거 (저작권 — 외부 수집 기사 데이터까지 완전히 제거)

결정(2026-11-26): C안. 배포를 두 번으로 나눈다.

## 배포 1 — 코드 제거만 (DB 변경 없음) ✅ push함(2026-11-26), 운영 확인 전
- 수집 코드 `ingest-actions.ts`, 키워드 `keyword-actions.ts`·`/admin/keywords`, 기사 관리 `/admin/articles`(지역별 포함)·`article-actions.ts`, 내보내기 `/admin/export`·`export-actions.ts`·`/api/snapshots`, 쓰이지 않던 `/api/companies/[id]` 삭제
- 공개 화면: 기업 프로필 기사 목록·JSON-LD subjectOf·기사 수·최근 활동일을 매거진 기사만으로. `/insight-radar` 통계에서 수집 기사 수 제거. 메인의 쓰지 않던 최신 기사·트렌드 키워드 조회와 그 컴포넌트 2개 삭제
- AEO 점수: 조직의 `newsArticleCount`를 0으로(외부 기사 가점 −4 또는 −8 사라짐. 기사 단위 진단은 그대로)
- 관리자: 사이드바 3개 메뉴, 대시보드 키워드·수집 기사 카드 → 등록 조직·발행 매거진 기사, 조직 편집의 기사 검색·연결·수집 → 연결된 매거진 기사 목록, 조직 목록 기사 수, 조직 가져오기(JSON)의 기사 연결
- 저장소 데이터: `project_data/insight_radar_result.json`·`import_template.json`의 `related_articles`(수집 기사 제목·요약) 삭제. git 이력에는 남아 있음
- 문서: `.env.example`·README·ZINSIGHT_STRUCTURE_GUIDE의 네이버 API·수집·내보내기 항목 삭제
- 남겨 둔 것: Prisma 모델 `SearchKeyword`·`Article`·`ArticleIngestion`·`CompanyArticle`(배포 2에서 삭제), `axios` 의존성(이제 쓰는 곳 없음), `project_data/keyword_data.json`(옛 수집 키워드 목록, 기사 본문 없음)

## 배포 2 — 테이블 삭제 ✅ 마이그레이션 20261126210000_drop_external_article_tables, 개발 DB 적용함, push함(2026-11-26), 운영 빌드 확인 전
- 배포 1 운영 정상 확인(사용자). 행 수·AEO 전후 값 보고는 생략(사용자: AEO는 의미 없는 데이터)
- Prisma가 만든 SQL(외래 키 이름으로 먼저 삭제)은 운영 키 이름이 다르면 중간 실패 위험 → 참조하는 쪽부터 DROP TABLE IF EXISTS로 작성

지울 대상(스키마 기준)
| 테이블 | 외래 키 (나가는 쪽) | 들어오는 외래 키 |
|---|---|---|
| article_ingestions | article_id→articles, region_id→regions, keyword_id→search_keywords, organization_id→organizations | 없음 |
| company_articles | company_id→organizations (CASCADE), article_id→articles (CASCADE) | 없음 |
| search_keywords | region_id→regions | article_ingestions.keyword_id |
| articles | 없음 | article_ingestions.article_id, company_articles.article_id |
- 삭제 순서: article_ingestions → company_articles → search_keywords → articles (참조하는 쪽부터)
- 스키마: 위 4개 모델과 `Region.keywords`·`Region.ingestions`, `Organization.company_articles`·`Organization.ingestions` 관계 필드 삭제. 다른 테이블의 컬럼은 바뀌지 않음(외래 키는 모두 지우는 테이블 쪽에 있음)
- 마이그레이션은 별도 커밋, 개발 DB에서 먼저 `prisma migrate deploy`로 확인

### 운영 적용 전 임시 덤프 — 하지 않기로 함(사용자 2026-11-26, 데이터 보관 안 함). 참고용으로만 남김
```
mysqldump --single-transaction --no-tablespaces -h <호스트> -P <포트> -u <계정> -p <DB이름> article_ingestions company_articles search_keywords articles > zinsight-ext-articles-<날짜>.sql
```
- 덤프 파일에도 수집 기사가 들어 있으므로 저장소·공유 폴더(OneDrive 포함)에 두지 말고, 보관 기간을 정해 지운다

### 자동 마이그레이션 동작 (Vercel 빌드 명령 `npx prisma migrate deploy && next build`)
- `prisma/migrations`의 아직 적용되지 않은 폴더를 이름(타임스탬프) 순서대로 하나씩 적용하고 `_prisma_migrations`에 기록
- 하나가 실패하면 그 마이그레이션을 실패로 기록하고 명령이 실패 → `&&` 때문에 `next build`가 실행되지 않음 → 배포 실패, 운영은 이전 배포가 그대로 서비스됨
- MySQL의 DDL(DROP TABLE)은 트랜잭션으로 되돌려지지 않음. 여러 문장 중간에 실패하면 앞 문장은 이미 적용된 상태로 남음. 이후 배포는 P3009로 막히며, DB 상태를 확인한 뒤 `prisma migrate resolve --applied` 또는 `--rolled-back`으로 풀어야 함
- 그래서 DROP은 `IF EXISTS`로 쓰고, 참조하는 쪽 테이블부터 지운다

## 마무리 (사용자)
- Vercel 환경변수 NAVER_CLIENT_ID·NAVER_CLIENT_SECRET 삭제 (Production·Preview·Development)
- 네이버 개발자센터에서 해당 애플리케이션 삭제
