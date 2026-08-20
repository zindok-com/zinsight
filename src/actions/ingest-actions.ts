'use server';

import axios from 'axios';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;
const NAVER_API_URL = 'https://openapi.naver.com/v1/search/news.json';

interface NaverNewsItem {
    title: string;
    originallink: string;
    link: string;
    description: string;
    pubDate: string;
}

interface NaverApiResponse {
    items: NaverNewsItem[];
    total: number;
    start: number;
    display: number;
}

export interface IngestReport {
    success: boolean;
    newCount: number;
    dupCount: number;
    failCount: number;
    perKeyword: Array<{
        keywordId: number | null;
        keywordText: string;
        newCount: number;
        dupCount: number;
        failCount: number;
    }>;
    message: string;
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

async function fetchNaverNews(keyword: string, display: number = 10, sort: 'sim' | 'date' = 'date'): Promise<NaverNewsItem[]> {
    const response = await axios.get<NaverApiResponse>(NAVER_API_URL, {
        headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        },
        params: { query: keyword, display, sort },
    });
    return response.data?.items ?? [];
}

async function ingestItems(
    items: NaverNewsItem[],
    regionId: number,
    keywordId: number | null,
    organizationId?: number
): Promise<{ newCount: number; dupCount: number; failCount: number }> {
    let newCount = 0;
    let dupCount = 0;
    let failCount = 0;
    const now = new Date();
    const source = organizationId ? 'MANUAL_ORG' : 'REGION_CRAWL';

    for (const item of items) {
        const canonical_link = item.originallink?.trim() || item.link?.trim();
        if (!canonical_link) { failCount++; continue; }

        try {
            const existing = await prisma.article.findUnique({ where: { canonical_link } });

            if (!existing) {
                // 신규 기사 생성
                const article = await prisma.article.create({
                    data: {
                        canonical_link,
                        link: item.link || null,
                        originallink: item.originallink || null,
                        title: stripHtml(item.title),
                        description: stripHtml(item.description),
                        pub_date: item.pubDate ? new Date(item.pubDate) : null,
                        source: 'NAVER_NEWS',
                        raw_json: item as any,
                    }
                });

                // MANUAL_ORG: organization_id 기반 중복 체크 (app 레벨)
                if (organizationId) {
                    const orgIngestExists = await prisma.articleIngestion.findFirst({
                        where: { article_id: article.id, organization_id: organizationId }
                    });
                    if (!orgIngestExists) {
                        await prisma.articleIngestion.create({
                            data: { article_id: article.id, region_id: regionId, keyword_id: null, organization_id: organizationId, source, fetched_at: now, is_duplicate: false }
                        });
                    }
                } else if (keywordId) {
                    // REGION_CRAWL: keyword 기반 unique (DB 레벨)
                    const ingestExists = await prisma.articleIngestion.findUnique({
                        where: { article_id_keyword_id: { article_id: article.id, keyword_id: keywordId } }
                    });
                    if (!ingestExists) {
                        await prisma.articleIngestion.create({
                            data: { article_id: article.id, region_id: regionId, keyword_id: keywordId, organization_id: null, source, fetched_at: now, is_duplicate: false }
                        });
                    }
                }
                newCount++;
            } else {
                // 기존 기사 업데이트
                await prisma.article.update({
                    where: { id: existing.id },
                    data: {
                        updated_at: now,
                        ...((!existing.title || existing.title === '') ? { title: stripHtml(item.title) } : {}),
                        ...((!existing.description || existing.description === '') ? { description: stripHtml(item.description) } : {}),
                    }
                });

                if (organizationId) {
                    const orgIngestExists = await prisma.articleIngestion.findFirst({
                        where: { article_id: existing.id, organization_id: organizationId }
                    });
                    if (!orgIngestExists) {
                        await prisma.articleIngestion.create({
                            data: { article_id: existing.id, region_id: regionId, keyword_id: null, organization_id: organizationId, source, fetched_at: now, is_duplicate: true }
                        });
                    }
                } else if (keywordId) {
                    const ingestExists = await prisma.articleIngestion.findUnique({
                        where: { article_id_keyword_id: { article_id: existing.id, keyword_id: keywordId } }
                    });
                    if (!ingestExists) {
                        await prisma.articleIngestion.create({
                            data: { article_id: existing.id, region_id: regionId, keyword_id: keywordId, organization_id: null, source, fetched_at: now, is_duplicate: true }
                        });
                    } else {
                        await prisma.articleIngestion.update({
                            where: { article_id_keyword_id: { article_id: existing.id, keyword_id: keywordId } },
                            data: { fetched_at: now, is_duplicate: true }
                        });
                    }
                }
                dupCount++;
            }
        } catch (err) {
            console.error(`[ingest] Failed for ${canonical_link}:`, err);
            failCount++;
        }
    }

    return { newCount, dupCount, failCount };
}

// 키워드 단건 수집
export async function ingestByKeyword(keywordId: number, display: number = 10, sort: 'sim' | 'date' = 'date'): Promise<IngestReport> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: 'Naver API keys missing.' };
    }

    const keyword = await prisma.searchKeyword.findUnique({ where: { id: keywordId } });
    if (!keyword) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: `Keyword ${keywordId} not found.` };
    }

    let items: NaverNewsItem[] = [];
    try {
        items = await fetchNaverNews(keyword.keyword_text, display, sort);
    } catch (err) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: `Naver API error: ${err}` };
    }

    const { newCount, dupCount, failCount } = await ingestItems(items, keyword.region_id, keyword.id);

    await prisma.searchKeyword.update({ where: { id: keywordId }, data: { last_fetched_at: new Date() } });
    revalidatePath(`/articles`);

    return {
        success: true, newCount, dupCount, failCount,
        perKeyword: [{ keywordId: keyword.id, keywordText: keyword.keyword_text, newCount, dupCount, failCount }],
        message: `키워드 "${keyword.keyword_text}": 신규 ${newCount}, 중복 ${dupCount}, 실패 ${failCount}`
    };
}

// 지역 단위 수집 (지역에 연결된 모든 활성 키워드로 수집)
export async function ingestByRegion(regionId: number, display: number = 10, sort: 'sim' | 'date' = 'date'): Promise<IngestReport> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: 'Naver API keys missing.' };
    }

    const keywords = await prisma.searchKeyword.findMany({
        where: { region_id: regionId, is_active: true, deleted_at: null }
    });

    if (keywords.length === 0) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: '활성 키워드가 없습니다.' };
    }

    let totalNew = 0, totalDup = 0, totalFail = 0;
    const perKeyword: IngestReport['perKeyword'] = [];
    const now = new Date();

    for (const kw of keywords) {
        try {
            const items = await fetchNaverNews(kw.keyword_text, display, sort);
            const { newCount, dupCount, failCount } = await ingestItems(items, regionId, kw.id);
            await prisma.searchKeyword.update({ where: { id: kw.id }, data: { last_fetched_at: now } });
            totalNew += newCount;
            totalDup += dupCount;
            totalFail += failCount;
            perKeyword.push({ keywordId: kw.id, keywordText: kw.keyword_text, newCount, dupCount, failCount });
        } catch (err) {
            console.error(`[ingest] Keyword "${kw.keyword_text}" failed:`, err);
            perKeyword.push({ keywordId: kw.id, keywordText: kw.keyword_text, newCount: 0, dupCount: 0, failCount: display });
            totalFail += display;
        }
    }

    revalidatePath(`/articles`);

    return {
        success: true,
        newCount: totalNew, dupCount: totalDup, failCount: totalFail,
        perKeyword,
        message: `지역 단위 수집 완료: 신규 ${totalNew}, 중복 ${totalDup}, 실패 ${totalFail}`
    };
}

// 조직 우선 수집 (조직명 + 지역명으로 뉴스 검색, 오탐 필터 적용)
export async function ingestByOrganization(
    organizationId: number,
    display: number = 10,
    sort: 'sim' | 'date' = 'sim'
): Promise<IngestReport> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: 'Naver API keys missing.' };
    }

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { region: true }
    });

    if (!org) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: '조직을 찾을 수 없습니다.' };
    }

    // 검색 쿼리: 조직명 + 지역명 조합
    const searchQuery = `${org.company_name} ${org.region.name}`;

    let items: NaverNewsItem[] = [];
    try {
        items = await fetchNaverNews(searchQuery, display, sort);
    } catch (err) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: `Naver API error: ${err}` };
    }

    // 오탐 필터: 제목 또는 설명에 조직명(또는 별칭) 포함 여부 확인
    const aliases: string[] = Array.isArray(org.aliases) ? (org.aliases as string[]) : [];
    const names = [org.company_name, ...aliases];
    const filtered = items.filter(item => {
        const text = `${item.title} ${item.description}`.toLowerCase();
        return names.some(name => text.includes(name.toLowerCase()));
    });

    const { newCount, dupCount, failCount } = await ingestItems(
        filtered, org.region_id, null, organizationId
    );

    return {
        success: true, newCount, dupCount, failCount,
        perKeyword: [{ keywordId: null, keywordText: searchQuery, newCount, dupCount, failCount }],
        message: `조직 "${org.company_name}" 수집 완료: 신규 ${newCount}, 중복 ${dupCount}, 실패 ${failCount} (필터 전 ${items.length}건 → 필터 후 ${filtered.length}건)`
    };
}
