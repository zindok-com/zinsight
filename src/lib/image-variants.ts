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
/** 일괄 재압축 전 원본 백업 (보관함 목록·미사용 정리 대상에서 제외되어 자동 삭제되지 않음) */
export const IMAGE_BACKUP_PREFIX = '_backup/';

export function isInternalStorageKey(key: string): boolean {
    return (
        key.startsWith(UPLOAD_TEMP_PREFIX) ||
        key.startsWith(IMAGE_VARIANT_PREFIX) ||
        key.startsWith(IMAGE_BACKUP_PREFIX)
    );
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

/**
 * Next 내장 이미지 최적화 사용 여부. 기본은 꺼짐(images.unoptimized) — Vercel 이미지 변환 한도 절약.
 * 자체 서버(NCP) 이전 후 NEXT_PUBLIC_IMAGE_OPTIMIZATION=on으로 다시 켠다.
 */
export const IMAGE_OPTIMIZATION_ON = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION === 'on';

/**
 * 목록 카드처럼 작게 보이는 이미지는 640px 버전 주소로 바꿔 쓴다.
 * 최적화가 켜져 있거나, 우리 버킷 이미지가 아니거나, 640px 버전이 없는 형식이면 원래 주소 그대로.
 */
export function cardImageSrc(url: string): string;
export function cardImageSrc(url: string | null | undefined): string | null | undefined;
export function cardImageSrc(url: string | null | undefined) {
    if (!url || IMAGE_OPTIMIZATION_ON) return url;
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith('ncloudstorage.com')) return url;
        const [, bucket, ...rest] = parsed.pathname.split('/');
        const key = rest.join('/');
        if (!bucket || !hasImageVariant(key)) return url;
        return `${parsed.origin}/${bucket}/${variantKeyOf(key)}`;
    } catch {
        return url;
    }
}
