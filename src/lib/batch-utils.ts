import { CompanyNews } from "@/types";
import { logger } from "./logger";

export interface CollectionBatch {
    id: string;
    collectedAt: string; // ISO timestamp (rounded to minute)
    sourceQuery: string;
    sourceType: string;
    articleCount: number;
    earliestArticleDate: string;
    latestArticleDate: string;
}

/**
 * created_at을 분 단위로 반올림
 * 예: 2026-01-23T07:57:52.124Z -> 2026-01-23T07:57:00.000Z
 */
function roundToMinute(isoString: string): string {
    const date = new Date(isoString);
    date.setSeconds(0, 0);
    return date.toISOString();
}

/**
 * 배치 ID 생성 - Base64 인코딩으로 단순화
 */
function generateBatchId(collectedAt: string, sourceQuery: string): string {
    const data = JSON.stringify({ time: collectedAt, query: sourceQuery });
    // Base64 인코딩 (URL-safe)
    return Buffer.from(data).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * 배치 ID 디코딩
 */
function decodeBatchId(batchId: string): { time: string; query: string } | null {
    try {
        // URL-safe Base64를 일반 Base64로 복원
        const base64 = batchId
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        // 패딩 추가
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        const json = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch (e) {
        logger.error('Failed to decode batchId:', batchId, e);
        return null;
    }
}

/**
 * 뉴스 아티클들을 수집 배치별로 그룹화
 */
export function groupArticlesByBatch(news: CompanyNews[]): CollectionBatch[] {
    const batchMap = new Map<string, CompanyNews[]>();

    // 1. 배치별로 그룹화
    news.forEach(article => {
        const roundedTime = roundToMinute(article.created_at as string);
        const key = `${roundedTime}|${article.source_query}`;

        if (!batchMap.has(key)) {
            batchMap.set(key, []);
        }
        batchMap.get(key)!.push(article);
    });

    // 2. 배치 객체 생성
    const batches: CollectionBatch[] = [];

    batchMap.forEach((articles, key) => {
        const [collectedAt, sourceQuery] = key.split('|');

        // 아티클 발행일 범위 계산
        const pubDates = articles
            .map(a => new Date(a.publication_date))
            .sort((a, b) => a.getTime() - b.getTime());

        batches.push({
            id: generateBatchId(collectedAt, sourceQuery),
            collectedAt,
            sourceQuery,
            sourceType: articles[0].source_type,
            articleCount: articles.length,
            earliestArticleDate: pubDates[0]?.toISOString() || collectedAt,
            latestArticleDate: pubDates[pubDates.length - 1]?.toISOString() || collectedAt,
        });
    });

    // 3. 최신순 정렬
    batches.sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());

    return batches;
}

/**
 * 배치 ID로 해당 배치의 아티클들 필터링
 */
export function getArticlesByBatchId(news: CompanyNews[], batchId: string): CompanyNews[] {
    const decoded = decodeBatchId(batchId);

    if (!decoded) {
        logger.error('Failed to decode batch ID:', batchId);
        return [];
    }

    const { time: isoTimestamp, query: sourceQuery } = decoded;

    // 모든 아티클을 확인하여 일치하는 것 찾기
    const filtered = news.filter(article => {
        const articleTime = roundToMinute(article.created_at as string);

        return articleTime === isoTimestamp && article.source_query === sourceQuery;
    });

    return filtered;
}

/**
 * 배치 ID로 배치 정보 가져오기
 */
export function getBatchById(news: CompanyNews[], batchId: string): CollectionBatch | null {
    const articles = getArticlesByBatchId(news, batchId);
    if (articles.length === 0) return null;

    const batches = groupArticlesByBatch(articles);
    return batches[0] || null;
}
