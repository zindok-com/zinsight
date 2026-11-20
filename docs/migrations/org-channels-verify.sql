-- 공식 채널 이전 검증 쿼리 (읽기 전용). 이전 전·후 두 번 실행해 비교
-- 기대: clicks_total·raw_clicks는 전후 같음 / 이전 후 clicks_auto + clicks_link = 0 (매핑 안 한 항목은 스크립트 출력에 나옴)
-- channels는 src_links 이하 (같은 주소를 합친 만큼 줄어듦)
SELECT c.id, c.company_name,
  IFNULL(JSON_LENGTH(c.backlinks),0) + (c.brochure_url IS NOT NULL) + IFNULL(JSON_LENGTH(c.extra_materials),0) AS src_links,
  (SELECT COUNT(*) FROM organization_links l WHERE l.organization_id=c.id) AS legacy_card_links,
  (SELECT COUNT(*) FROM organization_channels ch WHERE ch.organization_id=c.id AND ch.deleted_at IS NULL) AS channels,
  (SELECT IFNULL(SUM(count),0) FROM link_page_daily d WHERE d.organization_id=c.id AND d.event='click') AS clicks_total,
  (SELECT IFNULL(SUM(count),0) FROM link_page_daily d WHERE d.organization_id=c.id AND d.event='click' AND d.link_key LIKE 'auto:%') AS clicks_auto,
  (SELECT IFNULL(SUM(count),0) FROM link_page_daily d WHERE d.organization_id=c.id AND d.event='click' AND d.link_key LIKE 'link:%') AS clicks_link,
  (SELECT IFNULL(SUM(count),0) FROM link_page_daily d WHERE d.organization_id=c.id AND d.event='click' AND d.link_key LIKE 'ch:%') AS clicks_ch,
  (SELECT COUNT(*) FROM link_page_events e WHERE e.organization_id=c.id AND e.event='click') AS raw_clicks
FROM companies c ORDER BY c.id;

-- 채널 종류 분포 (이전 후)
SELECT channel_type, COUNT(*) n, SUM(is_primary) primaries FROM organization_channels WHERE deleted_at IS NULL GROUP BY channel_type ORDER BY n DESC;

-- 대표 홈페이지가 2개 이상인 조직 (0행이어야 함)
SELECT organization_id, COUNT(*) FROM organization_channels WHERE deleted_at IS NULL AND is_primary=1 GROUP BY organization_id HAVING COUNT(*) > 1;
