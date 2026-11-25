-- CreateTable
CREATE TABLE `inquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` VARCHAR(20) NOT NULL,
    `company_name` VARCHAR(200) NOT NULL,
    `contact_name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(255) NULL,
    `products` JSON NULL,
    `message` VARCHAR(2000) NULL,
    `page_path` VARCHAR(500) NULL,
    `utm` JSON NULL,
    `ip_hash` CHAR(32) NULL,
    `consent_at` DATETIME(3) NOT NULL,
    `notified_at` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inquiries_source_created_at_idx`(`source`, `created_at`),
    INDEX `inquiries_ip_hash_created_at_idx`(`ip_hash`, `created_at`),
    INDEX `inquiries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
