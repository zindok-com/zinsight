'use server';

import { prisma } from '@/lib/db';
import { getConsolidatedArticlesForExport } from './article-actions';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function generateConsolidatedSnapshot(regionIds: number[], month: string, filterType: 'pub_date' | 'created_at'): Promise<{
    success: boolean;
    filename?: string;
    articleCount?: number;
    message: string;
}> {
    if (regionIds.length === 0) {
        return { success: false, message: '하나 이상의 지역을 선택해야 합니다.' };
    }

    const regions = await prisma.region.findMany({ where: { id: { in: regionIds } } });
    const articles = await getConsolidatedArticlesForExport(regionIds, month, filterType);

    const now = new Date();
    const todayStr = formatDate(now);
    const filename = `snapshot_consolidated_${month}_generated_${todayStr}_${now.getTime()}.json`;

    const snapshot = {
        type: 'consolidated',
        month,
        generated_at: now.toISOString(),
        filters: {
            region_ids: regionIds,
            month,
            source_field: filterType,
        },
        total_article_count: articles.length,
        regions: regions.map((reg: typeof regions[number]) => {
            const regionArticles = articles.filter((a: typeof articles[number]) =>
                a.ingestions.some((ing: typeof a.ingestions[number]) => ing.region_id === reg.id)
            );

            return {
                id: reg.id,
                name: reg.name,
                slug: reg.slug,
                article_count: regionArticles.length,
                articles: regionArticles.map((a: typeof regionArticles[number]) => ({
                    id: a.id,
                    canonical_link: a.canonical_link,
                    link: a.link,
                    originallink: a.originallink,
                    title: a.title,
                    description: a.description,
                    pub_date: a.pub_date,
                    source: a.source,
                    created_at: a.created_at,
                    updated_at: a.updated_at,
                    keyword_id: a.ingestions.find((ing: typeof a.ingestions[number]) => ing.region_id === reg.id)?.keyword_id,
                })),
            };
        }),
    };

    const snapshotString = JSON.stringify(snapshot, null, 2);
    const sizeBytes = Buffer.byteLength(snapshotString, 'utf-8');

    await prisma.snapshot.create({
        data: {
            filename,
            slug: 'consolidated',
            month,
            content: snapshot as any,
            size_bytes: sizeBytes,
        },
    });

    return {
        success: true,
        filename,
        articleCount: articles.length,
        message: `통합 Snapshot 생성 완료: ${filename} (기사 ${articles.length}건)`,
    };
}

export interface SnapshotInfo {
    filename: string;
    regionSlug: string;
    month: string;
    generatedAt: string;
    sizeBytes: number;
    isLatest?: boolean;
}

export async function listSnapshots(regionSlug?: string, month?: string): Promise<SnapshotInfo[]> {
    const dbSnapshots = await prisma.snapshot.findMany({
        where: {
            ...(regionSlug ? { slug: regionSlug } : {}),
            ...(month ? { month } : {}),
        },
        orderBy: { filename: 'desc' },
    });

    const snapshots: SnapshotInfo[] = dbSnapshots.map((s) => {
        const match = s.filename.match(/^snapshot_(.+?)_(\d{4}-\d{2})_generated_(\d{4}-\d{2}-\d{2})_\d+\.json$/);
        const genDate = match ? match[3] : s.created_at.toISOString().split('T')[0];

        return {
            filename: s.filename,
            regionSlug: s.slug,
            month: s.month,
            generatedAt: genDate,
            sizeBytes: s.size_bytes,
        };
    });

    return snapshots;
}

export async function getSnapshotContent(filename: string) {
    return prisma.snapshot.findUnique({ where: { filename } });
}
