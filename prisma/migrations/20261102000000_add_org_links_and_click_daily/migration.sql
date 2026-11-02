-- 조직 링크 페이지: 관리자 등록 링크 + 링크별 클릭 일자별 집계 (신규 테이블만 추가, 기존 데이터 영향 없음)
-- CreateTable
CREATE TABLE `organization_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `kind` VARCHAR(20) NOT NULL DEFAULT 'custom',
    `display` VARCHAR(10) NOT NULL DEFAULT 'button',
    `subtitle` VARCHAR(100) NULL,
    `thumbnail_url` VARCHAR(512) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `organization_links_organization_id_sort_order_idx`(`organization_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_link_click_daily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `link_key` VARCHAR(64) NOT NULL,
    `link_kind` VARCHAR(20) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `entry` VARCHAR(10) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `organization_link_click_daily_organization_id_link_key_date__key`(`organization_id`, `link_key`, `date`, `entry`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organization_links` ADD CONSTRAINT `organization_links_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_link_click_daily` ADD CONSTRAINT `organization_link_click_daily_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

