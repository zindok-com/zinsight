-- CreateTable
CREATE TABLE `organization_channels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `channel_type` VARCHAR(30) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `label` VARCHAR(100) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `organization_channels_organization_id_sort_order_idx`(`organization_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_card_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `channel_id` INTEGER NOT NULL,
    `display` VARCHAR(10) NOT NULL DEFAULT 'button',
    `subtitle` VARCHAR(100) NULL,
    `thumbnail_url` VARCHAR(512) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organization_card_items_channel_id_key`(`channel_id`),
    INDEX `organization_card_items_organization_id_sort_order_idx`(`organization_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organization_channels` ADD CONSTRAINT `organization_channels_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_card_items` ADD CONSTRAINT `organization_card_items_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_card_items` ADD CONSTRAINT `organization_card_items_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `organization_channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
