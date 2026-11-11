-- CreateTable
CREATE TABLE `link_page_leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(255) NULL,
    `memo` VARCHAR(500) NULL,
    `source_code` VARCHAR(50) NOT NULL DEFAULT 'direct',
    `device` VARCHAR(10) NOT NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `link_page_leads_organization_id_created_at_idx`(`organization_id`, `created_at`),
    INDEX `link_page_leads_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `link_page_leads` ADD CONSTRAINT `link_page_leads_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
