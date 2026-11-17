-- CreateTable
CREATE TABLE `admin_passkeys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `credential_id` VARCHAR(512) NOT NULL,
    `public_key` BLOB NOT NULL,
    `counter` BIGINT NOT NULL DEFAULT 0,
    `transports` VARCHAR(100) NULL,
    `device_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,

    UNIQUE INDEX `admin_passkeys_credential_id_key`(`credential_id`),
    INDEX `admin_passkeys_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_passkeys` ADD CONSTRAINT `admin_passkeys_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
