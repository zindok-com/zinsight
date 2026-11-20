import type { Prisma } from '@prisma/client';
import { legacyMirrorOf, type PreparedChannel } from '@/lib/org-channels';

// 공식 채널 저장 (서버 전용). prepareChannels로 검사한 목록을 받는다.

/** Organization select/include에 넣을 공식 채널 조건 (삭제된 채널 제외, 화면 순서) */
export const ACTIVE_CHANNELS = {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, channel_type: true, url: true, label: true, is_primary: true, sort_order: true },
};

/**
 * 화면 순서대로 저장. 기존 id는 유지(클릭 키 ch:{id}가 이어짐), 목록에서 빠진 채널은 소프트 삭제하고 카드 설정을 지운다.
 * 이전 전 컬럼(company_url·backlinks·brochure_url·extra_materials)에도 같은 값을 써서 기존 코드와 호환
 */
export async function saveOrgChannels(tx: Prisma.TransactionClient, organizationId: number, channels: PreparedChannel[]) {
    const existing = await tx.organizationChannel.findMany({
        where: { organization_id: organizationId, deleted_at: null },
        select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));
    const keepIds = new Set(channels.map((c) => c.id).filter((id): id is number => id !== null && existingIds.has(id)));
    const removeIds = [...existingIds].filter((id) => !keepIds.has(id));

    if (removeIds.length > 0) {
        await tx.organizationCardItem.deleteMany({ where: { channel_id: { in: removeIds } } });
        await tx.organizationChannel.updateMany({ where: { id: { in: removeIds } }, data: { deleted_at: new Date(), is_primary: false } });
    }

    for (const [index, c] of channels.entries()) {
        const data = { channel_type: c.type, url: c.url, label: c.label, is_primary: c.is_primary, sort_order: index };
        if (c.id !== null && keepIds.has(c.id)) {
            await tx.organizationChannel.update({ where: { id: c.id }, data });
        } else {
            await tx.organizationChannel.create({ data: { ...data, organization_id: organizationId } });
        }
    }

    const mirror = legacyMirrorOf(channels);
    await tx.organization.update({
        where: { id: organizationId },
        data: {
            company_url: mirror.company_url,
            backlinks: mirror.backlinks,
            brochure_url: mirror.brochure_url,
            extra_materials: mirror.extra_materials,
        },
    });
}
