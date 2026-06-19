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
        keywordId: number;
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
        params: {
            query: keyword,
            display,
            sort,
        },
    });
    return response.data?.items ?? [];
}

async function ingestItems(
    items: NaverNewsItem[],
    industryId: number,
    keywordId: number
): Promise<{ newCount: number; dupCount: number; failCount: number }> {
    let newCount = 0;
    let dupCount = 0;
    let failCount = 0;
    const now = new Date();

    for (const item of items) {
        // 1. Determine canonical_link: originallink preferred
        const canonical_link = item.originallink?.trim() || item.link?.trim();
        if (!canonical_link) {
            failCount++;
            continue;
        }

        try {
            const existing = await prisma.article.findUnique({ where: { canonical_link } });

            if (!existing) {
                // New article
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

                // Check ingestion uniqueness
                const ingestExists = await prisma.articleIngestion.findUnique({
                    where: { article_id_keyword_id: { article_id: article.id, keyword_id: keywordId } }
                });
                if (!ingestExists) {
                    await prisma.articleIngestion.create({
                        data: {
                            article_id: article.id,
                            industry_id: industryId,
                            keyword_id: keywordId,
                            fetched_at: now,
                            is_duplicate: false,
                        }
                    });
                }
                newCount++;
            } else {
                // Duplicate: update timestamp + fill empty fields
                await prisma.article.update({
                    where: { id: existing.id },
                    data: {
                        updated_at: now,
                        // Supplement empty title/description if needed
                        ...((!existing.title || existing.title === '') ? { title: stripHtml(item.title) } : {}),
                        ...((!existing.description || existing.description === '') ? { description: stripHtml(item.description) } : {}),
                    }
                });

                // Ingestion log (even for duplicates)
                const ingestExists = await prisma.articleIngestion.findUnique({
                    where: { article_id_keyword_id: { article_id: existing.id, keyword_id: keywordId } }
                });
                if (!ingestExists) {
                    await prisma.articleIngestion.create({
                        data: {
                            article_id: existing.id,
                            industry_id: industryId,
                            keyword_id: keywordId,
                            fetched_at: now,
                            is_duplicate: true,
                        }
                    });
                } else {
                    await prisma.articleIngestion.update({
                        where: { article_id_keyword_id: { article_id: existing.id, keyword_id: keywordId } },
                        data: { fetched_at: now, is_duplicate: true }
                    });
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

    const { newCount, dupCount, failCount } = await ingestItems(items, keyword.industry_id, keyword.id);

    await prisma.searchKeyword.update({ where: { id: keywordId }, data: { last_fetched_at: new Date() } });

    revalidatePath(`/articles`);

    return {
        success: true,
        newCount,
        dupCount,
        failCount,
        perKeyword: [{ keywordId: keyword.id, keywordText: keyword.keyword_text, newCount, dupCount, failCount }],
        message: `키워드 "${keyword.keyword_text}": 신규 ${newCount}, 중복 ${dupCount}, 실패 ${failCount}`
    };
}

export async function ingestByIndustry(industryId: number, display: number = 10, sort: 'sim' | 'date' = 'date'): Promise<IngestReport> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return { success: false, newCount: 0, dupCount: 0, failCount: 0, perKeyword: [], message: 'Naver API keys missing.' };
    }

    const keywords = await prisma.searchKeyword.findMany({
        where: { industry_id: industryId, is_active: true, deleted_at: null }
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
            const { newCount, dupCount, failCount } = await ingestItems(items, industryId, kw.id);
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
        newCount: totalNew,
        dupCount: totalDup,
        failCount: totalFail,
        perKeyword,
        message: `산업 단위 수집 완료: 신규 ${totalNew}, 중복 ${totalDup}, 실패 ${totalFail}`
    };
}
