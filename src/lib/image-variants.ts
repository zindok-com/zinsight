/**
 * 업로드 이미지 변환 규칙의 상수·키 규칙 (sharp 없이 클라이언트에서도 import 가능)
 * - 가로 최대 1600px (작은 이미지는 확대하지 않음), WebP 품질 80
 * - images/·thumbnails/는 목록 카드용 640px 버전을 _640/ 아래에 함께 저장
 */
export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_VARIANT_WIDTH = 640;
export const IMAGE_WEBP_QUALITY = 80;

/** 변환 대상 래스터 형식 (GIF는 애니메이션, SVG는 벡터라 원본 유지) */
export const PROCESSABLE_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'avif'];

/** 640px 버전을 만드는 폴더 */
export const VARIANT_FOLDERS = ['images', 'thumbnails'];

/** 버킷 내부용 경로: 보관함 목록·사용처 판정에서 제외 */
export const UPLOAD_TEMP_PREFIX = '_incoming/';
export const IMAGE_VARIANT_PREFIX = '_640/';

export function isInternalStorageKey(key: string): boolean {
    return key.startsWith(UPLOAD_TEMP_PREFIX) || key.startsWith(IMAGE_VARIANT_PREFIX);
}

/** 원본 키의 640px 버전 키. 예) images/a.webp → _640/images/a.webp, images/a.png → _640/images/a.png.webp */
export function variantKeyOf(key: string): string {
    return `${IMAGE_VARIANT_PREFIX}${key}${key.toLowerCase().endsWith('.webp') ? '' : '.webp'}`;
}

/** 640px 버전이 있어야 하는 원본 키인지 */
export function hasImageVariant(key: string): boolean {
    const folder = key.split('/')[0];
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return VARIANT_FOLDERS.includes(folder) && PROCESSABLE_IMAGE_EXTS.includes(ext);
}
