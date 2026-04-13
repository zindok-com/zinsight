-- RedefineIndex
CREATE INDEX `article_ingestions_industry_id_idx` ON `article_ingestions`(`industry_id`);
DROP INDEX `article_ingestions_exhibition_id_idx` ON `article_ingestions`;

-- RedefineIndex
CREATE INDEX `industries_slug_deleted_at_idx` ON `industries`(`slug`, `deleted_at`);
DROP INDEX `exhibitions_slug_deleted_at_idx` ON `industries`;

-- RedefineIndex
CREATE UNIQUE INDEX `industries_slug_key` ON `industries`(`slug`);
DROP INDEX `exhibitions_slug_key` ON `industries`;

-- RedefineIndex
CREATE INDEX `search_keywords_industry_id_is_active_deleted_at_idx` ON `search_keywords`(`industry_id`, `is_active`, `deleted_at`);
DROP INDEX `search_keywords_exhibition_id_is_active_deleted_at_idx` ON `search_keywords`;
