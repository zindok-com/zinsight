-- AlterTable
ALTER TABLE `qr_links` ADD COLUMN `channel` VARCHAR(20) NOT NULL DEFAULT 'businesscard',
    ADD COLUMN `label` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `link_page_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `event` VARCHAR(10) NOT NULL,
    `link_key` VARCHAR(64) NULL,
    `link_kind` VARCHAR(10) NULL,
    `source_code` VARCHAR(50) NOT NULL DEFAULT 'direct',
    `device` VARCHAR(10) NOT NULL,
    `visitor_hash` CHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `link_page_events_organization_id_created_at_idx`(`organization_id`, `created_at`),
    INDEX `link_page_events_organization_id_visitor_hash_created_at_idx`(`organization_id`, `visitor_hash`, `created_at`),
    INDEX `link_page_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `link_page_daily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `source_code` VARCHAR(50) NOT NULL,
    `event` VARCHAR(10) NOT NULL,
    `link_key` VARCHAR(64) NOT NULL DEFAULT '',
    `link_kind` VARCHAR(10) NOT NULL DEFAULT '',
    `label` VARCHAR(100) NOT NULL DEFAULT '',
    `count` INTEGER NOT NULL DEFAULT 0,
    `unique_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `link_page_daily_organization_id_date_idx`(`organization_id`, `date`),
    UNIQUE INDEX `link_page_daily_organization_id_date_source_code_event_link__key`(`organization_id`, `date`, `source_code`, `event`, `link_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `link_page_events` ADD CONSTRAINT `link_page_events_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `link_page_daily` ADD CONSTRAINT `link_page_daily_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
