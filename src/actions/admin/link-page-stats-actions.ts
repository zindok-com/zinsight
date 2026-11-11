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
    leads: number;
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

/** 기간 합계 (직전 기간 비교에도 사용) */
export interface LinkPageTotals {
    views: number;
    uniqueViews: number;
    clicks: number;
    inquiryClicks: number;
    /** '연락처 남기기' 버튼을 눌러 폼을 연 횟수 */
    leadFormOpens: number;
    /** 실제 접수된 연락처 수 (보관 기간 1년이 지나 삭제된 접수는 빠짐) */
    leads: number;
    videoPlays: number;
    uniqueVideoPlays: number;
}

export interface LinkPageDailyRow extends LinkPageTotals {
    date: string;
}

export interface LinkPageStats extends LinkPageTotals {
    org: { id: number; name: string; slug: string };
    range: LinkPageStatsRange;
    /** 같은 길이의 직전 기간 */
    previousRange: LinkPageStatsRange;
    previous: LinkPageTotals;
    hasData: boolean;
    unreadLeads: number;
    daily: LinkPageDailyRow[];
    /** 방문 기기 비율: 원본 이벤트(90일 보관) 기준이라 조회 시작일이 그보다 이르면 countedFrom부터만 집계 */
    devices: { mobile: number; desktop: number; countedFrom: string };
    sources: LinkPageSourceRow[];
    links: LinkPageLinkRow[];
    kinds: Array<{ kind: LinkPageLinkKind; clicks: number }>;
}

const RAW_RETENTION_DAYS = 90;
const DAY_MS = 86_400_000;

const emptyTotals = (): LinkPageTotals => ({
    views: 0,
    uniqueViews: 0,
    clicks: 0,
    inquiryClicks: 0,
    leadFormOpens: 0,
    leads: 0,
    videoPlays: 0,
    uniqueVideoPlays: 0,
});

// link_page_daily.date는 KST 일자를 UTC 자정 값으로 저장
const dayStart = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const ymdOf = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (ymd: string, days: number) => ymdOf(new Date(dayStart(ymd).getTime() + days * DAY_MS));
const kstYmdOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
// 원본 이벤트·연락처는 created_at 시각으로 저장 → KST 날짜 경계로 자름
const kstStart = (ymd: string) => new Date(`${ymd}T00:00:00.000+09:00`);

function addDailyRow(t: LinkPageTotals, r: { event: string; link_key: string; count: number; unique_count: number }) {
    if (r.event === 'view') {
        t.views += r.count;
        t.uniqueViews += r.unique_count;
    } else if (r.event === 'click') {
        t.clicks += r.count;
        if (r.link_key === 'inquiry') t.inquiryClicks += r.count;
        if (r.link_key === 'lead') t.leadFormOpens += r.count;
    } else if (r.event === 'video') {
        t.videoPlays += r.count;
        t.uniqueVideoPlays += r.unique_count;
    }
}

async function loadTotals(organizationId: number, range: LinkPageStatsRange): Promise<LinkPageTotals> {
    const [rows, leads] = await Promise.all([
        prisma.linkPageDaily.findMany({
            where: { organization_id: organizationId, date: { gte: dayStart(range.from), lte: dayStart(range.to) } },
            select: { event: true, link_key: true, count: true, unique_count: true },
        }),
        prisma.linkPageLead.count({
            where: { organization_id: organizationId, created_at: { gte: kstStart(range.from), lt: kstStart(addDays(range.to, 1)) } },
        }),
    ]);
    const totals = emptyTotals();
    for (const r of rows) addDailyRow(totals, r);
    totals.leads = leads;
    return totals;
}

// 링크 페이지 통계 (자체 서버 집계 link_page_daily 기준, 연락처는 link_page_leads, 기기는 원본 이벤트)
export async function getLinkPageStats(organizationId: number, range: LinkPageStatsRange): Promise<LinkPageStats | null> {
    await requireAdmin();
    if (!Number.isInteger(organizationId)) return null;
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, company_name: true, slug: true },
    });
    if (!org) return null;

    const lengthDays = Math.round((dayStart(range.to).getTime() - dayStart(range.from).getTime()) / DAY_MS) + 1;
    const previousRange = { from: addDays(range.from, -lengthDays), to: addDays(range.from, -1) };
    const rawFloor = kstYmdOf(new Date(Date.now() - (RAW_RETENTION_DAYS - 1) * DAY_MS));
    const deviceFrom = range.from > rawFloor ? range.from : rawFloor;
    const rangeEnd = kstStart(addDays(range.to, 1));

    const [rows, codes, leadRows, unreadLeads, deviceGroups, previous] = await Promise.all([
        prisma.linkPageDaily.findMany({
            where: { organization_id: org.id, date: { gte: dayStart(range.from), lte: dayStart(range.to) } },
            orderBy: { date: 'asc' },
        }),
        prisma.qrLink.findMany({ where: { organization_id: org.id }, select: { code: true, label: true } }),
        prisma.linkPageLead.findMany({
            where: { organization_id: org.id, created_at: { gte: kstStart(range.from), lt: rangeEnd } },
            select: { created_at: true, source_code: true },
        }),
        prisma.linkPageLead.count({ where: { organization_id: org.id, read_at: null } }),
        deviceFrom <= range.to
            ? prisma.linkPageEvent.groupBy({
                  by: ['device'],
                  where: { organization_id: org.id, event: 'view', created_at: { gte: kstStart(deviceFrom), lt: rangeEnd } },
                  _count: { _all: true },
              })
            : Promise.resolve([] as Array<{ device: string; _count: { _all: number } }>),
        loadTotals(org.id, previousRange),
    ]);
    const codeLabel = new Map(codes.map((c) => [c.code, c.label]));

    const totals = emptyTotals();
    const sourceMap = new Map<string, LinkPageSourceRow>();
    const linkMap = new Map<string, LinkPageLinkRow>();
    const kindMap = new Map<string, number>();
    // 기간의 모든 날짜를 미리 만들어 빈 날도 0으로 표시
    const dailyMap = new Map<string, LinkPageDailyRow>();
    for (let d = range.from; d <= range.to; d = addDays(d, 1)) dailyMap.set(d, { date: d, ...emptyTotals() });

    const sourceRow = (source: string) => {
        const row = sourceMap.get(source) ?? { source, label: codeLabel.get(source) ?? null, views: 0, uniqueViews: 0, clicks: 0, leads: 0 };
        sourceMap.set(source, row);
        return row;
    };

    for (const r of rows) {
        addDailyRow(totals, r);
        const day = dailyMap.get(ymdOf(r.date));
        if (day) addDailyRow(day, r);

        if (r.event === 'view') {
            const s = sourceRow(r.source_code);
            s.views += r.count;
            s.uniqueViews += r.unique_count;
        } else if (r.event === 'click') {
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

    for (const lead of leadRows) {
        totals.leads += 1;
        sourceRow(lead.source_code).leads += 1;
        const day = dailyMap.get(kstYmdOf(lead.created_at));
        if (day) day.leads += 1;
    }

    const links = [...linkMap.values()]
        .map((l) => ({ ...l, ctr: totals.views > 0 ? l.clicks / totals.views : null }))
        .sort((a, b) => b.clicks - a.clicks);

    const deviceCount = (name: string) => deviceGroups.find((g) => g.device === name)?._count._all ?? 0;

    return {
        org: { id: org.id, name: org.company_name, slug: org.slug || String(org.id) },
        range: { from: range.from, to: range.to },
        previousRange,
        previous,
        hasData: rows.length > 0 || leadRows.length > 0,
        unreadLeads,
        ...totals,
        daily: [...dailyMap.values()],
        devices: { mobile: deviceCount('mobile'), desktop: deviceCount('desktop'), countedFrom: deviceFrom },
        // direct를 맨 아래로, 나머지는 방문 많은 순
        sources: [...sourceMap.values()].sort((a, b) =>
            a.source === 'direct' ? 1 : b.source === 'direct' ? -1 : b.views - a.views
        ),
        links,
        kinds: LINK_PAGE_LINK_KINDS.map((kind) => ({ kind, clicks: kindMap.get(kind) ?? 0 })),
    };
}
