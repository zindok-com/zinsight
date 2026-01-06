import { NewsCollector } from './collector';
import { DataProcessor } from './processor';
import { Store } from './store';
import { CONFIG } from './config';
import type { Trend } from './types';

async function main() {
    console.log("=== MICE Scout Agent PoC Started ===");

    const collector = new NewsCollector();
    const processor = new DataProcessor();
    const store = new Store();

    // 1. Collect Data
    const rawDataMap = await collector.collectAll();

    // 2. Process Data
    for (const [key, items] of rawDataMap.entries()) {
        const searchKeyword = CONFIG.KEYWORDS[key as keyof typeof CONFIG.KEYWORDS];
        console.log(`Processing ${items.length} items for ${searchKeyword}...`);

        for (const item of items) {
            const { company, news } = processor.processItem(item, "CAT_LED", searchKeyword);

            // Filter out invalid or generic matches if needed (basic check)
            if (company.name !== "Unknown" && company.name.length > 1) {
                const savedCompany = store.upsertCompany(company);
                // Link news to the saved company (in case ID changed due to merge, though upsert updates ref)
                news.company_id = savedCompany.id;
                store.addNews(news);
            }
        }
    }

    // 3. Generate Trend (Simple Aggregation)
    // Count frequency of focus_area words across all companies
    const techCounts = new Map<string, number>();
    store.companies.forEach(c => {
        const techs = c.focus_area.split(', ');
        techs.forEach(t => {
            if (!t) return;
            techCounts.set(t, (techCounts.get(t) || 0) + 1);
        });
    });

    // Sort techs by frequency
    const sortedTechs = [...techCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topTechs = sortedTechs.slice(0, 3).map(t => t[0]);

    const trend: Trend = {
        id: "TREND_001",
        category_id: "CAT_LED",
        trend_summary: `Dominant technologies in recent news are: ${topTechs.join(', ')}`,
        evidence: `Based on analysis of ${store.companies.length} companies and ${store.news.length} articles.`,
        created_at: new Date()
    };
    store.addTrend(trend);

    // 4. Output Results
    console.log("\n\n=== [Sample Output] Promising Participating Company List ===");
    // Sort by Score
    store.companies.sort((a, b) => (b.exhibition_score || 0) - (a.exhibition_score || 0));

    store.companies.forEach(c => {
        console.log(`\n[Candidate] ${c.name} (Score: ${c.exhibition_score})`);
        console.log(` - Tags: ${c.tags.join(', ')}`);
        console.log(` - Keywords: ${c.focus_area}`);
        console.log(` - Description: ${c.description}`);
    });

    console.log("\n\n=== [Organizer Review] Trend Summary ===");
    console.log(`[Trend] ${trend.trend_summary}`);
    console.log(` - Evidence: ${trend.evidence}`);

    console.log("\n=== PoC Finished ===");
}

main().catch(err => console.error(err));
