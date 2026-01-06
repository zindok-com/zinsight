export interface Category {
    id: string;
    name: string;
    description: string;
    created_at: Date;
}

export interface Company {
    id: string;
    name: string;
    category_id: string;
    company_size: string; // "중소기업" | "강소기업" | "벤처기업" | "기타"
    focus_area: string; // Summary of technical keywords
    description: string; // Summary based on news
    created_at: Date;
}

export interface CompanyNews {
    id: string;
    company_id: string;
    title: string;
    summary: string;
    publication_date: string;
    source_url: string;
    raw_json: any; // Preserving raw data for debugging
    created_at: Date;
}

export interface Trend {
    id: string;
    category_id: string;
    trend_summary: string;
    evidence: string;
    created_at: Date;
}
