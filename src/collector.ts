import axios from 'axios';
import { CONFIG } from './config';

export interface NaverNewsItem {
    title: string;
    originallink: string;
    link: string;
    description: string;
    pubDate: string;
}

export interface NaverNewsResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: NaverNewsItem[];
}

export class NewsCollector {
    private async fetchNews(keyword: string): Promise<NaverNewsResponse | null> {
        try {
            const response = await axios.get(CONFIG.NAVER_API_URL, {
                headers: {
                    'X-Naver-Client-Id': CONFIG.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': CONFIG.NAVER_CLIENT_SECRET,
                },
                params: {
                    query: keyword,
                    display: 20, // Fetching 20 items per keyword for sample
                    sort: 'sim'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching news for keyword: ${keyword}`, error);
            return null;
        }
    }

    public async collectAll(): Promise<Map<string, NaverNewsItem[]>> {
        const results = new Map<string, NaverNewsItem[]>();

        // Iterate over keywords defined in CONFIG
        for (const [key, keyword] of Object.entries(CONFIG.KEYWORDS)) {
            console.log(`Collecting news for: ${keyword} (${key})`);
            const data = await this.fetchNews(keyword);
            if (data && data.items) {
                results.set(key, data.items);
                // Log raw data for debugging as requested
                console.log(`[DEBUG] Raw items count for ${keyword}: ${data.items.length}`);
                // console.log(JSON.stringify(data.items.slice(0, 1), null, 2)); // Sample raw log
            }
        }

        return results;
    }
}
