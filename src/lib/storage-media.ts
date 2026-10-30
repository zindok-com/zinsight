/**
 * 미디어 보관함 공용 규칙 (서버·클라이언트 공용, 'use server' 아님)
 * - 파일 종류 판별, 종류별 업로드 용량 상한, 표시 포맷
 */

export type MediaKind = 'image' | 'video' | 'logo' | 'document';

export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
    image: '이미지',
    video: '영상',
    logo: '로고',
    document: '첨부',
};

export const MEDIA_KINDS: MediaKind[] = ['image', 'video', 'logo', 'document'];

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogg']);

export function getFileExtension(pathname: string): string {
    const name = pathname.split('/').pop() ?? '';
    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/** 버킷 키(폴더/파일명)로 종류 판별. 로고 폴더는 이미지여도 로고로 분류 */
export function getMediaKind(pathname: string): MediaKind {
    const folder = pathname.includes('/') ? pathname.slice(0, pathname.indexOf('/')) : '';
    const ext = getFileExtension(pathname);
    if (VIDEO_EXTS.has(ext)) return 'video';
    if (folder === 'logos') return 'logo';
    if (folder === 'attachments' || !IMAGE_EXTS.has(ext)) return 'document';
    return 'image';
}

/** 업로드 폴더별 최대 용량(바이트) */
export const UPLOAD_SIZE_LIMIT: Record<'thumbnails' | 'images' | 'logos' | 'attachments' | 'videos', number> = {
    thumbnails: 10 * 1024 * 1024,
    images: 10 * 1024 * 1024,
    logos: 10 * 1024 * 1024,
    attachments: 50 * 1024 * 1024,
    videos: 300 * 1024 * 1024,
};

/** 일괄 정리에서 제외하는 최근 업로드 유예 시간 (저장 전 초안에 넣은 파일 보호) */
export const CLEANUP_GRACE_MS = 24 * 60 * 60 * 1000;

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export type MediaUsageType = 'post' | 'trash' | 'organization' | 'submission' | 'author';

export interface MediaUsage {
    type: MediaUsageType;
    /** 사용처 이름 (기사 제목·조직명 등) */
    label: string;
    /** 어느 칸에서 쓰는지 (썸네일·본문·로고 등) */
    field: string;
    /** 어드민 편집 화면 링크 */
    href: string;
}

export const MEDIA_USAGE_TYPE_LABEL: Record<MediaUsageType, string> = {
    post: '포스트',
    trash: '휴지통 포스트',
    organization: '조직',
    submission: '등록 신청',
    author: '발행자',
};
