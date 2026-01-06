export interface Category {
    id: string;
    name: string;
    description: string;
    created_at: Date;
}

export interface Company {
    id: string;
    name: string; // Candidate String
    category_id: string;
    company_size: string; // Kept for legacy, but mostly inferred
    focus_area: string;
    description: string;
    // Phase 2 New Fields
    exhibition_score: number; // Suitability Score
    tags: string[]; // [Size, Tech, Exhibition]
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
