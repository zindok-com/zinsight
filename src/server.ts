import express, { Request, Response } from 'express';
import path from 'path';
import { NewsCollector } from './collector';
import { DataProcessor } from './processor';
import { Store } from './store';
import { CONFIG } from './config';
import { Trend } from './types';

const app = express();
const port = 3000;

// Initialize core components
const collector = new NewsCollector();
const processor = new DataProcessor();
const store = new Store();

// Helper to run the collection process
async function runCollection() {
    console.log("Starting background data collection...");
    store.companies = [];
    store.news = [];
    store.trends = [];

    // 1. Collect Data
    const rawDataMap = await collector.collectAll();

    // 2. Process Data
    for (const [key, items] of rawDataMap.entries()) {
        const searchKeyword = CONFIG.KEYWORDS[key as keyof typeof CONFIG.KEYWORDS];

        for (const item of items) {
            const { company, news } = processor.processItem(item, "CAT_LED", searchKeyword);

            if (company.name !== "Unknown" && company.name.length > 1) {
                const savedCompany = store.upsertCompany(company);
                news.company_id = savedCompany.id;
                store.addNews(news);
            }
        }
    }

    // 3. Generate Trend
    const techCounts = new Map<string, number>();
    store.companies.forEach(c => {
        const techs = c.focus_area.split(', ');
        techs.forEach(t => {
            if (!t) return;
            techCounts.set(t, (techCounts.get(t) || 0) + 1);
        });
    });

    const sortedTechs = [...techCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topTechs = sortedTechs.slice(0, 3).map(t => t[0]);

    const trend: Trend = {
        id: "TREND_001",
        category_id: "CAT_LED",
        trend_summary: `Dominant technologies: ${topTechs.join(', ')}`,
        evidence: `Analyzed ${store.companies.length} companies.`,
        created_at: new Date()
    };
    store.addTrend(trend);

    console.log("Data collection completed.");
}

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoint
app.get('/api/data', (req: Request, res: Response) => {
    res.json(store.getConstructedData());
});

app.get('/api/refresh', async (req: Request, res: Response) => {
    await runCollection();
    res.json({ status: 'Refreshed' });
});

// Start server
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await runCollection();
});
