'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { ORG_LINK_MAX, deriveDefaultOrgLinks, normalizeOrgLinks, type OrgLinkInput } from '@/lib/org-links';

const CLICK_DAYS = 30;

export interface AdminOrgLinkRow extends OrgLinkInput {
    id: number | null;
    clicks30d: number;
}

export interface AdminLinkClickSummary {
    key: string;
    label: string;
    kind: string;
    total: number;
    /** /go 코드로 들어온 방문의 클릭 */
    viaGo: number;
}

// 조직 링크 목록 + 최근 30일 클릭 집계. 등록된 링크가 없으면 기존 외부 링크로 만든 기본 목록(저장 전)을 돌려줌
export async function getOrganizationLinks(organizationId: number) {
    await requireAdmin();
    try {
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - CLICK_DAYS);
        since.setUTCHours(0, 0, 0, 0);

        const [org, links, clicks] = await Promise.all([
            prisma.organization.findUnique({
                where: { id: organizationId },
                select: { company_url: true, backlinks: true, brochure_url: true },
            }),
            prisma.organizationLink.findMany({
                where: { organization_id: organizationId },
                orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
            }),
            prisma.linkPageDaily.groupBy({
                by: ['link_key', 'source_code'],
                where: { organization_id: organizationId, event: 'click', date: { gte: since } },
                _sum: { count: true },
                _max: { label: true, link_kind: true },
            }),
        ]);
        if (!org) return { success: false as const, error: '조직을 찾을 수 없습니다.' };

        const summaryMap = new Map<string, AdminLinkClickSummary>();
        for (const c of clicks) {
            const count = c._sum.count ?? 0;
            const item = summaryMap.get(c.link_key) ?? {
                key: c.link_key,
                label: c._max.label ?? c.link_key,
                kind: c._max.link_kind ?? '',
                total: 0,
                viaGo: 0,
            };
            item.total += count;
            if (c.source_code !== 'direct') item.viaGo += count;
            summaryMap.set(c.link_key, item);
        }

        const isDefault = links.length === 0;
        const rows: AdminOrgLinkRow[] = isDefault
            ? deriveDefaultOrgLinks(org).map((l, i) => ({ ...l, id: null, clicks30d: summaryMap.get(`auto:${i}`)?.total ?? 0 }))
            : links.map((l) => ({
                  id: l.id,
                  label: l.label,
                  url: l.url,
                  kind: l.kind as OrgLinkInput['kind'],
                  display: l.display as OrgLinkInput['display'],
                  subtitle: l.subtitle,
                  thumbnail_url: l.thumbnail_url,
                  is_visible: l.is_visible,
                  clicks30d: summaryMap.get(`link:${l.id}`)?.total ?? 0,
              }));

        return {
            success: true as const,
            data: {
                isDefault,
                rows,
                clickSummary: Array.from(summaryMap.values()).sort((a, b) => b.total - a.total),
            },
        };
    } catch (error) {
        console.error('Failed to fetch organization links:', error);
        return { success: false as const, error: '링크 목록을 불러오지 못했습니다.' };
    }
}

// 링크 목록 전체 저장 (화면 순서대로 sort_order 부여). 기존 id는 유지해 클릭 집계 키(link:{id})가 이어지게 함
export async function saveOrganizationLinks(organizationId: number, input: Array<OrgLinkInput & { id?: number | null }>) {
    await requireAdmin();
    try {
        const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, slug: true } });
        if (!org) return { success: false as const, error: '조직을 찾을 수 없습니다.' };

        // 행마다 정리하고 기존 id를 짝지음 (주소·라벨이 없는 행은 제외)
        const rows = (Array.isArray(input) ? input.slice(0, ORG_LINK_MAX) : []).flatMap((raw) => {
            const [row] = normalizeOrgLinks([raw]);
            return row ? [{ ...row, id: typeof raw?.id === 'number' ? raw.id : null }] : [];
        });

        await prisma.$transaction(async (tx) => {
            const existing = await tx.organizationLink.findMany({ where: { organization_id: organizationId }, select: { id: true } });
            const existingIds = new Set(existing.map((e) => e.id));
            const keepIds = rows.map((r) => r.id).filter((id): id is number => id !== null && existingIds.has(id));
            await tx.organizationLink.deleteMany({ where: { organization_id: organizationId, id: { notIn: keepIds } } });

            for (const [index, row] of rows.entries()) {
                const data = {
                    label: row.label,
                    url: row.url,
                    kind: row.kind,
                    display: row.display,
                    subtitle: row.subtitle,
                    thumbnail_url: row.thumbnail_url,
                    is_visible: row.is_visible,
                    sort_order: index,
                };
                if (row.id !== null && existingIds.has(row.id)) {
                    await tx.organizationLink.update({ where: { id: row.id }, data });
                } else {
                    await tx.organizationLink.create({ data: { ...data, organization_id: organizationId } });
                }
            }
        });

        const slugOrId = org.slug || String(org.id);
        revalidatePath(`/insight-radar/${slugOrId}/links`);
        return { success: true as const, count: rows.length };
    } catch (error) {
        console.error('Failed to save organization links:', error);
        return { success: false as const, error: '링크 저장 중 오류가 발생했습니다.' };
    }
}
