import { SITE_BASE_URL } from '@/lib/site';

// 명함 QR 연결 모드: 프로필 그대로 / 소개 영상 위치(#play)로 도착
export const QR_MODES = ['profile', 'video-first'] as const;
export type QrMode = (typeof QR_MODES)[number];

export const QR_MODE_LABEL: Record<QrMode, string> = {
    profile: '프로필',
    'video-first': '영상 우선',
};

export function isQrMode(value: string): value is QrMode {
    return (QR_MODES as readonly string[]).includes(value);
}

// code는 인쇄물에 들어가므로 짧고 안전한 문자만 허용 (소문자·숫자·하이픈)
export const QR_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/**
 * QR 도착 주소. 리다이렉트 체인을 1회로 유지하기 위해 www 절대 URL로 직접 지정
 */
export function buildQrDestination(code: string, slugOrId: string, mode: string): string {
    const url = new URL(`/insight-radar/${encodeURIComponent(slugOrId)}`, SITE_BASE_URL);
    url.searchParams.set('utm_source', 'businesscard');
    url.searchParams.set('utm_medium', 'qr');
    url.searchParams.set('utm_campaign', code);
    if (mode === 'video-first') url.hash = 'play';
    return url.toString();
}

export function buildQrShortUrl(code: string): string {
    return `${SITE_BASE_URL}/go/${code}`;
}
