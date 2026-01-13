export interface Category {
    id: string;
    name: string;
    description: string;
    created_at: Date;
}

export type EntityType = 'COMPANY' | 'INSTITUTION' | 'ASSOCIATION' | 'UNKNOWN';
export type CompanyScale = 'SME' | 'LARGE' | 'PUBLIC' | 'OTHER';
export type MarketTarget = 'PUBLIC' | 'PRIVATE' | 'BOTH';
export type ExhibitionParticipationType =
    | 'PRODUCT_LAUNCH'
    | 'MANUFACTURING_READY'
    | 'SOLUTION_PARTNER'
    | 'MIXED'
    | 'UNKNOWN';

export type PrimaryCategory =
    | 'LIGHTING'
    | 'OLED'
    | 'SMART_LIGHTING'
    | 'IOT'
    | 'CONVERGENCE'
    | 'OTHER';

export type CandidateStatus = 'CONFIRMED' | 'PENDING' | 'EXCLUDED';

export interface Signals {
    product_launch: boolean;
    manufacturing: boolean;
    certification: boolean;
    government_support: boolean;
    procurement_ready: boolean;
}

export interface Company {
    id: string;
    name: string; // Common key (entity_name in spec)

    // New Fields
    entity_type: EntityType;
    company_scale: CompanyScale;
    market_target: MarketTarget;
    exhibition_participation_type: ExhibitionParticipationType;
    primary_category: PrimaryCategory;

    signals: Signals;
    fit_score: number;
    recommendation_reason: string;
    candidate_status: CandidateStatus;

    category_tags: string[];
    keyword_counts: Record<string, number>; // { keyword: count }

    // Legacy / Convenience
    keywords: string[]; // List of keys from keyword_counts
    description: string;
    source_query: string;
    source_articles: string[]; // List of Article IDs (evidence_articles)

    // Deprecated but kept for safety
    focus_area: string;
    exhibition_score: number; // mapped to fit_score
    tags: string[];

    created_at: Date;
}

export interface CompanyNews {
    id: string;
    company_id: string;
    title: string;
    summary: string;
    publication_date: string;
    source_url: string;
    raw_json: any;
    created_at: Date;
}

export interface Trend {
    id: string;
    category_id: string;
    trend_summary: string;
    evidence: string;
    created_at: Date;
}
