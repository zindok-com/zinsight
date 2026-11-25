-- 진사이트 이용 문의 저장 테이블 (쿼리안, 승인 전 — 실행하지 않음)
-- 승인 후: schema.prisma에 Inquiry 모델(@@map("inquiries")) 추가 → prisma/migrations에 마이그레이션 생성
--          → 개발 DB에 migrate deploy, 운영 DB는 Vercel 배포 시 자동 적용 (수동 실행 금지)
-- 코드: src/lib/inquiry-store.ts가 이 열 이름으로 원시 SQL 저장 (테이블이 없으면 메일만 보냄)
-- source: zinsight(진사이트 /services) | zindok(zindok.com/quote 예정)

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

-- 보관 기간(1년) 정리 — 보고용, 사용자가 실행
-- DELETE FROM inquiries WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
