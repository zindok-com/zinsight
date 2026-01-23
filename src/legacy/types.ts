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

export type ReviewStatus = 'AUTO_CONFIRMED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED' | 'REJECTED';

export interface Signals {
    product_launch: boolean;
    manufacturing: boolean;
    certification: boolean;
    government_support: boolean;
    procurement_ready: boolean;
}

export interface EntityArticleMatch {
    article_id: string;
    match_confidence: number;
    match_method: 'RULE' | 'LLM' | 'HYBRID';
    match_excerpt?: string;
}

export interface Company {
    id: string; // entity_id

    // Naming & Identification
    name: string; // This might be used as "representative name" or "display name" initially
    entity_name_display: string; // Preserves the original extracted name with (Corp) markers for display
    normalized_name: string; // REQUIRED: Merge key (e.g., "와이비즈")
    entity_aliases: string[]; // List of all variations found (JSON storage)

    // Classification
    entity_type: EntityType;
    company_scale: CompanyScale;
    market_target: MarketTarget;
    exhibition_participation_type: ExhibitionParticipationType;
    primary_category: PrimaryCategory;

    // Analysis
    signals: Signals;
    fit_score: number;
    recommendation_reason: string;
    candidate_status: CandidateStatus;

    // Metadata / Tags
    category_tags: string[]; // List of strings
    keyword_counts: Record<string, number>; // { keyword: count }
    keywords: string[]; // Keys of keyword_counts

    // Review Process
    review_status: ReviewStatus;
    review_reason_codes?: string[]; // stored as JSON in DB, array here
    review_notes?: string;
    reviewed_by?: string;
    reviewed_at?: Date;

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

    created_at: Date;
    updated_at?: Date;
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
    original_link_hash?: string; // For deduplication of articles

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
