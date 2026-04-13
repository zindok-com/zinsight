-- Drop Foreign Keys
ALTER TABLE `search_keywords` DROP FOREIGN KEY `search_keywords_exhibition_id_fkey`;
ALTER TABLE `article_ingestions` DROP FOREIGN KEY `article_ingestions_exhibition_id_fkey`;

-- Rename Table
RENAME TABLE `exhibitions` TO `industries`;

-- Rename Columns
ALTER TABLE `search_keywords` RENAME COLUMN `exhibition_id` TO `industry_id`;
ALTER TABLE `article_ingestions` RENAME COLUMN `exhibition_id` TO `industry_id`;

-- Add Foreign Keys Back
ALTER TABLE `search_keywords` ADD CONSTRAINT `search_keywords_industry_id_fkey` FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `article_ingestions` ADD CONSTRAINT `article_ingestions_industry_id_fkey` FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- We ignore index renames here, Prisma will recreate them if needed. But it's better to just drop the old index and add a new one or let Prisma handle it. Wait, to avoid data loss error, we can just let Prisma rename the indexes. Actually Prisma recreate indexes when names change.

-- Update Data as Requested
UPDATE `industries` SET `name` = 'LED, 광융합', `slug` = 'led-optical', `description` = 'LED 및 광융합 산업' WHERE `id` = 1;