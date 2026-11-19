-- CreateTable
CREATE TABLE `stats_share_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `token_enc` VARCHAR(255) NULL,
    `default_from` DATE NULL,
    `default_to` DATE NULL,
    `expires_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `last_viewed_at` DATETIME(3) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stats_share_links_token_hash_key`(`token_hash`),
    INDEX `stats_share_links_organization_id_idx`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stats_share_links` ADD CONSTRAINT `stats_share_links_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
