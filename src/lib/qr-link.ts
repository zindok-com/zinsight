import { SITE_BASE_URL } from '@/lib/site';

// 명함 QR 연결 모드: 프로필 그대로 / 소개 영상 위치(#play)로 도착 / 링크 페이지
export const QR_MODES = ['profile', 'video-first', 'links'] as const;
export type QrMode = (typeof QR_MODES)[number];

export const QR_MODE_LABEL: Record<QrMode, string> = {
    profile: '프로필',
    'video-first': '영상 우선',
    links: '링크 페이지',
};

export function isQrMode(value: string): value is QrMode {
    return (QR_MODES as readonly string[]).includes(value);
}

// 코드 배포 채널: 도착 주소의 UTM(utm_source·utm_medium)을 결정
export const QR_CHANNELS = ['businesscard', 'instagram', 'email', 'other'] as const;
export type QrChannel = (typeof QR_CHANNELS)[number];

export const QR_CHANNEL_LABEL: Record<QrChannel, string> = {
    businesscard: '명함 QR',
    instagram: '인스타그램',
    email: '이메일 서명',
    other: '기타',
};

const CHANNEL_UTM: Record<QrChannel, { source: string; medium: string }> = {
    businesscard: { source: 'businesscard', medium: 'qr' },
    instagram: { source: 'instagram', medium: 'social' },
    email: { source: 'email_signature', medium: 'email' },
    other: { source: 'zinsight_go', medium: 'referral' },
};

export function isQrChannel(value: string): value is QrChannel {
    return (QR_CHANNELS as readonly string[]).includes(value);
}

// code는 인쇄물에 들어가므로 짧고 안전한 문자만 허용 (소문자·숫자·하이픈)
export const QR_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/**
 * QR 도착 주소. 리다이렉트 체인을 1회로 유지하기 위해 www 절대 URL로 직접 지정.
 * 링크 페이지는 자체 통계의 유입 경로 집계를 위해 src=코드를 함께 전달
 */
export function buildQrDestination(code: string, slugOrId: string, mode: string, channel = 'businesscard'): string {
    const path = `/insight-radar/${encodeURIComponent(slugOrId)}${mode === 'links' ? '/links' : ''}`;
    const url = new URL(path, SITE_BASE_URL);
    const utm = CHANNEL_UTM[isQrChannel(channel) ? channel : 'businesscard'];
    if (mode === 'links') url.searchParams.set('src', code);
    url.searchParams.set('utm_source', utm.source);
    url.searchParams.set('utm_medium', utm.medium);
    url.searchParams.set('utm_campaign', code);
    if (mode === 'video-first') url.hash = 'play';
    return url.toString();
}

export function buildQrShortUrl(code: string): string {
    return `${SITE_BASE_URL}/go/${code}`;
}
