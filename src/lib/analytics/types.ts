// ── 신뢰도 등급 공통 응답 구조 (F-10) ──────────────────────────────
// measured    : GA4 Data API 기반 실측 데이터
// third_party : Search Console 등 제3자 제공 데이터
// unmeasurable: AI 개요/LLM 노출 등 구조적으로 얻을 수 없는 항목

export type ConfidenceLevel = 'measured' | 'third_party' | 'unmeasurable';

export interface MetricValue<T = number> {
    value: T | null;
    confidenceLevel: ConfidenceLevel;
    source?: string;
}

// ── 편의 헬퍼 ────────────────────────────────────────────────────────
export function measured<T>(value: T, source = 'GA4 Data API'): MetricValue<T> {
    return { value, confidenceLevel: 'measured', source };
}

export function fromThirdParty<T>(value: T, source: string): MetricValue<T> {
    return { value, confidenceLevel: 'third_party', source };
}

export function unmeasurable(): MetricValue<null> {
    return { value: null, confidenceLevel: 'unmeasurable' };
}

// ── 유입 채널 커스텀 분류 (F-08) ────────────────────────────────────
export type CustomChannel = 'ai_service' | 'search' | 'sns' | 'direct' | 'other';

export const CHANNEL_LABELS: Record<CustomChannel, string> = {
    ai_service: '🤖 AI 서비스',
    search: '🔍 검색엔진',
    sns: '📱 SNS',
    direct: '🔗 직접 방문',
    other: '기타',
};

export const CHANNEL_COLORS: Record<CustomChannel, string> = {
    ai_service: '#8b5cf6',
    search: '#3b82f6',
    sns: '#f59e0b',
    direct: '#10b981',
    other: '#6b7280',
};

export interface ChannelRow {
    channel: CustomChannel;
    channelLabel: string;
    sessions: MetricValue<number>;
    avgDuration: MetricValue<number>;
}

// ── 방문자 속성 (F-13) ──────────────────────────────────────────────
export interface DeviceRow {
    device: string; // 'desktop' | 'mobile' | 'tablet'
    sessions: number;
}

export interface HourRow {
    hour: number; // 0~23
    sessions: number;
}

export interface VisitorAttributes {
    devices: DeviceRow[];
    hours: HourRow[];
    newVsReturning: { type: string; sessions: number }[];
    browsers: { browser: string; sessions: number }[];
}
