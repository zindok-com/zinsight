export interface Category {
    id: string;
    name: string;
    description: string;
    created_at: Date | string;
}

export type EntityType = 'COMPANY' | 'INSTITUTION' | 'ASSOCIATION' | 'UNKNOWN';
export type MarketTarget = 'PUBLIC' | 'PRIVATE' | 'BOTH';
export type ExhibitionParticipationType =
    | 'PRODUCT_LAUNCH'
    | 'MANUFACTURING_READY'
    | 'SOLUTION_PARTNER'
    | 'MIXED'
    | 'UNKNOWN';

export type CandidateStatus = 'CONFIRMED' | 'PENDING' | 'EXCLUDED';

export type ReviewStatus = 'AUTO_CONFIRMED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED' | 'REJECTED' | 'GOLDENSET_CONFIRMED';

export interface Signals {
    led: boolean;
    certification: boolean;
    procurement: boolean;
    product_launch: boolean;
    award: boolean;
    exhibition: boolean;
    smart: boolean;
}

export interface EntityArticleMatch {
    article_id: string;
    title?: string;
    publication_date?: string;
    source_url?: string;
    match_confidence?: number;
    match_method?: 'RULE' | 'LLM' | 'HYBRID';
    match_excerpt?: string;
}

export interface Company {
    id: string; // entity_id

    // Naming & Identification
    name: string; // "representative name"
    entity_name_display: string; // Original extracted name with markers
    entity_aliases: string[]; // List of variations

    // Classification
    entity_type: EntityType;
    market_target: MarketTarget;
    exhibition_participation_type: ExhibitionParticipationType;

    // Analysis
    signals: Signals;
    fit_score: number;
    recommendation_reason: string;
    candidate_status: CandidateStatus;

    // Metadata / Tags
    category_tags: string[];
    keyword_counts: Record<string, number>;
    keywords: string[];

    // Review Process
    review_status: ReviewStatus;
    review_reason_codes?: string[]; // stored as JSON in DB, array here
    review_notes?: string;
    reviewed_by?: string;
    reviewed_at?: Date | string;

    // De-duplication
    dedupe_group_id?: string;
    merged_into_entity_id?: string;

    // Articles / Evidence
    source_query: string;
    source_articles: EntityArticleMatch[];

    // Legacy / Convenience
    description: string;
    focus_area: string;
    exhibition_score: number;
    tags: string[];

    created_at: Date | string;
    updated_at?: Date | string;
}

export type SourceType = 'NAVER_NEWS' | 'OTHER';

export interface CompanyNews {
    id: string;
    company_id: string; // mapped entity
    title: string;
    summary: string;
    publication_date: string;
    source_url: string;

    // Source traceability
    source_type: SourceType;
    source_query: string;
    original_link_hash?: string; // For deduplication

    raw_json: any;
    created_at: Date | string;
}

export interface Trend {
    id: string;
    category_id: string;
    trend_summary: string;
    evidence: string;
    created_at: Date | string;
}

// UI/Dashboard specific types
export interface ImportLog {
    id: string;
    timestamp: string;
    filename: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    processed_count: number;
    success_count: number;
    failure_count: number;
    error_log_path?: string;
}
