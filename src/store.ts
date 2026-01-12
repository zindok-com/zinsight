import { Category, Company, CompanyNews, Trend } from './types';

export class Store {
    public categories: Category[] = [];
    public companies: Company[] = [];
    public news: CompanyNews[] = [];
    public trends: Trend[] = [];

    // Upsert company: If name exists, return existing ID and merge data if needed
    public upsertCompany(partialCompany: Company): Company {
        const existing = this.companies.find(c => c.name === partialCompany.name);
        if (existing) {
            // Merge logic: Update focus_area / keywords
            if (partialCompany.keywords && partialCompany.keywords.length > 0) {
                const existingKeywords = existing.keywords || [];
                existing.keywords = [...new Set([...existingKeywords, ...partialCompany.keywords])];
                // Sync focus_area with keywords for legacy support
                existing.focus_area = existing.keywords.slice(0, 5).join(', ');
            }

            // Merge Category Tags
            if (partialCompany.category_tags && partialCompany.category_tags.length > 0) {
                const existingTags = existing.category_tags || [];
                existing.category_tags = [...new Set([...existingTags, ...partialCompany.category_tags])];
            }

            // Merge Source Articles
            if (partialCompany.source_articles && partialCompany.source_articles.length > 0) {
                const existingArticles = existing.source_articles || [];
                existing.source_articles = [...new Set([...existingArticles, ...partialCompany.source_articles])];
            }

            // Update Entity Type if new one is present and existing is generic (optional logic, keeping simple for now)
            // If existing is 'Unknown' or empty, and new is specific, take new.
            if ((!existing.entity_type || existing.entity_type === 'Unknown') && partialCompany.entity_type) {
                existing.entity_type = partialCompany.entity_type;
            }

            // Phase 2: Merge Scores and Tags (Legacy Tags)
            if ((partialCompany.exhibition_score || 0) > (existing.exhibition_score || 0)) {
                existing.exhibition_score = partialCompany.exhibition_score;
            }
            if (partialCompany.tags && partialCompany.tags.length > 0) {
                const existingTags = existing.tags || [];
                existing.tags = [...new Set([...existingTags, ...partialCompany.tags])];
            }

            return existing;
        } else {
            this.companies.push(partialCompany);
            return partialCompany;
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
