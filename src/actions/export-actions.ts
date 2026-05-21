'use server';

import { prisma } from '@/lib/db';
import { getConsolidatedArticlesForExport } from './article-actions';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function generateConsolidatedSnapshot(industryIds: number[], month: string, filterType: 'pub_date' | 'created_at'): Promise<{
    success: boolean;
    filename?: string;
    articleCount?: number;
    message: string;
}> {
    if (industryIds.length === 0) {
        return { success: false, message: '하나 이상의 산업을 선택해야 합니다.' };
    }

    const industries = await prisma.industry.findMany({ where: { id: { in: industryIds } } });
    const articles = await getConsolidatedArticlesForExport(industryIds, month, filterType);
    
    const now = new Date();
    const todayStr = formatDate(now);
    const filename = `snapshot_consolidated_${month}_generated_${todayStr}_${now.getTime()}.json`;

    const snapshot = {
        type: 'consolidated',
        month,
        generated_at: now.toISOString(),
        filters: {
            industry_ids: industryIds,
            month,
            source_field: filterType,
        },
        total_article_count: articles.length,
        industries: industries.map((ind: typeof industries[number]) => {
            const industryArticles = articles.filter((a: typeof articles[number]) => 
                a.ingestions.some((ing: typeof a.ingestions[number]) => ing.industry_id === ind.id)
            );
            
            return {
                id: ind.id,
                name: ind.name,
                slug: ind.slug,
                article_count: industryArticles.length,
                articles: industryArticles.map((a: typeof industryArticles[number]) => ({
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
                    keyword_id: a.ingestions.find((ing: typeof a.ingestions[number]) => ing.industry_id === ind.id)?.keyword_id,
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
        }
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
    industrySlug: string;
    month: string;
    generatedAt: string;        // date part from filename
    sizeBytes: number;
    isLatest?: boolean;
}

export async function listSnapshots(industrySlug?: string, month?: string): Promise<SnapshotInfo[]> {
    const dbSnapshots = await prisma.snapshot.findMany({
        where: {
            ...(industrySlug ? { slug: industrySlug } : {}),
            ...(month ? { month } : {}),
        },
        orderBy: {
            filename: 'desc'
        }
    });

    const snapshots: SnapshotInfo[] = dbSnapshots.map(s => {
        // Pattern: snapshot_{slug}_{YYYY-MM}_generated_{YYYY-MM-DD}_{ts}.json
        const match = s.filename.match(/^snapshot_(.+?)_(\d{4}-\d{2})_generated_(\d{4}-\d{2}-\d{2})_\d+\.json$/);
        const genDate = match ? match[3] : s.created_at.toISOString().split('T')[0];

        return {
            filename: s.filename,
            industrySlug: s.slug,
            month: s.month,
            generatedAt: genDate,
            sizeBytes: s.size_bytes,
        };
    });

    // Mark latest per (industrySlug, month) group
    const seen = new Set<string>();
    for (const s of snapshots) {
        const key = `${s.industrySlug}_${s.month}`;
        if (!seen.has(key)) {
            s.isLatest = true;
            seen.add(key);
        }
    }

    return snapshots;
}

