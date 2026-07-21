-- AlterTable
ALTER TABLE `magazine_posts` 
    DROP COLUMN `headlinePriority`,
    DROP COLUMN `localHeadlinePriority`,
    DROP COLUMN `techHeadlinePriority`,
    ADD COLUMN `isInHomeSection` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPortalFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `portalSidePriority` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isTechFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isLocalFeatured` BOOLEAN NOT NULL DEFAULT false;
