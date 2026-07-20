-- 기존 매거진 포스트 4개에 대한 테크/마케팅 카테고리 308(영구) 리다이렉트 초기화 SQL
INSERT INTO `redirects` (`source_path`, `target_path`, `permanent`, `created_at`, `updated_at`) VALUES
('/magazine/zindok-b2b-seo-marketing-ai-sales-intelligence', '/magazine/tech-marketing/zindok-b2b-seo-marketing-ai-sales-intelligence', 1, NOW(3), NOW(3)),
('/magazine/bravocamp-astra-carbon-cbam-esg-solution', '/magazine/tech-marketing/bravocamp-astra-carbon-cbam-esg-solution', 1, NOW(3), NOW(3)),
('/magazine/ai-b2b-seo-geo-marketing-zindok', '/magazine/tech-marketing/ai-b2b-seo-geo-marketing-zindok', 1, NOW(3), NOW(3)),
('/magazine/ai-shortform-marketing-automation-supershorts', '/magazine/tech-marketing/ai-shortform-marketing-automation-supershorts', 1, NOW(3), NOW(3));
