import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { NewsCollector } from './collector';
import { DataProcessor } from './processor';
import { Store } from './store';
import { CONFIG } from './config';
import { Trend, Company, ReviewStatus } from './types';

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// Initialize core components
const collector = new NewsCollector();
const processor = new DataProcessor();
const store = new Store();

// Helper to run the collection process
async function runCollection() {
    console.log("Starting background data collection...");
    // store.companies = []; // Do not clear for now if we want to accumulate or test persistence concepts? 
    // Actually spec says "maintain Pipeline", usually existing PoC clears it. 
    // For Safety/Demo: Let's clear to avoid duplicate pile up if no dedupe logic on ID access.
    // Spec says: "Existing entities table...". But here we are in-memory.
    // We will clear for "fresh start" behavior unless we implement persistent file storage.
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

// CSV Export Endpoint
app.get('/exports/entities.csv', (req: Request, res: Response) => {
    const { review_status, company_scale, exhibition_participation_type, primary_category } = req.query;

    let companies = store.companies;

    if (review_status) {
        companies = companies.filter(c => c.review_status === review_status);
    }
    if (company_scale) {
        companies = companies.filter(c => c.company_scale === company_scale);
    }
    if (exhibition_participation_type) {
        companies = companies.filter(c => c.exhibition_participation_type === exhibition_participation_type);
    }
    if (primary_category) {
        companies = companies.filter(c => c.primary_category === primary_category);
    }

    // Column Mapping
    const columns = [
        'entity_id', 'entity_name', 'normalized_name', 'entity_aliases', 'review_status',
        'review_reason_codes', 'review_notes', 'reviewed_by', 'reviewed_at',
        'entity_type', 'company_scale', 'market_target', 'exhibition_participation_type',
        'primary_category', 'category_tags', 'fit_score', 'recommendation_reason',
        'signal_product_launch', 'signal_manufacturing', 'signal_certification',
        'signal_government_support', 'signal_procurement_ready',
        'top_keywords', 'evidence_article_count', 'evidence_titles', 'evidence_links',
        'source_queries', 'dedupe_group_id', 'merged_into_entity_id'
    ];

    const stringifier = stringify({ header: true, columns: columns, bom: true });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="entities_export.csv"');

    stringifier.pipe(res);

    companies.forEach(c => {
        // Prepare row data
        const evidenceArticles = c.source_articles.map(match => store.news.find(n => n.id === match.article_id)).filter(Boolean);
        const top3Articles = evidenceArticles.slice(0, 3);

        // Aggregate source queries
        const sourceQueries = [...new Set(evidenceArticles.map(n => n?.source_query).filter(Boolean))].join('|');

        const row = [
            c.id,
            c.name,
            c.normalized_name || '',
            (c.entity_aliases || []).join('|'),
            c.review_status,
            (c.review_reason_codes || []).join('|'),
            c.review_notes || '',
            c.reviewed_by || '',
            c.reviewed_at ? c.reviewed_at.toISOString() : '',
            c.entity_type,
            c.company_scale,
            c.market_target,
            c.exhibition_participation_type,
            c.primary_category,
            c.category_tags.join('|'),
            c.fit_score,
            c.recommendation_reason,
            c.signals.product_launch ? 1 : 0,
            c.signals.manufacturing ? 1 : 0,
            c.signals.certification ? 1 : 0,
            c.signals.government_support ? 1 : 0,
            c.signals.procurement_ready ? 1 : 0,
            // Top kw: "Key:Count"
            Object.entries(c.keyword_counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join('|'),
            c.source_articles.length,
            top3Articles.map(n => n?.title).join('||'),
            top3Articles.map(n => n?.source_url).join('||'),
            sourceQueries,
            c.dedupe_group_id || '',
            c.merged_into_entity_id || ''
        ];
        stringifier.write(row);
    });

    stringifier.end();
});

// CSV Import Endpoint
app.post('/imports/entity-reviews', upload.single('file'), (req: any, res: Response) => { // req: any for multer file
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    const results: any[] = [];

    const stream = Readable.from(file.buffer.toString('utf-8'));

    stream
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => {
            let updatedCount = 0;

            results.forEach((row: any) => {
                const entityId = row.entity_id;
                if (!entityId) return;

                const existing = store.companies.find(c => c.id === entityId);
                if (existing) {
                    // Update fields
                    if (row.review_status && isValidReviewStatus(row.review_status)) {
                        existing.review_status = row.review_status as ReviewStatus;
                    }
                    if (row.review_notes !== undefined) existing.review_notes = row.review_notes;
                    if (row.reviewed_by !== undefined) existing.reviewed_by = row.reviewed_by;
                    if (row.reviewed_at) existing.reviewed_at = new Date(row.reviewed_at);
                    else if (row.review_status && !existing.reviewed_at) existing.reviewed_at = new Date(); // timestamp if not provided

                    if (row.review_reason_codes) {
                        existing.review_reason_codes = row.review_reason_codes.split('|').filter((s: string) => s);
                    }

                    updatedCount++;
                }
            });

            res.json({ message: `Successfully processed ${results.length} rows. Updated ${updatedCount} entities.` });
        })
        .on('error', (err) => {
            res.status(500).json({ error: err.message });
        });
});

function isValidReviewStatus(status: string): boolean {
    return ['AUTO_CONFIRMED', 'NEEDS_REVIEW', 'HUMAN_CONFIRMED', 'REJECTED'].includes(status);
}


// Start server
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    // await runCollection(); // Disable auto-run on start for dev speed, or keep? Kept for consistency.
    await runCollection();
});
