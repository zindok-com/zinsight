-- 데이터: 매거진 분류 '진사이트 소식' 추가 (공지성, 지역 분류 아님 → 기사 주소는 /magazine/tech-marketing/{slug} 유지)
-- 이미 있으면 건너뜀. 기사 이관(분류 변경)은 관리자 화면에서 진행
INSERT IGNORE INTO `magazine_categories` (`name`, `slug`, `description`, `isLocal`)
VALUES ('진사이트 소식', 'zinsight-news', '진사이트 공지·소식 (상단 메뉴 대신 푸터 링크로만 노출)', false);
