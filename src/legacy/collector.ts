import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
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
            const response = await axios.get<NaverNewsResponse>(CONFIG.NAVER_API_URL, {
                headers: {
                    'X-Naver-Client-Id': CONFIG.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': CONFIG.NAVER_CLIENT_SECRET,
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false
                }),
                params: {
                    query: keyword,
                    display: 30, // Fetching 30 items per keyword for sample
                    sort: 'sim'
                }
            } as any);
            return response.data;
        } catch (error) {
            console.error(`Error fetching news for keyword: ${keyword}`, error);
            return null;
        }
    }

    private saveRawData(keyword: string, data: any) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `raw_${keyword.replace(/\s+/g, '_')}_${timestamp}.json`;
        const dir = path.join(process.cwd(), 'data', 'raw');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`[LOG] Saved raw data to ${filepath}`);
    }

    public async collectAll(): Promise<Map<string, NaverNewsItem[]>> {
        const results = new Map<string, NaverNewsItem[]>();

        // Iterate over keywords defined in CONFIG
        for (const [key, keyword] of Object.entries(CONFIG.KEYWORDS)) {
            console.log(`Collecting news for: ${keyword} (${key})`);
            const data = await this.fetchNews(keyword);
            if (data && data.items) {
                // Save raw data immediately
                this.saveRawData(keyword, data);

                results.set(key, data.items);
                console.log(`[DEBUG] Raw items count for ${keyword}: ${data.items.length}`);
            }
        }

        return results;
    }
}
