'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { QR_CODE_PATTERN, isQrMode } from '@/lib/qr-link';

const SCAN_DAYS = 30;

// QR 연결 목록 + 최근 30일 스캔 집계 조회
export async function getQrLinks() {
    await requireAdmin();
    try {
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - SCAN_DAYS);
        since.setUTCHours(0, 0, 0, 0);

        const [links, organizations] = await Promise.all([
            prisma.qrLink.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    organization: { select: { id: true, company_name: true, slug: true, video_url: true } },
                    scans: { where: { date: { gte: since } }, orderBy: { date: 'desc' } },
                },
            }),
            prisma.organization.findMany({
                select: { id: true, company_name: true, slug: true },
                orderBy: { company_name: 'asc' },
            }),
        ]);

        // 전체 누적 건수는 기간 제한 없이 별도 합산
        const totals = await prisma.qrScanDaily.groupBy({
            by: ['qr_link_id'],
            _sum: { count: true },
        });
        const totalMap = new Map(totals.map((t) => [t.qr_link_id, t._sum.count ?? 0]));

        return {
            success: true as const,
            data: {
                links: links.map((link) => ({
                    id: link.id,
                    code: link.code,
                    mode: link.mode,
                    is_active: link.is_active,
                    updated_at: link.updated_at.toISOString(),
                    organization: link.organization,
                    totalScans: totalMap.get(link.id) ?? 0,
                    scans: link.scans.map((s) => ({
                        date: s.date.toISOString().slice(0, 10),
                        device: s.device,
                        count: s.count,
                    })),
                })),
                organizations,
            },
        };
    } catch (error: any) {
        console.error('Failed to fetch QR links:', error);
        return { success: false as const, error: error.message || 'QR 연결 목록을 불러오지 못했습니다.' };
    }
}

export async function createQrLink(code: string, organizationId: number, mode: string) {
    await requireAdmin();
    const cleanCode = String(code || '').trim().toLowerCase();
    if (!QR_CODE_PATTERN.test(cleanCode)) {
        return { success: false, error: '코드는 영문 소문자·숫자·하이픈 3~50자로 입력하세요. (예: zindok)' };
    }
    if (!isQrMode(mode)) return { success: false, error: '알 수 없는 연결 모드입니다.' };
    try {
        const org = await prisma.organization.findUnique({ where: { id: Number(organizationId) }, select: { id: true } });
        if (!org) return { success: false, error: '연결할 조직을 찾을 수 없습니다.' };

        const existing = await prisma.qrLink.findUnique({ where: { code: cleanCode } });
        if (existing) return { success: false, error: '이미 등록된 코드입니다.' };

        await prisma.qrLink.create({ data: { code: cleanCode, organization_id: org.id, mode } });
        revalidatePath('/admin/settings/qr-links');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create QR link:', error);
        return { success: false, error: error.message || 'QR 연결 등록에 실패했습니다.' };
    }
}

// 인쇄된 code는 바꿀 수 없으므로 수정 대상은 모드·조직·활성 여부만
export async function updateQrLink(
    id: number,
    patch: { mode?: string; organizationId?: number; isActive?: boolean }
) {
    await requireAdmin();
    if (patch.mode !== undefined && !isQrMode(patch.mode)) {
        return { success: false, error: '알 수 없는 연결 모드입니다.' };
    }
    try {
        await prisma.qrLink.update({
            where: { id: Number(id) },
            data: {
                ...(patch.mode !== undefined ? { mode: patch.mode } : {}),
                ...(patch.organizationId !== undefined ? { organization_id: Number(patch.organizationId) } : {}),
                ...(patch.isActive !== undefined ? { is_active: Boolean(patch.isActive) } : {}),
            },
        });
        revalidatePath('/admin/settings/qr-links');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update QR link:', error);
        return { success: false, error: error.message || 'QR 연결 수정에 실패했습니다.' };
    }
}

export async function deleteQrLink(id: number) {
    await requireAdmin();
    try {
        await prisma.qrLink.delete({ where: { id: Number(id) } });
        revalidatePath('/admin/settings/qr-links');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete QR link:', error);
        return { success: false, error: error.message || 'QR 연결 삭제에 실패했습니다.' };
    }
}
