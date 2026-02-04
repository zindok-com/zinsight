'use server';

import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';
import { DataService } from '@/services/data-service';
import { RAW_DIR, ensureDataDirs } from '@/lib/file-system';
import { CompanyNews } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_URL = 'https://openapi.naver.com/v1/search/news.json';

const KEYWORDS = {
    QUERY_SME: 'LED 스마트 중소기업',
    QUERY_PUBLIC: 'LED 스마트 공공기관'
};

interface NaverNewsItem {
    title: string;
    originallink: string;
    link: string;
    description: string;
    pubDate: string;
}

interface NaverNewsResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: NaverNewsItem[];
}

export interface CollectionResult {
    success: boolean;
    collectedCount: number;
    message: string;
}

export async function collectNews(): Promise<CollectionResult> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return {
            success: false,
            collectedCount: 0,
            message: 'Naver API keys are missing in environment variables.'
        };
    }

    await ensureDataDirs(); // Ensure directories exist

    let totalNewItems = 0;
    const service = DataService.getInstance();
    const existingNews = await service.getNews();

    try {
        for (const [key, keyword] of Object.entries(KEYWORDS)) {
            try {
                const response = await axios.get<NaverNewsResponse>(NAVER_API_URL, {
                    headers: {
                        'X-Naver-Client-Id': NAVER_CLIENT_ID,
                        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                    },
                    httpsAgent: new (require('https').Agent)({
                        rejectUnauthorized: false
                    }),
                    params: {
                        query: keyword,
                        display: 30, // Fetch top 30
                        sort: 'sim'
                    }
                } as any);

                const data = response.data;
                if (data && data.items) {
                    // 1. Save Raw Data
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `raw_${keyword.replace(/\s+/g, '_')}_${timestamp}.json`;
                    const filepath = path.join(RAW_DIR, filename);
                    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

                    // 2. Process ALL items (no deduplication)
                    const newItems: CompanyNews[] = [];

                    for (const item of data.items) {
                        const newsItem: CompanyNews = {
                            id: uuidv4(),
                            company_id: 'UNKNOWN', // Needs linking logic later
                            title: item.title.replace(/<[^>]+>/g, ''), // Strip simple HTML tags
                            summary: item.description.replace(/<[^>]+>/g, ''),
                            publication_date: item.pubDate,
                            source_url: item.originallink || item.link,
                            source_type: 'NAVER_NEWS',
                            source_query: keyword,
                            original_link_hash: item.originallink || item.link,
                            raw_json: item,
                            created_at: new Date().toISOString()
                        };

                        newItems.push(newsItem);
                    }

                    if (newItems.length > 0) {
                        const updatedNews = [...existingNews, ...newItems];
                        await service.saveNews(updatedNews);
                        // Update local reference so next keyword can append
                        existingNews.push(...newItems);
                        totalNewItems += newItems.length;
                    }
                }

            } catch (error) {
                logger.error(`Error fetching news for ${keyword}:`, error);
                // Continue to next keyword
            }
        }

        revalidatePath('/articles');
        revalidatePath('/'); // Update dashboard stats if they count news

        return {
            success: true,
            collectedCount: totalNewItems,
            message: `Successfully collected ${totalNewItems} new articles.`
        };

    } catch (error) {
        logger.error("Critical error in collectNews:", error);
        return {
            success: false,
            collectedCount: 0,
            message: 'Failed to execute news collection.'
        };
    }
}
