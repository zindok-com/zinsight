-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(255) NOT NULL,
    `aliases` JSON NULL,
    `entity_type` VARCHAR(50) NOT NULL DEFAULT '기업',
    `company_url` VARCHAR(255) NULL,
    `business_summary` TEXT NULL,
    `core_keywords` JSON NULL,
    `founded_year` VARCHAR(10) NULL,
    `hq_location` VARCHAR(255) NULL,
    `ceo_name` VARCHAR(100) NULL,
    `key_references` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_company_name_key`(`company_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_industries` (
    `company_id` INTEGER NOT NULL,
    `industry_id` INTEGER NOT NULL,
    `recent_keywords` JSON NULL,
    `recent_status` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`company_id`, `industry_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `article_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_articles_article_id_idx`(`article_id`),
    INDEX `company_articles_company_id_idx`(`company_id`),
    UNIQUE INDEX `company_articles_company_id_article_id_key`(`company_id`, `article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_industries` ADD CONSTRAINT `company_industries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_industries` ADD CONSTRAINT `company_industries_industry_id_fkey` FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_articles` ADD CONSTRAINT `company_articles_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_articles` ADD CONSTRAINT `company_articles_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
