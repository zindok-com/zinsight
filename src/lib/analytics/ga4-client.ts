import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';
import fs from 'fs';
import type { CustomChannel, ChannelRow, VisitorAttributes } from './types';
import { measured } from './types';


// ── 서비스 계정 인증 ──────────────────────────────────────────────
function getCredentials() {
    // 1) 환경변수로 직접 JSON 문자열을 넣은 경우
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }
    // 2) 파일 경로로 지정한 경우 (개발 환경)
    const filePath =
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ||
        './zinsight-analytics-2026-9897decb4585.json';
    const abs = path.resolve(process.cwd(), filePath);
    return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

function getPropertyId(): string {
    if (process.env.GA4_PROPERTY_ID) {
        return process.env.GA4_PROPERTY_ID;
    }
    try {
        const creds = getCredentials();
        if (creds && creds.property_id) {
            return String(creds.property_id);
        }
    } catch {}
    return '538324402';
}

const PROPERTY_ID = getPropertyId();

let _client: BetaAnalyticsDataClient | null = null;
function getClient(): BetaAnalyticsDataClient {
    if (!_client) {
        _client = new BetaAnalyticsDataClient({ credentials: getCredentials() });
    }
    return _client;
}

export interface DateRange { startDate: string; endDate: string }

// ── 날짜별 pageview 시계열 ────────────────────────────────────────
export async function getArticlePageviews(slug: string, dateRange: DateRange) {
    try {
        const [res] = await getClient().runReport({
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
        return (res.rows ?? []).map((row) => ({
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
) {
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

        const [res] = await getClient().runReport({
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
export async function getTrafficSource(slug: string, dateRange: DateRange) {
    try {
        const [res] = await getClient().runReport({
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
        return (res.rows ?? []).map((row) => ({
            channel: row.dimensionValues?.[0]?.value ?? 'Unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
    } catch (err) {
        console.error('[ga4] getTrafficSource failed:', err);
        return null;
    }
}

// ── 방문자 지역 분포 ──────────────────────────────────────────────
export async function getVisitorGeography(slug: string, dateRange: DateRange) {
    try {
        const [res] = await getClient().runReport({
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
        return (res.rows ?? []).map((row) => ({
            city: row.dimensionValues?.[0]?.value ?? 'Unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
    } catch (err) {
        console.error('[ga4] getVisitorGeography failed:', err);
        return null;
    }
}

// ── 사이트 전체 메인 대시보드 통계 (DAU, 페이지뷰, 세션) ─────────
export async function getGlobalDashboardStats(dateRange: DateRange) {
    try {
        const [res] = await getClient().runReport({
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
        const dailyData = (res.rows ?? []).map((row) => ({
            date: row.dimensionValues?.[0]?.value?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') ?? '',
            dau: Number(row.metricValues?.[0]?.value ?? 0),
            views: Number(row.metricValues?.[1]?.value ?? 0),
            sessions: Number(row.metricValues?.[2]?.value ?? 0),
        }));
        const totalDau = dailyData.reduce((s, r) => s + r.dau, 0);
        const totalViews = dailyData.reduce((s, r) => s + r.views, 0);
        const totalSessions = dailyData.reduce((s, r) => s + r.sessions, 0);
        return {
            dailyData,
            summary: {
                totalDau,
                totalViews,
                totalSessions,
            },
        };
    } catch (err) {
        console.error('[ga4] getGlobalDashboardStats failed:', err);
        return null;
    }
}

// ── AI/검색엔진/SNS 분류 상수 ──────────────────────────────────────
const AI_DOMAINS = ['chatgpt.com', 'perplexity.ai', 'gemini.google.com', 'claude.ai', 'copilot.microsoft.com', 'you.com', 'kagi.com'];
const SEARCH_ENGINES = ['google', 'naver', 'daum', 'bing', 'yahoo', 'duckduckgo'];
const SNS_DOMAINS = ['instagram.com', 'youtube.com', 'facebook.com', 'linkedin.com', 'x.com', 'twitter.com', 'threads.net', 'tiktok.com'];

function classifyChannel(source: string, medium: string, defaultGroup: string): CustomChannel {
    const s = source?.toLowerCase() ?? '';
    const m = medium?.toLowerCase() ?? '';
    if (AI_DOMAINS.some((d) => s.includes(d))) return 'ai_service';
    if (SNS_DOMAINS.some((d) => s.includes(d)) || m === 'social') return 'sns';
    if (SEARCH_ENGINES.some((e) => s.includes(e)) && (m === 'organic' || m === '(none)')) return 'search';
    if (defaultGroup?.toLowerCase().includes('organic search')) return 'search';
    if (s === '(direct)' || m === '(none)' || defaultGroup?.toLowerCase() === 'direct') return 'direct';
    return 'other';
}

// ── 유입 채널 세분화 (F-08) ──────────────────────────────────────────
export async function getTrafficSourceDetailed(slug: string, dateRange: DateRange): Promise<ChannelRow[]> {
    const CHANNEL_LABELS: Record<CustomChannel, string> = {
        ai_service: '🤖 AI 서비스',
        search: '🔍 검색엔진',
        sns: '📱 SNS',
        direct: '🔗 직접 방문',
        other: '기타',
    };
    try {
        const [res] = await getClient().runReport({
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
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: slug },
                },
            },
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        });

        // GA4 rows를 커스텀 채널로 리매핑 후 집계
        const buckets: Record<CustomChannel, { sessions: number; durationSum: number; count: number }> = {
            ai_service: { sessions: 0, durationSum: 0, count: 0 },
            search: { sessions: 0, durationSum: 0, count: 0 },
            sns: { sessions: 0, durationSum: 0, count: 0 },
            direct: { sessions: 0, durationSum: 0, count: 0 },
            other: { sessions: 0, durationSum: 0, count: 0 },
        };

        for (const row of res.rows ?? []) {
            const defaultGroup = row.dimensionValues?.[0]?.value ?? '';
            const source = row.dimensionValues?.[1]?.value ?? '';
            const medium = row.dimensionValues?.[2]?.value ?? '';
            const sessions = Number(row.metricValues?.[0]?.value ?? 0);
            const avgDuration = Number(row.metricValues?.[1]?.value ?? 0);
            const ch = classifyChannel(source, medium, defaultGroup);
            buckets[ch].sessions += sessions;
            buckets[ch].durationSum += avgDuration * sessions;
            buckets[ch].count += sessions;
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
            getClient().runReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            }),
            // ② 방문 시간대 (hour 0~23)
            getClient().runReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'hour' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
            }),
            // ③ 신규/재방문
            getClient().runReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'newVsReturning' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
            }),
            // ④ 브라우저 상위 5개
            getClient().runReport({
                property: `properties/${PROPERTY_ID}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'browser' }],
                metrics: [{ name: 'sessions' }],
                dimensionFilter: filter,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 5,
            }),
        ]);

        const devices = (devRes[0].rows ?? []).map((row) => ({
            device: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
        const hours = (hourRes[0].rows ?? []).map((row) => ({
            hour: Number(row.dimensionValues?.[0]?.value ?? 0),
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        })).sort((a, b) => a.hour - b.hour);
        const newVsReturning = (nvrRes[0].rows ?? []).map((row) => ({
            type: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));
        const browsers = (browserRes[0].rows ?? []).map((row) => ({
            browser: row.dimensionValues?.[0]?.value ?? 'unknown',
            sessions: Number(row.metricValues?.[0]?.value ?? 0),
        }));

        return { devices, hours, newVsReturning, browsers };
    } catch (err) {
        console.error('[ga4] getVisitorAttributes failed:', err);
        return empty;
    }
}

