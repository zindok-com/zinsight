-- AlterTable
ALTER TABLE `admins` 
ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `two_factor_secret` VARCHAR(100) NULL,
ADD COLUMN `two_factor_temp` VARCHAR(100) NULL;
