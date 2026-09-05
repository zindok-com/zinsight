-- CreateTable
CREATE TABLE IF NOT EXISTS `analytics_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityType` VARCHAR(20) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `entityName` VARCHAR(255) NOT NULL,
    `reportType` VARCHAR(20) NOT NULL,
    `periodDays` INTEGER NOT NULL,
    `dataSnapshot` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `analytics_reports_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;