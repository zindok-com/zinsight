-- AlterTable: 조직 소개 영상·소개자료·문의 연결처 (모두 NULL 허용, 기존 데이터 영향 없음)
ALTER TABLE `companies`
    ADD COLUMN `video_url` VARCHAR(512) NULL,
    ADD COLUMN `video_poster_url` VARCHAR(512) NULL,
    ADD COLUMN `brochure_url` VARCHAR(512) NULL,
    ADD COLUMN `inquiry_url` VARCHAR(512) NULL;

-- CreateTable: 명함 QR 연결 주소
CREATE TABLE `qr_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `mode` VARCHAR(20) NOT NULL DEFAULT 'profile',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `qr_links_code_key`(`code`),
    INDEX `qr_links_organization_id_idx`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: QR 스캔 일자별 집계
CREATE TABLE `qr_scan_daily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `qr_link_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `device` VARCHAR(10) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `qr_scan_daily_qr_link_id_date_device_key`(`qr_link_id`, `date`, `device`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `qr_links` ADD CONSTRAINT `qr_links_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `qr_scan_daily` ADD CONSTRAINT `qr_scan_daily_qr_link_id_fkey` FOREIGN KEY (`qr_link_id`) REFERENCES `qr_links`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
