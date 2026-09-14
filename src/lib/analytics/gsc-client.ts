import { google } from 'googleapis';
import { loadGoogleCredentials } from './google-credentials';

// ?Ä?Ä ?úÎπÑ??Í≥ÑÏ†ï ?∏Ï¶ù ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
function getAuth() {
    const credentials = loadGoogleCredentials();
    if (!credentials) return null;
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
}


const domain = "www.zinsight.co.kr";
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

// ?Ä?Ä ?òÏù¥ÏßÄ Í≤Ä???±Í≥º (?∏Ï∂ú/?¥Î¶≠/CTR/?úÏúÑ) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
export async function getPagePerformance(
    pageUrlOrSlug: string,
    dateRange: DateRange,
): Promise<PagePerformance | null> {
    try {
        const auth = getAuth();
        if (!auth) return null;
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
        
        // ?∏Ï∂ú??Í∞ÄÏ§??âÍ∑† ?úÏúÑ
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

// ?Ä?Ä Í≤Ä???∏Ï∂ú ?†Ìòï Î∂ÑÎ•ò (AI Overview ?¨Ìï® Í∞Ä??Î≤îÏúÑÍπåÏ?) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
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
        if (!auth) return null;
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

// ?Ä?Ä ?ùÏÑ±??AI ?±Í≥º Î¶¨Ìè¨??(F-05) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
// GSC searchType:'DISCOVER' ?êÎäî searchAppearance Í∏∞Î∞ò?ºÎ°ú AI Overview ?∏Ï∂ú??Î≥ÑÎèÑ Ï°∞Ìöå
// ?¥Î¶≠?ò¬∑CTR¬∑?úÏúÑ???úÍ≥µ?òÏ? ?äÏùå ???∏Ï∂ú?òÎßå ?úÍ≥µ
export interface GenerativeAIPerformance {
    impressions: number;        // AI Í∞úÏöî(AI Overview) ?∏Ï∂ú??    note: string;               // UI ?àÎÇ¥ Î¨∏Íµ¨
}

export async function getGenerativeAIPerformance(
    pageUrlOrSlug: string,
    dateRange: DateRange,
): Promise<GenerativeAIPerformance | null> {
    const NOTE = 'AI Í∞úÏöî ?∏Ï∂ú?òÎßå Ï∏°Ï†ï Í∞Ä?•Ìï©?àÎã§. ?¥Î¶≠?ò¬∑CTR¬∑?úÏúÑ???ùÏÑ±??AI ?±Í≥º?êÏÑú ?úÍ≥µ?òÏ? ?äÏäµ?àÎã§.';
    try {
        const auth = getAuth();
        if (!auth) return null;
        const sc = google.searchconsole({ version: 'v1', auth });
        const targetSlug = extractSlug(pageUrlOrSlug);

        // searchAppearance Ï∞®Ïõê?êÏÑú 'AI_OVERVIEW' ?êÎäî 'GENERATIVE_AI' ?Ä???ÑÌÑ∞Îß?        const res = await sc.searchanalytics.query({
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
                // ?ùÏÑ±??AI ?ÑÏö© searchType (Í≥ÑÏ†ïÎ≥?Î°§ÏïÑ???Ä?ÅÏù∏ Í≤ΩÏö∞ ?¨Ïö© Í∞Ä??
                // searchType: 'DISCOVER',  // ?ÑÏöî ??Ï£ºÏÑù ?¥Ï†ú
            },
        });

        // searchAppearance Í∞?Ï§?AI Overview Í¥Ä????™© Ï∂îÏ∂ú
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


