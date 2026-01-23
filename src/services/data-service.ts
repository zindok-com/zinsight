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
        // 1. Find by Normalized Name (Merge Key)
        let existingIndex = entities.findIndex(c => c.normalized_name === partial.normalized_name);

        if (existingIndex >= 0) {
            const existing = entities[existingIndex];

            // Merge Logic (Simplified for now, need to port full logic if needed)
            const merged = { ...existing };

            // Merge Signals
            merged.signals = {
                product_launch: existing.signals.product_launch || partial.signals.product_launch,
                manufacturing: existing.signals.manufacturing || partial.signals.manufacturing,
                certification: existing.signals.certification || partial.signals.certification,
                government_support: existing.signals.government_support || partial.signals.government_support,
                procurement_ready: existing.signals.procurement_ready || partial.signals.procurement_ready
            };

            // Recalculate Score logic - ported from legacy
            if (merged.signals.product_launch) {
                if (merged.fit_score < 80) {
                    merged.fit_score = 80;
                    merged.recommendation_reason = '신제품/기술 출시 정황(Product Launch) 포착 [병합됨]';
                    merged.candidate_status = 'CONFIRMED';
                    if (this.shouldUpdateReviewStatus(merged.review_status, 'AUTO_CONFIRMED')) {
                        merged.review_status = 'AUTO_CONFIRMED';
                    }
                }
            } else if (merged.signals.manufacturing) {
                if (merged.fit_score < 70) {
                    merged.fit_score = 70;
                    merged.recommendation_reason = '제조/양산 인프라 및 인증(Manufacturing) 보유 [병합됨]';
                    merged.candidate_status = 'CONFIRMED';
                    if (this.shouldUpdateReviewStatus(merged.review_status, 'AUTO_CONFIRMED')) {
                        merged.review_status = 'AUTO_CONFIRMED';
                    }
                }
            }

            // Merge Keyword Counts
            merged.keyword_counts = { ...existing.keyword_counts };
            Object.entries(partial.keyword_counts).forEach(([k, v]) => {
                merged.keyword_counts[k] = (merged.keyword_counts[k] || 0) + v;
            });
            merged.keywords = Object.keys(merged.keyword_counts);

            // Merge Aliases
            const newAliases = partial.entity_aliases || [partial.name];
            merged.entity_aliases = [...new Set([...(existing.entity_aliases || []), ...newAliases])];

            // Merge Articles
            const existingIds = new Set(existing.source_articles.map(a => a.article_id));
            const newArticles = partial.source_articles.filter(a => !existingIds.has(a.article_id));
            merged.source_articles = [...existing.source_articles, ...newArticles];

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
        if (current === 'HUMAN_CONFIRMED' || current === 'REJECTED') return false;
        if (current === 'AUTO_CONFIRMED' && incoming === 'NEEDS_REVIEW') return false;
        if (current === 'NEEDS_REVIEW' && incoming === 'AUTO_CONFIRMED') return true;
        return false;
    }
}
