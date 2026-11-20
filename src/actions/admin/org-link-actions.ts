'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { ORG_LINK_DISPLAYS, type OrgLinkDisplay } from '@/lib/org-links';
import { CHANNEL_TYPES, resolveOrgChannels, type ChannelType } from '@/lib/org-channels';
import { ACTIVE_CHANNELS } from '@/lib/org-channel-store';
import { safeHttpUrl } from '@/lib/utils';

const CLICK_DAYS = 30;

/** 진사이트 카드 관리 행: 공식 채널 하나 + 카드 표시 설정 */
export interface AdminCardRow {
    channelId: number | null;
    type: ChannelType;
    text: string;
    url: string;
    display: OrgLinkDisplay;
    subtitle: string | null;
    thumbnail_url: string | null;
    is_visible: boolean;
    /** 카드 설정이 저장돼 있는지 (없으면 종류 기본 형태로 맨 뒤에 노출 중) */
    hasSetting: boolean;
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

export interface AdminCardItemInput {
    channelId: number;
    display: OrgLinkDisplay;
    subtitle: string | null;
    thumbnail_url: string | null;
    is_visible: boolean;
}

// 카드 링크 목록(공식 채널 + 카드 설정) + 최근 30일 클릭 집계.
// 공식 채널을 아직 저장하지 않은 조직(이전 전)은 mode 'legacy'로 이전 전 값의 목록을 읽기 전용으로 돌려줌
export async function getOrganizationLinks(organizationId: number) {
    await requireAdmin();
    try {
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - CLICK_DAYS);
        since.setUTCHours(0, 0, 0, 0);

        const [org, clicks] = await Promise.all([
            prisma.organization.findUnique({
                where: { id: organizationId },
                select: {
                    company_url: true,
                    backlinks: true,
                    brochure_url: true,
                    extra_materials: true,
                    channels: ACTIVE_CHANNELS,
                    cardItems: { select: { channel_id: true, display: true, subtitle: true, thumbnail_url: true, sort_order: true, is_visible: true } },
                },
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
            const item = summaryMap.get(c.link_key) ?? { key: c.link_key, label: c._max.label ?? c.link_key, kind: c._max.link_kind ?? '', total: 0, viaGo: 0 };
            item.total += count;
            if (c.source_code !== 'direct') item.viaGo += count;
            summaryMap.set(c.link_key, item);
        }

        const mode = org.channels.length > 0 ? ('channels' as const) : ('legacy' as const);
        let rows: AdminCardRow[];
        if (mode === 'channels') {
            // 화면과 같은 순서 (설정 순서 → 설정 없는 채널), 숨김 채널은 설정 순서 자리에 그대로
            const itemOf = new Map(org.cardItems.map((i) => [i.channel_id, i]));
            const channels = resolveOrgChannels(org.channels, {});
            const ordered = [
                ...channels.filter((c) => itemOf.has(c.id!)).sort((a, b) => itemOf.get(a.id!)!.sort_order - itemOf.get(b.id!)!.sort_order),
                ...channels.filter((c) => !itemOf.has(c.id!)),
            ];
            rows = ordered.map((c) => {
                const item = itemOf.get(c.id!);
                return {
                    channelId: c.id,
                    type: c.type,
                    text: c.text,
                    url: c.url,
                    display: item && (ORG_LINK_DISPLAYS as readonly string[]).includes(item.display) ? (item.display as OrgLinkDisplay) : CHANNEL_TYPES[c.type].defaultDisplay,
                    subtitle: item?.subtitle ?? null,
                    thumbnail_url: item?.thumbnail_url ?? null,
                    is_visible: item ? item.is_visible : true,
                    hasSetting: !!item,
                    clicks30d: summaryMap.get(`ch:${c.id}`)?.total ?? 0,
                };
            });
        } else {
            rows = resolveOrgChannels(null, org).map((c) => ({
                channelId: null,
                type: c.type,
                text: c.text,
                url: c.url,
                display: CHANNEL_TYPES[c.type].defaultDisplay,
                subtitle: null,
                thumbnail_url: null,
                is_visible: true,
                hasSetting: false,
                clicks30d: 0,
            }));
        }

        return {
            success: true as const,
            data: { mode, rows, clickSummary: Array.from(summaryMap.values()).sort((a, b) => b.total - a.total) },
        };
    } catch (error) {
        console.error('Failed to fetch organization links:', error);
        return { success: false as const, error: '링크 목록을 불러오지 못했습니다.' };
    }
}

// 카드 설정 저장 (화면 순서대로 sort_order). 링크 주소·문구는 공식 채널에서만 바뀜
export async function saveOrganizationCardItems(organizationId: number, input: AdminCardItemInput[]) {
    await requireAdmin();
    try {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, slug: true, channels: { where: { deleted_at: null }, select: { id: true } } },
        });
        if (!org) return { success: false as const, error: '조직을 찾을 수 없습니다.' };
        if (org.channels.length === 0) return { success: false as const, error: '먼저 프로필 편집의 공식 채널을 저장해 주세요.' };

        const allowed = new Set(org.channels.map((c) => c.id));
        const seen = new Set<number>();
        const items = (Array.isArray(input) ? input : []).filter((raw) => {
            if (typeof raw?.channelId !== 'number' || !allowed.has(raw.channelId) || seen.has(raw.channelId)) return false;
            seen.add(raw.channelId);
            return true;
        });

        await prisma.$transaction(async (tx) => {
            for (const [index, raw] of items.entries()) {
                const display = (ORG_LINK_DISPLAYS as readonly unknown[]).includes(raw.display) ? raw.display : 'button';
                const subtitle = String(raw.subtitle ?? '').trim().slice(0, 100) || null;
                const thumb = safeHttpUrl(String(raw.thumbnail_url ?? ''));
                const data = {
                    display,
                    subtitle,
                    thumbnail_url: thumb && thumb.length <= 512 ? thumb : null,
                    is_visible: raw.is_visible !== false,
                    sort_order: index,
                };
                await tx.organizationCardItem.upsert({
                    where: { channel_id: raw.channelId },
                    update: data,
                    create: { ...data, organization_id: organizationId, channel_id: raw.channelId },
                });
            }
        });

        revalidatePath(`/insight-radar/${org.slug || String(org.id)}/links`);
        return { success: true as const, count: items.length };
    } catch (error) {
        console.error('Failed to save organization card items:', error);
        return { success: false as const, error: '카드 설정 저장 중 오류가 발생했습니다.' };
    }
}
