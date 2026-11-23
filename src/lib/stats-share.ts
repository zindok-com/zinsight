// 서버 전용: 링크 페이지 방문 통계 외부 공유 링크 (토큰 생성·조회, 공개용 통계 변환)
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { getLinkStatsSecret } from '@/lib/link-stats-secret';
import type { LinkPageStats } from '@/lib/link-page-stats';

/** base64url 43자 (32바이트 무작위) */
export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function newShareToken(): string {
    return randomBytes(32).toString('base64url');
}

export function hashShareToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// 관리자 '복사'용 원문 암호화 키: 서버 비밀값에서 용도별로 따로 파생 (DB만으로는 복호화 불가)
function shareKey(): Buffer {
    const secret = getLinkStatsSecret();
    return Buffer.from(hkdfSync('sha256', secret, 'zinsight-stats-share', 'token-enc:v1', 32));
}

export function encryptShareToken(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', shareKey(), iv);
    const data = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

/** 비밀값이 바뀌었거나 값이 손상되면 null (링크 자체는 해시로 계속 열림) */
export function decryptShareToken(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const [version, iv, tag, data] = value.split('.');
        if (version !== 'v1' || !iv || !tag || !data) return null;
        const decipher = createDecipheriv('aes-256-gcm', shareKey(), Buffer.from(iv, 'base64url'));
        decipher.setAuthTag(Buffer.from(tag, 'base64url'));
        const token = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
        return SHARE_TOKEN_PATTERN.test(token) ? token : null;
    } catch {
        return null;
    }
}

export const shareStatsPath = (token: string) => `/share/stats/${token}`;

const ymdOf = (d: Date) => d.toISOString().slice(0, 10);

export interface ResolvedShareLink {
    id: number;
    organizationId: number;
    orgName: string;
    defaultRange: { from: string; to: string } | null;
    lastViewedAt: Date | null;
}

/** 토큰 → 유효한 공유 링크. 형식 오류·없음·끊김·만료·조직 없음은 모두 null (호출부에서 같은 404) */
export async function resolveShareToken(token: string): Promise<ResolvedShareLink | null> {
    if (!SHARE_TOKEN_PATTERN.test(token)) return null;
    const link = await prisma.statsShareLink.findUnique({
        where: { token_hash: hashShareToken(token) },
        include: { organization: { select: { id: true, company_name: true } } },
    });
    if (!link || link.revoked_at || !link.organization) return null;
    if (link.expires_at && link.expires_at.getTime() <= Date.now()) return null;
    return {
        id: link.id,
        organizationId: link.organization.id,
        orgName: link.organization.company_name,
        defaultRange: link.default_from && link.default_to ? { from: ymdOf(link.default_from), to: ymdOf(link.default_to) } : null,
        lastViewedAt: link.last_viewed_at,
    };
}

/** 같은 링크를 10분 안에 다시 열면 조회 수에 넣지 않음 */
export async function recordShareView(link: ResolvedShareLink) {
    if (link.lastViewedAt && Date.now() - link.lastViewedAt.getTime() < 10 * 60 * 1000) return;
    await prisma.statsShareLink.update({
        where: { id: link.id },
        data: { last_viewed_at: new Date(), view_count: { increment: 1 } },
    });
}

/** 공개용 통계: 익명 숫자만. 연락처(리드)·내부 ID·직전 기간 비교는 넣지 않음 */
export interface SharedLinkStats {
    orgName: string;
    range: { from: string; to: string };
    hasData: boolean;
    views: number;
    uniqueViews: number;
    clicks: number;
    /** 외부 사이트 + SNS 아이콘 클릭 */
    outboundClicks: number;
    /** outboundClicks ÷ clicks (클릭이 없으면 null) */
    outboundRate: number | null;
    videoPlays: number;
    inquiryClicks: number;
    daily: Array<{ date: string; views: number; clicks: number }>;
    sources: Array<{ source: string; name: string; views: number; share: number }>;
    links: Array<{ label: string; kind: string; clicks: number; share: number }>;
    hourly: { hours: number[]; countedFrom: string | null };
}

export function sourceDisplayName(source: string, label: string | null): string {
    if (source === 'direct') return '직접 접속';
    return label?.trim() || source;
}

export function toSharedStats(
    orgName: string,
    stats: LinkPageStats,
    hourly: SharedLinkStats['hourly']
): SharedLinkStats {
    const outboundClicks = stats.kinds
        .filter((k) => k.kind === 'external' || k.kind === 'social')
        .reduce((sum, k) => sum + k.clicks, 0);
    return {
        orgName,
        range: { from: stats.range.from, to: stats.range.to },
        hasData: stats.views + stats.clicks + stats.videoPlays > 0,
        views: stats.views,
        uniqueViews: stats.uniqueViews,
        clicks: stats.clicks,
        outboundClicks,
        outboundRate: stats.clicks > 0 ? outboundClicks / stats.clicks : null,
        videoPlays: stats.videoPlays,
        inquiryClicks: stats.inquiryClicks,
        daily: stats.daily.map((d) => ({ date: d.date, views: d.views, clicks: d.clicks })),
        sources: stats.sources
            .filter((s) => s.views > 0)
            .sort((a, b) => b.views - a.views)
            .map((s) => ({
                source: s.source,
                name: sourceDisplayName(s.source, s.label),
                views: s.views,
                share: stats.views > 0 ? s.views / stats.views : 0,
            })),
        links: stats.links.map((l) => ({
            label: l.label,
            kind: l.kind,
            clicks: l.clicks,
            share: stats.clicks > 0 ? l.clicks / stats.clicks : 0,
        })),
        hourly,
    };
}
