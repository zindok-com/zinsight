import { Category, Company, CompanyNews, Trend, CandidateStatus, Signals, ReviewStatus, EntityArticleMatch } from './types';

export class Store {
    public categories: Category[] = [];
    public companies: Company[] = [];
    public news: CompanyNews[] = [];
    public trends: Trend[] = [];

    // Prioritize Status: CONFIRMED > PENDING > EXCLUDED
    private getStatusPriority(status: CandidateStatus): number {
        if (status === 'CONFIRMED') return 3;
        if (status === 'PENDING') return 2;
        return 1;
    }

    // Status Priority for Review: HUMAN_* or REJECTED are finalized, don't auto-update.
    // NEEDS_REVIEW < AUTO_CONFIRMED (if confident)
    private shouldUpdateReviewStatus(current: ReviewStatus, incoming: ReviewStatus): boolean {
        if (current === 'HUMAN_CONFIRMED' || current === 'REJECTED') return false;
        if (current === 'AUTO_CONFIRMED' && incoming === 'NEEDS_REVIEW') return false; // Downgrade protection?
        // Actually if incoming is just default NEEDS_REVIEW, we shouldn't overwrite AUTO_CONFIRMED.
        // But if incoming is AUTO_CONFIRMED, we can overwrite NEEDS_REVIEW.
        if (current === 'NEEDS_REVIEW' && incoming === 'AUTO_CONFIRMED') return true;
        return false;
    }

    private mergeSignals(s1: Signals, s2: Signals): Signals {
        return {
            product_launch: s1.product_launch || s2.product_launch,
            manufacturing: s1.manufacturing || s2.manufacturing,
            certification: s1.certification || s2.certification,
            government_support: s1.government_support || s2.government_support,
            procurement_ready: s1.procurement_ready || s2.procurement_ready
        };
    }

    public upsertCompany(partial: Company): Company {
        // 1. Find by Normalized Name (Merge Key)
        const existing = this.companies.find(c => c.normalized_name === partial.normalized_name);

        if (existing) {
            // Merge Signals (Accumulate Evidence)
            const mergedSignals = this.mergeSignals(existing.signals, partial.signals);
            existing.signals = mergedSignals;

            // Recalculate Score based on Merged Signals
            // Use simple logic: Product Launch > Manufacturing > Procurement > Base
            if (mergedSignals.product_launch) {
                if (existing.fit_score < 80) {
                    existing.fit_score = 80;
                    existing.recommendation_reason = '신제품/기술 출시 정황(Product Launch) 포착 [병합됨]';
                    existing.candidate_status = 'CONFIRMED';
                    if (this.shouldUpdateReviewStatus(existing.review_status, 'AUTO_CONFIRMED')) {
                        existing.review_status = 'AUTO_CONFIRMED';
                    }
                }
            } else if (mergedSignals.manufacturing) {
                if (existing.fit_score < 70) {
                    existing.fit_score = 70;
                    existing.recommendation_reason = '제조/양산 인프라 및 인증(Manufacturing) 보유 [병합됨]';
                    existing.candidate_status = 'CONFIRMED';
                    if (this.shouldUpdateReviewStatus(existing.review_status, 'AUTO_CONFIRMED')) {
                        existing.review_status = 'AUTO_CONFIRMED';
                    }
                }
            }

            // Merge Keyword Counts
            Object.entries(partial.keyword_counts).forEach(([k, v]) => {
                existing.keyword_counts[k] = (existing.keyword_counts[k] || 0) + v;
            });
            existing.keywords = Object.keys(existing.keyword_counts);

            // Merge Aliases (Unique)
            if (!existing.entity_aliases) existing.entity_aliases = [existing.name];
            if (partial.entity_aliases) {
                existing.entity_aliases = [...new Set([...existing.entity_aliases, ...partial.entity_aliases])];
            } else {
                if (!existing.entity_aliases.includes(partial.name)) existing.entity_aliases.push(partial.name);
            }

            // Market Target: strict > loose?
            if (partial.market_target !== 'PRIVATE') {
                if (existing.market_target === 'PRIVATE') existing.market_target = partial.market_target;
                else if (existing.market_target !== partial.market_target) existing.market_target = 'BOTH';
            }

            // Merge Articles (EntityArticleMatch[])
            // Filter duplicates by article_id
            const existingIds = new Set(existing.source_articles.map(a => a.article_id));
            partial.source_articles.forEach(article => {
                if (!existingIds.has(article.article_id)) {
                    existing.source_articles.push(article);
                    existingIds.add(article.article_id);
                }
            });

            // Merge Tags
            existing.category_tags = [...new Set([...existing.category_tags, ...partial.category_tags])];

            // Update legacy fields
            existing.focus_area = existing.keywords.slice(0, 5).join(', ');
            existing.exhibition_score = existing.fit_score;

            existing.updated_at = new Date();

            return existing;
        } else {
            // New Entry
            // Ensure aliases initialized
            if (!partial.entity_aliases) partial.entity_aliases = [partial.name];

            this.companies.push(partial);
            return partial;
        }
    }

    public addNews(n: CompanyNews) {
        this.news.push(n);
    }

    public addTrend(t: Trend) {
        this.trends.push(t);
    }

    public getConstructedData() {
        return {
            companies: this.companies,
            news: this.news,
            trends: this.trends,
            categories: this.categories
        };
    }
}
