import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type {
    CustomChannel,
    ChannelRow,
    PlatformTrafficRow,
    RealtimeOverview,
    VisitorAttributes,
} from './types';
import { measured } from './types';
import { loadGoogleCredentials } from './google-credentials';

function getPropertyId(): string {
    if (process.env.GA4_PROPERTY_ID) {
        return process.env.GA4_PROPERTY_ID;
    }
    try {
        const creds = loadGoogleCredentials();
        if (creds && creds.property_id) {
            return String(creds.property_id);
        }
    } catch {}
    return '538324402';
}

const PROPERTY_ID = getPropertyId();

let _client: BetaAnalyticsDataClient | null = null;
function getClient(): BetaAnalyticsDataClient | null {
    if (!_client) {
        const credentials = loadGoogleCredentials();
        if (!credentials) {
            return null;
        }
        try {
            _client = new BetaAnalyticsDataClient({ credentials });
        } catch (initErr: any) {
            console.error('[ga4] BetaAnalyticsDataClient initialization failed:', initErr?.message, initErr?.stack);
            return null;
        }
    }
    return _client;
}

// ── 동시 요청 제어 큐 (GA4 표준 속성 동시 요청 쿼터 10건 제한 대응) ─────
class ConcurrencyQueue {
    private running = 0;
    private queue: Array<() => void> = [];
    private maxConcurrent: number;

    constructor(maxConcurrent: number = 3) {
        this.maxConcurrent = maxConcurrent;
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.running >= this.maxConcurrent) {
            await new Promise<void>((resolve) => this.queue.push(resolve));
        }
        this.running++;
        try {
            return await fn();
        } finally {
            this.running--;
            const next = this.queue.shift();
            if (next) next();
        }
    }
}

// 표준 속성 한도(10건)보다 여유 있게 최대 3건 동시 요청으로 제어
const ga4Queue = new ConcurrencyQueue(3);

// ── RESOURCE_EXHAUSTED / 쿼터 초과 시 재시도 로직 포함 안전 호출기 ───
async function safeRunReport(params: any, retries = 3): Promise<any> {
    return ga4Queue.run(async () => {
        const client = getClient();
        if (!client) {
            return [{ rows: [] }];
        }
        let attempt = 0;
        while (true) {
            try {
                return await client.runReport(params);
            } catch (err: any) {
                const isQuotaError =
                    err?.code === 8 ||
                    err?.status === 'RESOURCE_EXHAUSTED' ||
                    err?.message?.includes('RESOURCE_EXHAUSTED') ||
                    err?.message?.includes('quota') ||
                    err?.message?.includes('concurrent');

                attempt++;
                if (isQuotaError && attempt <= retries) {
                    const delay = attempt * 800 + Math.floor(Math.random() * 300);
                    console.warn(
                        `[ga4] Quota exceeded on runReport (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                throw err;
            }
        }
    });
}

// ── 단기 인메모리 캐시 (불필요한 중복 쿼터 소진 방지, TTL: 2분) ──────
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}
const memCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        memCache.delete(key);
        return null;
    }
    return entry.data;
}

function setToCache<T>(key: string, data: T, ttlSeconds: number = 120): void {
    memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function pathMatchesSlug(path: string, slug: string): boolean {
    if (!path || !slug) return false;
    const cleanPath = path.split('?')[0].split('#')[0].replace(/\/$/, '');
    const cleanSlug = slug.trim();
    return cleanPath.endsWith(`/${cleanSlug}`) || cleanPath.includes(`/${cleanSlug}/`);
}

export interface DateRange { startDate: string; endDate: string }

export interface ArticlePageviewRow {
    date: string;
    views: number;
}

export interface TrafficSourceRow {
    channel: string;
    sessions: number;
}

export interface VisitorGeographyRow {
    city: string;
    sessions: number;
}

export interface DailyDashboardStat {
    date: string;
    dau: number;
    views: number;
    sessions: number;
}

export interface GlobalDashboardStats {
    dailyData: DailyDashboardStat[];
    summary: {
        totalDau: number;
        totalViews: number;
        totalSessions: number;
    };
}

// ── 날짜별 pageview 시계열 ────────────────────────────────────────
export async function getArticlePageviews(slug: string, dateRange: DateRange): Promise<ArticlePageviewRow[] | null> {
    try {
        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [{ name: 'date' }, { name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: slug },
                },
            },
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });
        return (res.rows ?? []).map((row: any): ArticlePageviewRow => ({
            date: row.dimensionValues?.[0]?.value ?? '',
            views: Number(row.metricValues?.[0]?.value ?? 0),
        }));
    } catch (err) {
        console.error('[ga4] getArticlePageviews failed:', err);
        return null;
    }
}

// ── 커스텀 이벤트 집계 (표준 dimension인 eventName & pagePath 기반) ──────────
export async function getArticleEventCounts(
    slugOrId: string | number,
    eventName: string,
    dateRange: DateRange,
): Promise<number> {
    try {
        const expressions: any[] = [
            {
                filter: {
                    fieldName: 'eventName',
                    stringFilter: { matchType: 'EXACT', value: eventName },
                },
            },
        ];

        const slugStr = String(slugOrId).trim();
        if (slugStr) {
            expressions.push({
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: slugStr },
                },
            });
        }

        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
                andGroup: { expressions },
            },
        });
        return Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    } catch (err) {
        console.error(`[ga4] getArticleEventCounts (${eventName}) failed:`, err);
        return 0;
    }
}

// ── 유입 채널 분류 ────────────────────────────────────────────────
export async function getTrafficSource(slug: string, dateRange: DateRange): Promise<TrafficSourceRow[] | null> {
    try {
        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: slug },
                },
            },
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        });
        return (res.rows ?? []).map((row: any): TrafficSourceRow => ({
            channel: row.dimensionValues?.[0]?.value ?? 'Unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
    } catch (err) {
        console.error('[ga4] getTrafficSource failed:', err);
        return null;
    }
}

// ── 방문자 지역 분포 ──────────────────────────────────────────────
export async function getVisitorGeography(slug: string, dateRange: DateRange): Promise<VisitorGeographyRow[] | null> {
    try {
        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [{ name: 'city' }],
            metrics: [{ name: 'sessions' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: slug },
                },
            },
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
        });
        return (res.rows ?? []).map((row: any): VisitorGeographyRow => ({
            city: row.dimensionValues?.[0]?.value ?? 'Unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
    } catch (err) {
        console.error('[ga4] getVisitorGeography failed:', err);
        return null;
    }
}

// ── 사이트 전체 메인 대시보드 통계 (DAU, 페이지뷰, 세션) ─────────
export async function getGlobalDashboardStats(dateRange: DateRange): Promise<GlobalDashboardStats | null> {
    const cacheKey = `global_dashboard:${dateRange.startDate}:${dateRange.endDate}`;
    const cached = getFromCache<GlobalDashboardStats>(cacheKey);
    if (cached) return cached;

    try {
        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'screenPageViews' },
                { name: 'sessions' },
            ],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });
        const dailyData: DailyDashboardStat[] = (res.rows ?? []).map((row: any) => ({
            date: row.dimensionValues?.[0]?.value?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') ?? '',
            dau: Number(row.metricValues?.[0]?.value ?? 0),
            views: Number(row.metricValues?.[1]?.value ?? 0),
            sessions: Number(row.metricValues?.[2]?.value ?? 0),
        }));
        const totalDau = dailyData.reduce((s: number, r: DailyDashboardStat) => s + r.dau, 0);
        const totalViews = dailyData.reduce((s: number, r: DailyDashboardStat) => s + r.views, 0);
        const totalSessions = dailyData.reduce((s: number, r: DailyDashboardStat) => s + r.sessions, 0);
        const result: GlobalDashboardStats = {
            dailyData,
            summary: {
                totalDau,
                totalViews,
                totalSessions,
            },
        };
        setToCache(cacheKey, result, 120);
        return result;
    } catch (err) {
        console.error('[ga4] getGlobalDashboardStats failed:', err);
        return null;
    }
}

// ── AI/검색엔진/SNS 분류 상수 ──────────────────────────────────────
const AI_DOMAINS = ['chatgpt.com', 'chat.openai.com', 'openai.com', 'perplexity.ai', 'perplexity', 'gemini.google.com', 'claude.ai', 'copilot.microsoft.com', 'you.com', 'kagi.com', 'wrtn.ai', 'liner'];
const SEARCH_ENGINES = ['google', 'naver', 'daum', 'bing', 'yahoo', 'duckduckgo', 'zum'];
const SNS_DOMAINS = ['instagram.com', 'instagram', 'youtube.com', 'youtu.be', 'facebook.com', 'fb.com', 'linkedin.com', 'x.com', 'twitter.com', 't.co', 'threads.net', 'tiktok.com', 'kakao'];

function classifyChannel(source: string, medium: string, defaultGroup: string): CustomChannel {
    const s = source?.toLowerCase() ?? '';
    const m = medium?.toLowerCase() ?? '';
    if (AI_DOMAINS.some((d) => s.includes(d))) return 'ai_service';
    if (SNS_DOMAINS.some((d) => s.includes(d)) || m === 'social') return 'sns';
    if (SEARCH_ENGINES.some((e) => s.includes(e)) && (m === 'organic' || m === 'referral' || m === '(none)')) return 'search';
    if (defaultGroup?.toLowerCase().includes('organic search')) return 'search';
    if (s === '(direct)' || m === '(none)' || defaultGroup?.toLowerCase() === 'direct') return 'direct';
    return 'other';
}

function normalizePlatform(source: string, medium: string, defaultGroup: string): {
    key: string;
    label: string;
    category: CustomChannel;
    color: string;
} {
    const s = (source || '').toLowerCase().trim();
    const m = (medium || '').toLowerCase().trim();

    // 1. 생성형 AI 플랫폼
    if (s.includes('chatgpt') || s.includes('openai')) {
        return { key: 'chatgpt', label: 'ChatGPT', category: 'ai_service', color: '#10a37f' };
    }
    if (s.includes('perplexity')) {
        return { key: 'perplexity', label: 'Perplexity', category: 'ai_service', color: '#20808d' };
    }
    if (s.includes('gemini.google')) {
        return { key: 'gemini', label: 'Google Gemini', category: 'ai_service', color: '#8e75b2' };
    }
    if (s.includes('claude')) {
        return { key: 'claude', label: 'Claude', category: 'ai_service', color: '#d97757' };
    }
    if (s.includes('copilot')) {
        return { key: 'copilot', label: 'MS Copilot', category: 'ai_service', color: '#6366f1' };
    }
    if (s.includes('wrtn') || s.includes('liner') || s.includes('you.com') || s.includes('kagi')) {
        return { key: s, label: `AI (${source})`, category: 'ai_service', color: '#8b5cf6' };
    }

    // 2. 주요 검색엔진 (네이버, 구글, 다음, 빙, 줌, 야후 등)
    if (s.includes('naver')) {
        return { key: 'naver', label: '네이버 (Naver)', category: 'search', color: '#03c75a' };
    }
    if (s.includes('google')) {
        return { key: 'google', label: '구글 (Google)', category: 'search', color: '#4285f4' };
    }
    if (s.includes('daum')) {
        return { key: 'daum', label: '다음 (Daum)', category: 'search', color: '#ff5722' };
    }
    if (s.includes('bing') || s.includes('msn')) {
        return { key: 'bing', label: '빙 (Bing)', category: 'search', color: '#008373' };
    }
    if (s.includes('zum')) {
        return { key: 'zum', label: '줌 (ZUM)', category: 'search', color: '#2563eb' };
    }
    if (s.includes('yahoo') || s.includes('duckduckgo')) {
        return { key: s, label: source, category: 'search', color: '#3b82f6' };
    }

    // 3. 소셜 미디어 (SNS)
    if (s.includes('instagram')) {
        return { key: 'instagram', label: '인스타그램', category: 'sns', color: '#e1306c' };
    }
    if (s.includes('youtube') || s.includes('youtu.be')) {
        return { key: 'youtube', label: '유튜브', category: 'sns', color: '#ff0000' };
    }
    if (s.includes('facebook') || s.includes('fb.com')) {
        return { key: 'facebook', label: '페이스북', category: 'sns', color: '#1877f2' };
    }
    if (s.includes('threads')) {
        return { key: 'threads', label: 'Threads', category: 'sns', color: '#111827' };
    }
    if (s.includes('x.com') || s.includes('twitter') || s === 't.co') {
        return { key: 'x', label: 'X (트위터)', category: 'sns', color: '#0f172a' };
    }
    if (s.includes('linkedin')) {
        return { key: 'linkedin', label: '링크드인', category: 'sns', color: '#0a66c2' };
    }
    if (s.includes('kakao')) {
        return { key: 'kakao', label: '카카오톡/채널', category: 'sns', color: '#f59e0b' };
    }

    // 4. 직접 방문
    if (s === '(direct)' || (m === '(none)' && !s) || defaultGroup?.toLowerCase() === 'direct') {
        return { key: 'direct', label: '직접 방문 (Direct)', category: 'direct', color: '#10b981' };
    }

    // 5. 기타 외부 레퍼럴 / 미분류
    const cleanSource = source && source !== '(not set)' ? source : '기타 외부 유입';
    return {
        key: `other:${cleanSource.toLowerCase()}`,
        label: cleanSource,
        category: classifyChannel(source, medium, defaultGroup),
        color: '#64748b',
    };
}

interface RawTrafficRow {
    defaultGroup: string;
    source: string;
    medium: string;
    sessions: number;
    avgDuration: number;
}

async function fetchRawTrafficRows(slug: string | null, dateRange: DateRange): Promise<RawTrafficRow[]> {
    const cacheKey = `raw_traffic:${slug ?? '__ALL__'}:${dateRange.startDate}:${dateRange.endDate}`;
    const cached = getFromCache<RawTrafficRow[]>(cacheKey);
    if (cached) return cached;

    const params: any = {
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [dateRange],
        dimensions: [
            { name: 'sessionDefaultChannelGroup' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
        ],
        metrics: [
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    };

    if (slug && slug.trim()) {
        params.dimensionFilter = {
            filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'CONTAINS', value: slug.trim() },
            },
        };
    }

    const [res] = await safeRunReport(params);
    const rows: RawTrafficRow[] = (res.rows ?? []).map((row: any) => ({
        defaultGroup: row.dimensionValues?.[0]?.value ?? '',
        source: row.dimensionValues?.[1]?.value ?? '',
        medium: row.dimensionValues?.[2]?.value ?? '',
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
        avgDuration: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    setToCache(cacheKey, rows, 120);
    return rows;
}

// ── 유입 채널 세분화 (F-08: 5대 채널 그룹) ─────────────────────────
export async function getTrafficSourceDetailed(slug: string, dateRange: DateRange): Promise<ChannelRow[]> {
    const CHANNEL_LABELS: Record<CustomChannel, string> = {
        ai_service: '🤖 AI 서비스',
        search: '🔍 검색엔진',
        sns: '📱 SNS',
        direct: '🔗 직접 방문',
        other: '기타',
    };
    try {
        const rows = await fetchRawTrafficRows(slug, dateRange);

        const buckets: Record<CustomChannel, { sessions: number; durationSum: number; count: number }> = {
            ai_service: { sessions: 0, durationSum: 0, count: 0 },
            search: { sessions: 0, durationSum: 0, count: 0 },
            sns: { sessions: 0, durationSum: 0, count: 0 },
            direct: { sessions: 0, durationSum: 0, count: 0 },
            other: { sessions: 0, durationSum: 0, count: 0 },
        };

        for (const row of rows) {
            const ch = classifyChannel(row.source, row.medium, row.defaultGroup);
            buckets[ch].sessions += row.sessions;
            buckets[ch].durationSum += row.avgDuration * row.sessions;
            buckets[ch].count += row.sessions;
        }

        return (Object.keys(buckets) as CustomChannel[])
            .filter((ch) => buckets[ch].sessions > 0)
            .sort((a, b) => buckets[b].sessions - buckets[a].sessions)
            .map((ch) => ({
                channel: ch,
                channelLabel: CHANNEL_LABELS[ch],
                sessions: measured(buckets[ch].sessions),
                avgDuration: measured(
                    buckets[ch].count > 0 ? Math.round(buckets[ch].durationSum / buckets[ch].count) : 0
                ),
            }));
    } catch (err) {
        console.error('[ga4] getTrafficSourceDetailed failed:', err);
        return [];
    }
}

// ── 세부 플랫폼별 유입 랭킹 (네이버, 구글, 다음, 빙, ChatGPT, Perplexity 등) ──
export async function getPlatformTrafficBreakdown(
    slug: string | null,
    dateRange: DateRange,
): Promise<PlatformTrafficRow[]> {
    try {
        const rows = await fetchRawTrafficRows(slug, dateRange);

        const map = new Map<
            string,
            {
                key: string;
                label: string;
                category: CustomChannel;
                color: string;
                sessions: number;
                durationSum: number;
            }
        >();

        let totalSessions = 0;

        for (const row of rows) {
            if (row.sessions <= 0) continue;
            totalSessions += row.sessions;
            const info = normalizePlatform(row.source, row.medium, row.defaultGroup);
            const existing = map.get(info.key);
            if (existing) {
                existing.sessions += row.sessions;
                existing.durationSum += row.avgDuration * row.sessions;
            } else {
                map.set(info.key, {
                    ...info,
                    sessions: row.sessions,
                    durationSum: row.avgDuration * row.sessions,
                });
            }
        }

        return Array.from(map.values())
            .sort((a, b) => b.sessions - a.sessions)
            .map((item) => ({
                key: item.key,
                label: item.label,
                category: item.category,
                color: item.color,
                sessions: item.sessions,
                sharePct:
                    totalSessions > 0
                        ? Math.round((item.sessions / totalSessions) * 1000) / 10
                        : 0,
                avgDuration:
                    item.sessions > 0 ? Math.round(item.durationSum / item.sessions) : 0,
            }));
    } catch (err) {
        console.error('[ga4] getPlatformTrafficBreakdown failed:', err);
        return [];
    }
}

// ── GA4 Realtime 실시간 접속자 및 접속 도시/페이지 조회 ──────────────
export async function getRealtimeOverview(): Promise<RealtimeOverview | null> {
    const cacheKey = 'ga4_realtime_overview';
    const cached = getFromCache<RealtimeOverview>(cacheKey);
    if (cached) return cached;

    const client = getClient();
    if (!client) return null;

    try {
        const [cityRes, pageRes] = await Promise.all([
            ga4Queue.run(() =>
                client.runRealtimeReport({
                    property: `properties/${PROPERTY_ID}`,
                    dimensions: [{ name: 'city' }],
                    metrics: [{ name: 'activeUsers' }],
                    limit: 10,
                })
            ),
            ga4Queue.run(() =>
                client.runRealtimeReport({
                    property: `properties/${PROPERTY_ID}`,
                    dimensions: [{ name: 'unifiedScreenName' }],
                    metrics: [{ name: 'activeUsers' }],
                    limit: 5,
                })
            ),
        ]);

        const topCities = (cityRes[0]?.rows ?? []).map((r: any) => ({
            city: r.dimensionValues?.[0]?.value ?? 'Unknown',
            activeUsers: Number(r.metricValues?.[0]?.value ?? 0),
        }));

        const topPages = (pageRes[0]?.rows ?? []).map((r: any) => ({
            screenName: r.dimensionValues?.[0]?.value ?? '진사이트',
            activeUsers: Number(r.metricValues?.[0]?.value ?? 0),
        }));

        const activeUsers30m = topCities.reduce((sum, r) => sum + r.activeUsers, 0);

        const overview: RealtimeOverview = {
            activeUsers30m,
            topCities,
            topPages,
        };
        setToCache(cacheKey, overview, 30);
        return overview;
    } catch (err) {
        console.error('[ga4] getRealtimeOverview failed:', err);
        return null;
    }
}

// ── 방문자 속성 확장 (F-13) ──────────────────────────────────────────
export async function getVisitorAttributes(slug: string, dateRange: DateRange): Promise<VisitorAttributes> {
    const empty: VisitorAttributes = { devices: [], hours: [], newVsReturning: [], browsers: [] };
    try {
        const filter = {
            filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'CONTAINS' as const, value: slug },
            },
        };

        const [devRes, hourRes, nvrRes, browserRes] = await Promise.all([
            // ① 기기 카테고리
            safeRunReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            }),
            // ② 방문 시간대 (hour 0~23)
            safeRunReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'hour' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
            }),
            // ③ 신규/재방문
            safeRunReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'newVsReturning' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
            }),
            // ④ 브라우저 상위 5개
            safeRunReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'browser' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 5,
            }),
        ]);

        const devices = (devRes[0].rows ?? []).map((row: any) => ({
            device: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
        const hours = (hourRes[0].rows ?? []).map((row: any) => ({
            hour: Number(row.dimensionValues?.[0]?.value ?? 0),
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        })).sort((a: any, b: any) => a.hour - b.hour);
        const newVsReturning = (nvrRes[0].rows ?? []).map((row: any) => ({
            type: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
        const browsers = (browserRes[0].rows ?? []).map((row: any) => ({
            browser: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));

        return { devices, hours, newVsReturning, browsers };
    } catch (err) {
        console.error('[ga4] getVisitorAttributes failed:', err);
        return empty;
    }
}

// ── 링크별 외부 클릭 집계 (F-02) ─────────────────────────────────
// 전제: GA4 콘솔에서 맞춤 차원 'target_url' (이벤트 범위) 등록 완료 후 사용 가능
export interface OutboundLinkClickRow {
    url: string;
    domain: string;
    clicks: number;
}

export async function getOutboundLinkClicksByUrl(
    slug: string,
    dateRange: DateRange,
): Promise<OutboundLinkClickRow[]> {
    try {
        const [res] = await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [dateRange],
            dimensions: [
                { name: 'customEvent:target_url' },
            ],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
                andGroup: {
                    expressions: [
                        {
                            filter: {
                                fieldName: 'eventName',
                                stringFilter: { matchType: 'EXACT', value: 'outbound_link_click' },
                            },
                        },
                        {
                            filter: {
                                fieldName: 'pagePath',
                                stringFilter: { matchType: 'CONTAINS', value: slug },
                            },
                        },
                    ],
                },
            },
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        });

        return (res.rows ?? [])
            .map((row: any) => {
                const url = row.dimensionValues?.[0]?.value ?? '';
                let domain = '';
                try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { domain = url; }
                return {
                    url,
                    domain,
                    clicks: Number(row.metricValues?.[0]?.value ?? 0),
                };
            })
            .filter((r: any) => r.url && r.url !== '(not set)');
    } catch (err) {
        console.error('[ga4] getOutboundLinkClicksByUrl failed:', err);
        return [];
    }
}

// ── 다수 기사 일괄 성과 조회 (F-12 / 순위표 및 조직 연계 기사용) ───
// 각 기사별로 개별 호출하지 않고 전체 매거진 경로를 2회의 GA4 쿼리로 일괄 집계하여 쿼터 초과 방지
export async function getBatchArticlesStats(
    slugs: string[],
    dateRange: DateRange,
): Promise<Map<string, { views: number; radarClicks: number }>> {
    const resultMap = new Map<string, { views: number; radarClicks: number }>();
    if (slugs.length === 0) return resultMap;

    for (const slug of slugs) {
        resultMap.set(slug, { views: 0, radarClicks: 0 });
    }

    const cacheKey = `batch_articles:${dateRange.startDate}:${dateRange.endDate}`;
    let cachedData = getFromCache<{
        pvRows: Array<{ path: string; views: number }>;
        clickRows: Array<{ path: string; clicks: number }>;
    }>(cacheKey);

    if (!cachedData) {
        try {
            const [pvRes, clickRes] = await Promise.all([
                // 1. 전체 매거진 페이지뷰 일괄 조회
                safeRunReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [dateRange],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [{ name: 'screenPageViews' }],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'pagePath',
                            stringFilter: { matchType: 'CONTAINS', value: 'magazine' },
                        },
                    },
                    limit: 10000,
                }),
                // 2. 전체 레이더 프로필 클릭 이벤트 일괄 조회
                safeRunReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [dateRange],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [{ name: 'eventCount' }],
                    dimensionFilter: {
                        andGroup: {
                            expressions: [
                                {
                                    filter: {
                                        fieldName: 'eventName',
                                        stringFilter: { matchType: 'EXACT', value: 'radar_profile_click' },
                                    },
                                },
                                {
                                    filter: {
                                        fieldName: 'pagePath',
                                        stringFilter: { matchType: 'CONTAINS', value: 'magazine' },
                                    },
                                },
                            ],
                        },
                    },
                    limit: 10000,
                }),
            ]);

            const pvRows = (pvRes?.[0]?.rows ?? []).map((r: any) => ({
                path: r.dimensionValues?.[0]?.value ?? '',
                views: Number(r.metricValues?.[0]?.value ?? 0),
            }));

            const clickRows = (clickRes?.[0]?.rows ?? []).map((r: any) => ({
                path: r.dimensionValues?.[0]?.value ?? '',
                clicks: Number(r.metricValues?.[0]?.value ?? 0),
            }));

            cachedData = { pvRows, clickRows };
            setToCache(cacheKey, cachedData, 120);
        } catch (err) {
            console.error('[ga4] getBatchArticlesStats failed:', err);
        }
    }

    if (cachedData) {
        const { pvRows, clickRows } = cachedData;
        for (const slug of slugs) {
            const views = pvRows
                .filter((r) => pathMatchesSlug(r.path, slug))
                .reduce((sum, r) => sum + r.views, 0);

            const radarClicks = clickRows
                .filter((r) => pathMatchesSlug(r.path, slug))
                .reduce((sum, r) => sum + r.clicks, 0);

            resultMap.set(slug, { views, radarClicks });
        }
    }

    return resultMap;
}

// ── GA4 연동 상태 확인 ───────────────────────────────────────────
export async function getGA4ConnectionStatus(): Promise<{
    connected: boolean;
    propertyId: string;
    hasCredentials: boolean;
    error?: string;
}> {
    const credentials = loadGoogleCredentials();
    if (!credentials) {
        return {
            connected: false,
            propertyId: PROPERTY_ID,
            hasCredentials: false,
            error: 'Google Service Account 인증 정보가 설정되지 않았습니다.',
        };
    }

    try {
        const client = getClient();
        if (!client) throw new Error('GA4 클라이언트 초기화 실패');

        const now = new Date().toISOString().split('T')[0];
        await safeRunReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: now, endDate: now }],
            metrics: [{ name: 'activeUsers' }],
            limit: 1,
        });

        return {
            connected: true,
            propertyId: PROPERTY_ID,
            hasCredentials: true,
        };
    } catch (err: any) {
        console.error('[ga4] getGA4ConnectionStatus failed:', err?.message);
        return {
            connected: false,
            propertyId: PROPERTY_ID,
            hasCredentials: true,
            error: err?.message || 'GA4 API 통신 오류',
        };
    }
}
