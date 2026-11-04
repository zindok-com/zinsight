'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { LINK_PAGE_LINK_KINDS, type LinkPageLinkKind } from '@/lib/org-links';

export interface LinkPageStatsRange {
    from: string;
    to: string;
}

export interface LinkPageSourceRow {
    source: string;
    /** /go 코드의 용도 (direct·삭제된 코드는 null) */
    label: string | null;
    views: number;
    uniqueViews: number;
    clicks: number;
}

export interface LinkPageLinkRow {
    key: string;
    label: string;
    kind: string;
    clicks: number;
    uniqueClicks: number;
    /** 클릭 ÷ 방문 (방문이 없으면 null) */
    ctr: number | null;
}

export interface LinkPageStats {
    org: { id: number; name: string; slug: string };
    range: LinkPageStatsRange;
    hasData: boolean;
    views: number;
    uniqueViews: number;
    clicks: number;
    inquiryClicks: number;
    sources: LinkPageSourceRow[];
    links: LinkPageLinkRow[];
    kinds: Array<{ kind: LinkPageLinkKind; clicks: number }>;
}

// 링크 페이지 통계 (자체 서버 집계 link_page_daily 기준)
export async function getLinkPageStats(organizationId: number, range: LinkPageStatsRange): Promise<LinkPageStats | null> {
    await requireAdmin();
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, company_name: true, slug: true },
    });
    if (!org) return null;

    const [rows, codes] = await Promise.all([
        prisma.linkPageDaily.findMany({
            where: {
                organization_id: org.id,
                date: { gte: new Date(`${range.from}T00:00:00.000Z`), lte: new Date(`${range.to}T00:00:00.000Z`) },
            },
            orderBy: { date: 'asc' },
        }),
        prisma.qrLink.findMany({ where: { organization_id: org.id }, select: { code: true, label: true } }),
    ]);
    const codeLabel = new Map(codes.map((c) => [c.code, c.label]));

    const sourceMap = new Map<string, LinkPageSourceRow>();
    const linkMap = new Map<string, LinkPageLinkRow>();
    const kindMap = new Map<string, number>();
    let views = 0;
    let uniqueViews = 0;
    let clicks = 0;

    const sourceRow = (source: string) => {
        const row = sourceMap.get(source) ?? { source, label: codeLabel.get(source) ?? null, views: 0, uniqueViews: 0, clicks: 0 };
        sourceMap.set(source, row);
        return row;
    };

    for (const r of rows) {
        if (r.event === 'view') {
            views += r.count;
            uniqueViews += r.unique_count;
            const s = sourceRow(r.source_code);
            s.views += r.count;
            s.uniqueViews += r.unique_count;
        } else if (r.event === 'click') {
            clicks += r.count;
            sourceRow(r.source_code).clicks += r.count;
            // 라벨은 기간 중 마지막 기록 기준 (rows는 날짜 오름차순)
            const link = linkMap.get(r.link_key) ?? { key: r.link_key, label: r.label, kind: r.link_kind, clicks: 0, uniqueClicks: 0, ctr: null };
            link.clicks += r.count;
            link.uniqueClicks += r.unique_count;
            link.label = r.label || link.label;
            link.kind = r.link_kind || link.kind;
            linkMap.set(r.link_key, link);
            kindMap.set(r.link_kind, (kindMap.get(r.link_kind) ?? 0) + r.count);
        }
    }

    const links = [...linkMap.values()]
        .map((l) => ({ ...l, ctr: views > 0 ? l.clicks / views : null }))
        .sort((a, b) => b.clicks - a.clicks);

    return {
        org: { id: org.id, name: org.company_name, slug: org.slug || String(org.id) },
        range: { from: range.from, to: range.to },
        hasData: rows.length > 0,
        views,
        uniqueViews,
        clicks,
        inquiryClicks: linkMap.get('inquiry')?.clicks ?? 0,
        // direct를 맨 아래로, 나머지는 방문 많은 순
        sources: [...sourceMap.values()].sort((a, b) =>
            a.source === 'direct' ? 1 : b.source === 'direct' ? -1 : b.views - a.views
        ),
        links,
        kinds: LINK_PAGE_LINK_KINDS.map((kind) => ({ kind, clicks: kindMap.get(kind) ?? 0 })),
    };
}
