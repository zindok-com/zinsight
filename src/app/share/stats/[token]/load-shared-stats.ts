import { headers } from 'next/headers';
import { after } from 'next/server';
import { notFound } from 'next/navigation';
import { isBotUserAgent } from '@/lib/bot-ua';
import { computeLinkPageStats, firstLinkPageStatsDate, loadLinkPageHourlyViews } from '@/lib/link-page-stats';
import { clientIpFromHeaders, rateLimit, MINUTE } from '@/lib/rate-limit';
import { recordShareView, resolveShareToken, toSharedStats, type SharedLinkStats } from '@/lib/stats-share';

export type SharePeriod = 'all' | '7' | '30' | 'event' | 'custom';

export interface SharedStatsView {
    token: string;
    stats: SharedLinkStats;
    period: SharePeriod;
    /** 관리자가 정한 전시 기간 (있을 때만 '전시 기간' 버튼 표시) */
    eventRange: { from: string; to: string } | null;
}

/** 현재 기간을 유지하는 쿼리 (리포트 이동·기간 버튼 공통) */
export function periodQuery(period: SharePeriod, range: { from: string; to: string }): string {
    if (period === 'custom') return `?period=custom&from=${range.from}&to=${range.to}`;
    return `?period=${period}`;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CUSTOM_DAYS = 366;

// 없는 토큰을 반복 대입하는 요청 차단: IP당 10분에 10회 실패하면 그 뒤로는 모두 404 (서버 인스턴스별 메모리 기준)
const MISS_LIMIT = 10;
const MISS_WINDOW_MS = 10 * MINUTE;
const misses = new Map<string, { count: number; resetAt: number }>();

function isBlocked(ip: string): boolean {
    const m = misses.get(ip);
    return !!m && m.resetAt > Date.now() && m.count >= MISS_LIMIT;
}

function addMiss(ip: string) {
    const now = Date.now();
    if (misses.size > 5_000) for (const [k, v] of misses) if (v.resetAt <= now) misses.delete(k);
    const m = misses.get(ip);
    if (!m || m.resetAt <= now) misses.set(ip, { count: 1, resetAt: now + MISS_WINDOW_MS });
    else m.count += 1;
}

function kstYmd(offsetDays = 0): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

/** 공유 페이지·리포트 공통: 토큰 확인 → 기간 결정 → 관리자 화면과 같은 집계 → 공개용 숫자만 */
export async function loadSharedStats(
    token: string,
    sp: { period?: string; from?: string; to?: string }
): Promise<SharedStatsView> {
    const h = await headers();
    const ip = clientIpFromHeaders(h);
    if (isBlocked(ip) || !rateLimit(`share-stats:${ip}`, 30, MINUTE)) notFound();

    const link = await resolveShareToken(token);
    if (!link) {
        addMiss(ip);
        notFound();
    }

    const today = kstYmd();
    let period: SharePeriod;
    let range: { from: string; to: string };
    const requested = sp.period ?? (link.defaultRange ? 'event' : 'all');

    if (requested === 'custom' && sp.from && sp.to && YMD.test(sp.from) && YMD.test(sp.to)) {
        const [a, b] = sp.from <= sp.to ? [sp.from, sp.to] : [sp.to, sp.from];
        if ((Date.parse(b) - Date.parse(a)) / 86_400_000 <= MAX_CUSTOM_DAYS) {
            period = 'custom';
            range = { from: a, to: b };
        } else {
            period = 'all';
            range = { from: today, to: today };
        }
    } else if (requested === '7' || requested === '30') {
        const days = Number(requested);
        period = requested;
        range = { from: kstYmd(-(days - 1)), to: today };
    } else if (requested === 'event' && link.defaultRange) {
        period = 'event';
        range = link.defaultRange;
    } else {
        period = 'all';
        range = { from: today, to: today };
    }
    if (period === 'all') {
        const first = await firstLinkPageStatsDate(link.organizationId);
        range = { from: first && first < today ? first : today, to: today };
    }

    const [stats, hourly] = await Promise.all([
        computeLinkPageStats(link.organizationId, range),
        loadLinkPageHourlyViews(link.organizationId, range),
    ]);
    if (!stats) notFound();

    // 공유 링크 조회 기록 (카드 방문 통계에는 넣지 않음). 메신저 미리보기·봇은 제외
    if (!isBotUserAgent(h.get('user-agent'))) {
        after(() => recordShareView(link).catch((error) => console.error('공유 링크 조회 기록 실패:', error)));
    }

    return { token, stats: toSharedStats(link.orgName, stats, hourly), period, eventRange: link.defaultRange };
}
