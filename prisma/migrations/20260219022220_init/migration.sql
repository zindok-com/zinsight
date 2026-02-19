-- CreateTable
CREATE TABLE `exhibitions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exhibitions_slug_key`(`slug`),
    INDEX `exhibitions_slug_deleted_at_idx`(`slug`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exhibition_id` INTEGER NOT NULL,
    `keyword_text` VARCHAR(255) NOT NULL,
    `keyword_type` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_fetched_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `search_keywords_exhibition_id_is_active_deleted_at_idx`(`exhibition_id`, `is_active`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `canonical_link` VARCHAR(2048) NOT NULL,
    `link` VARCHAR(2048) NULL,
    `originallink` VARCHAR(2048) NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `pub_date` DATETIME(3) NULL,
    `source` VARCHAR(50) NOT NULL DEFAULT 'NAVER_NEWS',
    `raw_json` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `articles_canonical_link_key`(`canonical_link`),
    INDEX `articles_created_at_idx`(`created_at`),
    INDEX `articles_pub_date_idx`(`pub_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_ingestions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `article_id` INTEGER NOT NULL,
    `exhibition_id` INTEGER NOT NULL,
    `keyword_id` INTEGER NOT NULL,
    `fetched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_duplicate` BOOLEAN NOT NULL DEFAULT false,

    INDEX `article_ingestions_exhibition_id_idx`(`exhibition_id`),
    INDEX `article_ingestions_keyword_id_idx`(`keyword_id`),
    UNIQUE INDEX `article_ingestions_article_id_keyword_id_key`(`article_id`, `keyword_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `search_keywords` ADD CONSTRAINT `search_keywords_exhibition_id_fkey` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_ingestions` ADD CONSTRAINT `article_ingestions_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_ingestions` ADD CONSTRAINT `article_ingestions_exhibition_id_fkey` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_ingestions` ADD CONSTRAINT `article_ingestions_keyword_id_fkey` FOREIGN KEY (`keyword_id`) REFERENCES `search_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
