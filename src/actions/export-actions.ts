'use server';

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { getArticlesForExport } from './article-actions';

const SNAPSHOTS_DIR = path.join(process.cwd(), 'data', 'snapshots');

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatMonth(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function generateMonthlySnapshot(industryId: number, month: string): Promise<{
    success: boolean;
    filename?: string;
    articleCount?: number;
    message: string;
}> {
    const industry = await prisma.industry.findUnique({ where: { id: industryId } });
    if (!industry) {
        return { success: false, message: '산업를 찾을 수 없습니다.' };
    }

    const articles = await getArticlesForExport(industryId, month);
    const now = new Date();
    const todayStr = formatDate(now);
    const filename = `snapshot_${industry.slug}_${month}_generated_${todayStr}_${now.getTime()}.json`;
    const filepath = path.join(SNAPSHOTS_DIR, filename);

    const snapshot = {
        industry: { id: industry.id, name: industry.name, slug: industry.slug },
        month,
        generated_at: now.toISOString(),
        filters: {
            industry_id: industryId,
            month,
            source_field: 'pub_date',
        },
        article_count: articles.length,
        articles: articles.map(a => ({
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
            keyword_id: a.ingestions[0]?.keyword_id,
        })),
    };

    await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');

    return {
        success: true,
        filename,
        articleCount: articles.length,
        message: `Snapshot 생성 완료: ${filename} (기사 ${articles.length}건)`,
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
    await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
    const files = await fs.readdir(SNAPSHOTS_DIR);

    const snapshots: SnapshotInfo[] = [];

    for (const filename of files) {
        if (!filename.endsWith('.json')) continue;

        // Pattern: snapshot_{slug}_{YYYY-MM}_generated_{YYYY-MM-DD}_{ts}.json
        const match = filename.match(/^snapshot_(.+?)_(\d{4}-\d{2})_generated_(\d{4}-\d{2}-\d{2})_\d+\.json$/);
        if (!match) continue;

        const [, slug, mon, genDate] = match;
        if (industrySlug && slug !== industrySlug) continue;
        if (month && mon !== month) continue;

        const stat = await fs.stat(path.join(SNAPSHOTS_DIR, filename));
        snapshots.push({
            filename,
            industrySlug: slug,
            month: mon,
            generatedAt: genDate,
            sizeBytes: stat.size,
        });
    }

    // Sort descending by filename (which includes timestamp)
    snapshots.sort((a, b) => b.filename.localeCompare(a.filename));

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
