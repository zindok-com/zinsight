-- AlterTable: 조직 목록 한 줄 소개와 공개 문의 이메일·전화 (모두 NULL 허용, 기존 데이터 영향 없음)
ALTER TABLE `companies`
    ADD COLUMN `contact_email` VARCHAR(255) NULL,
    ADD COLUMN `contact_phone` VARCHAR(50) NULL,
    ADD COLUMN `tagline` VARCHAR(60) NULL;
