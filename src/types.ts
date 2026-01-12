export interface Category {
    id: string;
    name: string;
    description: string;
    created_at: Date;
}

export interface Company {
    id: string;
    name: string; // Candidate String
    // Phase 3 Extensions
    entity_type: string; // 'Public', 'Association', 'SME', 'Large', 'Other'
    primary_category: string; // 'OLED', 'Smart Lighting', 'IoT', 'Convergence', 'Other'
    category_tags: string[]; // Accumulated tags
    keywords: string[]; // Extracted keywords from articles
    
    // Legacy fields (kept for compatibility but logic updated)
    category_id: string; 
    company_size: string; 
    focus_area: string;
    description: string;
    
    exhibition_score: number; // Suitability Score
    tags: string[]; // General purpose tags
    
    // Source Tracking
    source_query: string; // The query that found this entity
    source_articles: string[]; // List of Article IDs
    
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
