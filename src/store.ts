import { Category, Company, CompanyNews, Trend, CandidateStatus, Signals } from './types';

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
        const existing = this.companies.find(c => c.name === partial.name);
        if (existing) {
            // Merge Signals
            existing.signals = this.mergeSignals(existing.signals, partial.signals);

            // Merge Keyword Counts
            Object.entries(partial.keyword_counts).forEach(([k, v]) => {
                existing.keyword_counts[k] = (existing.keyword_counts[k] || 0) + v;
            });
            existing.keywords = Object.keys(existing.keyword_counts);

            // Upgrade Status if new is higher
            const existingP = this.getStatusPriority(existing.candidate_status);
            const newP = this.getStatusPriority(partial.candidate_status);

            if (newP > existingP) {
                existing.candidate_status = partial.candidate_status;
                existing.recommendation_reason = partial.recommendation_reason; // Update reason to match better status
                existing.exhibition_participation_type = partial.exhibition_participation_type;
                existing.fit_score = partial.fit_score;
            } else if (newP === existingP) {
                // Same priority, maybe update score if higher
                if (partial.fit_score > existing.fit_score) {
                    existing.fit_score = partial.fit_score;
                    existing.recommendation_reason = partial.recommendation_reason;
                }
            }

            // Market Target: strict > loose?
            if (partial.market_target !== 'PRIVATE') {
                if (existing.market_target === 'PRIVATE') existing.market_target = partial.market_target;
                else if (existing.market_target !== partial.market_target) existing.market_target = 'BOTH';
            }

            // Merge Articles
            existing.source_articles = [...new Set([...existing.source_articles, ...partial.source_articles])];

            // Merge Tags
            existing.category_tags = [...new Set([...existing.category_tags, ...partial.category_tags])];

            // Update legacy fields
            existing.focus_area = existing.keywords.slice(0, 5).join(', ');
            existing.exhibition_score = existing.fit_score;

            return existing;
        } else {
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
