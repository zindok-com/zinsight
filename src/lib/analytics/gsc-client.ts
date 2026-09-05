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

const domain = process.env.DOMAIN || 'zinsight.co.kr';
const SITE_URL = process.env.GSC_SITE_URL || `sc-domain:${domain}`;

export interface DateRange { startDate: string; endDate: string }

export interface PagePerformance {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

function extractSlug(urlOrSlug: string): string {
    if (!urlOrSlug) return '';
    const cleaned = urlOrSlug.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '');
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || cleaned;
}

// ── 페이지 검색 성과 (노출/클릭/CTR/순위) ─────────────────────────
export async function getPagePerformance(
    pageUrlOrSlug: string,
    dateRange: DateRange,
): Promise<PagePerformance | null> {
    try {
        const auth = getAuth();
        const sc = google.searchconsole({ version: 'v1', auth });
        const targetSlug = extractSlug(pageUrlOrSlug);

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
                                operator: 'contains',
                                expression: targetSlug,
                            },
                        ],
                    },
                ],
                rowLimit: 50,
            },
        });
        const rows = res.data.rows ?? [];
        if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };

        const totalClicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
        const totalImpressions = rows.reduce((s, r) => s + (r.impressions ?? 0), 0);
        const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
        
        // 노출수 가중 평균 순위
        const weightedPosSum = rows.reduce((s, r) => s + (r.position ?? 0) * (r.impressions ?? 1), 0);
        const position = totalImpressions > 0 ? Math.round((weightedPosSum / totalImpressions) * 10) / 10 : 0;

        return {
            clicks: totalClicks,
            impressions: totalImpressions,
            ctr,
            position,
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
    pageUrlOrSlug: string,
    dateRange: DateRange,
): Promise<SearchAppearance[] | null> {
    try {
        const auth = getAuth();
        const sc = google.searchconsole({ version: 'v1', auth });
        const targetSlug = extractSlug(pageUrlOrSlug);

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
                                operator: 'contains',
                                expression: targetSlug,
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

// ── 생성형 AI 성과 리포트 (F-05) ─────────────────────────────────────
// GSC searchType:'DISCOVER' 또는 searchAppearance 기반으로 AI Overview 노출수 별도 조회
// 클릭수·CTR·순위는 제공되지 않음 — 노출수만 제공
export interface GenerativeAIPerformance {
    impressions: number;        // AI 개요(AI Overview) 노출수
    note: string;               // UI 안내 문구
}

export async function getGenerativeAIPerformance(
    pageUrlOrSlug: string,
    dateRange: DateRange,
): Promise<GenerativeAIPerformance | null> {
    const NOTE = 'AI 개요 노출수만 측정 가능합니다. 클릭수·CTR·순위는 생성형 AI 성과에서 제공되지 않습니다.';
    try {
        const auth = getAuth();
        const sc = google.searchconsole({ version: 'v1', auth });
        const targetSlug = extractSlug(pageUrlOrSlug);

        // searchAppearance 차원에서 'AI_OVERVIEW' 또는 'GENERATIVE_AI' 타입 필터링
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
                                operator: 'contains',
                                expression: targetSlug,
                            },
                        ],
                    },
                ],
                rowLimit: 50,
                // 생성형 AI 전용 searchType (계정별 롤아웃 대상인 경우 사용 가능)
                // searchType: 'DISCOVER',  // 필요 시 주석 해제
            },
        });

        // searchAppearance 값 중 AI Overview 관련 항목 추출
        const AI_APPEARANCE_KEYS = ['AI_OVERVIEW', 'GENERATIVE_AI', 'AI_MODE'];
        const aiRows = (res.data.rows ?? []).filter((row) =>
            AI_APPEARANCE_KEYS.some((key) => (row.keys?.[0] ?? '').toUpperCase().includes(key))
        );

        const totalImpressions = aiRows.reduce((s, r) => s + (r.impressions ?? 0), 0);

        return {
            impressions: totalImpressions,
            note: NOTE,
        };
    } catch (err) {
        console.error('[gsc] getGenerativeAIPerformance failed:', err);
        return null;
    }
}

