import path from 'path';
import { Company, CompanyNews, ReviewStatus } from '@/types';
import { PARSED_DIR, readJsonFile, saveJsonFile } from '@/lib/file-system';

const ENTITIES_FILE = path.join(PARSED_DIR, 'entities.json');
const NEWS_FILE = path.join(PARSED_DIR, 'news.json');

export class DataService {
    private static instance: DataService;

    private constructor() { }

    public static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    public async getEntities(): Promise<Company[]> {
        const data = await readJsonFile<Company[]>(ENTITIES_FILE);
        return data || [];
    }

    public async saveEntities(entities: Company[]): Promise<void> {
        await saveJsonFile(ENTITIES_FILE, entities);
    }

    public async getNews(): Promise<CompanyNews[]> {
        const data = await readJsonFile<CompanyNews[]>(NEWS_FILE);
        return data || [];
    }

    public async saveNews(news: CompanyNews[]): Promise<void> {
        await saveJsonFile(NEWS_FILE, news);
    }

    // Logic from legacy Store.upsertCompany
    public async upsertCompany(partial: Company, entities: Company[]): Promise<Company[]> {
        // 1. Find by Name (Normalized for comparison)
        const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const searchName = normalize(partial.name);
        let existingIndex = entities.findIndex(c => normalize(c.name) === searchName);

        if (existingIndex >= 0) {
            const existing = entities[existingIndex];

            // Merge Logic
            const merged = { ...existing };

            // Merge Signals
            merged.signals = {
                led: existing.signals.led || partial.signals.led,
                certification: existing.signals.certification || partial.signals.certification,
                procurement: existing.signals.procurement || partial.signals.procurement,
                product_launch: existing.signals.product_launch || partial.signals.product_launch,
                award: existing.signals.award || partial.signals.award,
                exhibition: existing.signals.exhibition || partial.signals.exhibition,
                smart: existing.signals.smart || partial.signals.smart
            };

            // Recalculate Score logic - ported from legacy and adapted
            // If it's confirmed from golden set or has strong signals
            if (partial.candidate_status === 'CONFIRMED') {
                merged.candidate_status = 'CONFIRMED';
                merged.fit_score = Math.max(merged.fit_score, partial.fit_score);
            }

            // Sync Review Status - GoldenSet takes priority or updates
            if (this.shouldUpdateReviewStatus(merged.review_status, partial.review_status)) {
                merged.review_status = partial.review_status;
            }

            // Merge Keyword Counts
            merged.keyword_counts = { ...existing.keyword_counts };
            if (partial.keyword_counts) {
                Object.entries(partial.keyword_counts).forEach(([k, v]) => {
                    merged.keyword_counts[k] = (merged.keyword_counts[k] || 0) + v;
                });
            }
            merged.keywords = Object.keys(merged.keyword_counts);

            // Merge Aliases
            const newAliases = partial.entity_aliases || [partial.name];
            merged.entity_aliases = [...new Set([...(existing.entity_aliases || []), ...newAliases])];

            // Merge Articles (Update metadata if already exists, otherwise add)
            const articleMap = new Map(existing.source_articles.map(a => [a.article_id, a]));
            partial.source_articles.forEach(art => {
                const existingArt = articleMap.get(art.article_id);
                if (existingArt) {
                    // Update existing with new metadata if available
                    articleMap.set(art.article_id, {
                        ...existingArt,
                        ...art
                    });
                } else {
                    articleMap.set(art.article_id, art);
                }
            });
            merged.source_articles = Array.from(articleMap.values());

            merged.updated_at = new Date().toISOString();

            entities[existingIndex] = merged;
        } else {
            // New Entry
            if (!partial.entity_aliases) partial.entity_aliases = [partial.name];
            entities.push(partial);
        }

        return entities;
    }

    private shouldUpdateReviewStatus(current: ReviewStatus, incoming: ReviewStatus): boolean {
        if (current === incoming) return false;

        // Manual/Final states should not be changed by automated processes
        if (current === 'REJECTED' || current === 'HUMAN_CONFIRMED') {
            return false;
        }

        // GOLDENSET_CONFIRMED is high priority but can be overridden by manual decision or explicit REJECT in source
        if (current === 'GOLDENSET_CONFIRMED') {
            return incoming === 'REJECTED' || incoming === 'HUMAN_CONFIRMED';
        }

        // AUTO_CONFIRMED can be upgraded to GOLDENSET or manual decisions
        if (current === 'AUTO_CONFIRMED') {
            return incoming === 'GOLDENSET_CONFIRMED' || incoming === 'HUMAN_CONFIRMED' || incoming === 'REJECTED';
        }

        // NEEDS_REVIEW can be upgraded to anything
        if (current === 'NEEDS_REVIEW') {
            return incoming !== 'NEEDS_REVIEW';
        }

        return false;
    }
}
