import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';
import fs from 'fs';

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
