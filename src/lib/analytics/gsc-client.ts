import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// ── 서비스 계정 인증 ──────────────────────────────────────────────
function getAuth() {
    let credentials: any;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } else {
        const filePath =
            process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ||
            './zinsight-analytics-2026-9897decb4585.json';
        const abs = path.resolve(process.cwd(), filePath);
        credentials = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    }
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
}

const SITE_URL = process.env.GSC_SITE_URL || 'https://zinsight.co.kr';

export interface DateRange { startDate: string; endDate: string }

export interface PagePerformance {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

// ── 페이지 검색 성과 (노출/클릭/CTR/순위) ─────────────────────────
export async function getPagePerformance(
    pageUrl: string,
    dateRange: DateRange,
): Promise<PagePerformance | null> {
    try {
        const auth = getAuth();
        const sc = google.searchconsole({ version: 'v1', auth });
        const res = await sc.searchanalytics.query({
            siteUrl: SITE_URL,
            requestBody: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                dimensions: ['page'],
                dimensionFilterGroups: [
                    {
                        filters: [
                            {
                                dimension: 'page',
                                operator: 'equals',
                                expression: pageUrl,
                            },
                        ],
                    },
                ],
                rowLimit: 1,
            },
        });
        const row = res.data.rows?.[0];
        if (!row) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
        return {
            clicks: row.clicks ?? 0,
            impressions: row.impressions ?? 0,
            ctr: Math.round((row.ctr ?? 0) * 10000) / 100, // 백분율 소수점 2자리
            position: Math.round((row.position ?? 0) * 10) / 10,
        };
    } catch (err) {
        console.error('[gsc] getPagePerformance failed:', err);
        return null;
    }
}

// ── 검색 노출 유형 분류 (AI Overview 포함 가능 범위까지) ──────────
export interface SearchAppearance {
    type: string;
    clicks: number;
    impressions: number;
}

export async function getSearchAppearanceBreakdown(
    pageUrl: string,
    dateRange: DateRange,
): Promise<SearchAppearance[] | null> {
    try {
        const auth = getAuth();
        const sc = google.searchconsole({ version: 'v1', auth });
        const res = await sc.searchanalytics.query({
            siteUrl: SITE_URL,
            requestBody: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                dimensions: ['searchAppearance'],
                dimensionFilterGroups: [
                    {
                        filters: [
                            {
                                dimension: 'page',
                                operator: 'equals',
                                expression: pageUrl,
                            },
                        ],
                    },
                ],
                rowLimit: 25,
            },
        });
        return (res.data.rows ?? []).map((row) => ({
            type: row.keys?.[0] ?? 'UNKNOWN',
            clicks: row.clicks ?? 0,
            impressions: row.impressions ?? 0,
        }));
    } catch (err) {
        console.error('[gsc] getSearchAppearanceBreakdown failed:', err);
        return null;
    }
}
