import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_WEBP_QUALITY } from '@/lib/image-variants';

/**
 * 업로드 이미지를 WebP로 변환 (서버 전용).
 * EXIF 회전을 반영한 뒤 메타데이터는 버림 (sharp는 withMetadata 없이 출력하면 EXIF·GPS 등을 제거).
 */
export async function toWebp(input: Buffer, maxWidth: number = IMAGE_MAX_WIDTH): Promise<Buffer> {
    return sharp(input)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: IMAGE_WEBP_QUALITY })
        .toBuffer();
}
