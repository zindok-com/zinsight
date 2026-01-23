'use server';

import { DataService } from '@/services/data-service';

export async function getDashboardStats() {
    const service = DataService.getInstance();
    const entities = await service.getEntities();

    // Calculate stats
    const totalEntities = entities.length;

    const needsReview = entities.filter(e => e.review_status === 'NEEDS_REVIEW').length;
    const confirmed = entities.filter(e => e.review_status === 'HUMAN_CONFIRMED' || e.review_status === 'AUTO_CONFIRMED').length;
    const rejected = entities.filter(e => e.review_status === 'REJECTED').length;

    // We don't have article count easily accessible without reading news.json
    // But let's assume we can get it or just count connected articles
    const uniqueArticles = new Set(entities.flatMap(e => e.source_articles.map(a => a.article_id))).size;

    return {
        totalEntities,
        needsReview,
        confirmed,
        rejected,
        uniqueArticles
    };
}
