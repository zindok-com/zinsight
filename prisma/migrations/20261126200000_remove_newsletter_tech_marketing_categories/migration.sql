-- 데이터: 쓰지 않는 매거진 분류 '뉴스레터'(newsletter)·'디지털 마케팅'(tech-marketing) 삭제 (사용자 요청 2026-11-26)
-- 1) 두 분류에 남은 기사는 '진사이트 소식'(zinsight-news)으로 옮김. 기사 주소(/magazine/tech-marketing/{slug})는 분류와 상관없이 그대로
--    진사이트 소식 분류가 없으면 아무것도 옮기지 않음
UPDATE `magazine_posts` p
JOIN `magazine_categories` old_cat ON old_cat.`id` = p.`category_id` AND old_cat.`slug` IN ('newsletter', 'tech-marketing')
JOIN `magazine_categories` news_cat ON news_cat.`slug` = 'zinsight-news'
SET p.`category_id` = news_cat.`id`;

-- 2) 기사가 하나도 없는 경우에만 분류 삭제 (옮기지 못한 기사가 있으면 분류는 남김)
DELETE c FROM `magazine_categories` c
WHERE c.`slug` IN ('newsletter', 'tech-marketing')
  AND NOT EXISTS (SELECT 1 FROM `magazine_posts` p WHERE p.`category_id` = c.`id`);
