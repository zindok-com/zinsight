-- 네이버 기사 수집 제거 배포 2: 외부 수집 기사 데이터 삭제 (저작권). 되돌릴 수 없음, 덤프 없이 진행(사용자 결정 2026-11-26)
-- 외래 키는 모두 지우는 테이블 쪽에 있어 테이블을 지우면 함께 사라진다.
-- 참조하는 쪽부터 지우고, 일부만 적용된 뒤 다시 실행돼도 멈추지 않도록 IF EXISTS를 쓴다.

-- 수집 기록 (→ articles, search_keywords, regions, organizations)
DROP TABLE IF EXISTS `article_ingestions`;

-- 조직-기사 연결 (→ organizations, articles)
DROP TABLE IF EXISTS `company_articles`;

-- 수집 키워드 (→ regions)
DROP TABLE IF EXISTS `search_keywords`;

-- 수집 기사 원본
DROP TABLE IF EXISTS `articles`;
