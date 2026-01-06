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
            // Merge logic: Update focus_area if new ones found
            const parseTech = (s: string) => s.split(', ').filter(Boolean);
            const existingTech = parseTech(existing.focus_area);
            const newTech = parseTech(partialCompany.focus_area);
            const mergedTech = [...new Set([...existingTech, ...newTech])].join(', ');

            existing.focus_area = mergedTech;
            // return existing
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
