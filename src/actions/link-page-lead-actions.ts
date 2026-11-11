'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { rateLimitByIp, HOUR } from '@/lib/rate-limit';
import { deviceFromUserAgent, isBotUserAgent } from '@/lib/bot-ua';
import { QR_CODE_PATTERN } from '@/lib/qr-link';
import { LEAD_RETENTION_DAYS, normalizeLeadInput, validateLeadInput, type LeadField } from '@/lib/link-page-lead';

export type SubmitLeadResult = { ok: true } | { ok: false; error: string; fieldErrors?: Partial<Record<LeadField, string>> };

function retentionCutoff() {
    return new Date(Date.now() - LEAD_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * 링크 페이지 방문자가 남긴 연락처·메모 접수 (공개)
 * - 숨김 필드(website)가 채워진 요청은 봇으로 보고 저장하지 않되 성공처럼 응답
 * - IP당 1시간 5회
 */
export async function submitLinkPageLead(payload: {
    slug: string;
    src?: string;
    name?: string;
    phone?: string;
    email?: string;
    memo?: string;
    consent?: boolean;
    website?: string;
}): Promise<SubmitLeadResult> {
    const slug = typeof payload?.slug === 'string' ? payload.slug.slice(0, 255) : '';
    if (!slug) return { ok: false, error: '잘못된 요청입니다.' };

    const h = await headers();
    const ua = h.get('user-agent') ?? '';
    if (payload?.website || isBotUserAgent(ua)) return { ok: true };

    const input = normalizeLeadInput(payload ?? {});
    const fieldErrors = validateLeadInput(input);
    if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, error: '입력 내용을 확인해 주세요.', fieldErrors };
    }

    if (!(await rateLimitByIp('link-lead', 5, HOUR))) {
        return { ok: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' };
    }

    try {
        const org = await prisma.organization.findFirst({
            where: { OR: [{ slug }, ...(/^\d+$/.test(slug) ? [{ id: Number(slug) }] : [])] },
            select: { id: true },
        });
        if (!org) return { ok: false, error: '잘못된 요청입니다.' };

        // 해당 조직에 발급된 /go 코드만 유입 경로로 인정 (통계 수집과 같은 규칙)
        const src = typeof payload?.src === 'string' ? payload.src.trim().toLowerCase() : '';
        let sourceCode = 'direct';
        if (src && QR_CODE_PATTERN.test(src)) {
            const qr = await prisma.qrLink.findFirst({ where: { code: src, organization_id: org.id }, select: { id: true } });
            if (qr) sourceCode = src;
        }

        await prisma.linkPageLead.create({
            data: {
                organization_id: org.id,
                name: input.name,
                phone: input.phone || null,
                email: input.email || null,
                memo: input.memo || null,
                source_code: sourceCode,
                device: deviceFromUserAgent(ua),
            },
        });

        // 보관 기간 지난 접수 정리 (별도 크론 없이 접수 20건 중 1건꼴로, 관리자 목록 조회 때도 정리)
        if (Math.random() < 0.05) {
            await prisma.linkPageLead.deleteMany({ where: { created_at: { lt: retentionCutoff() } } });
        }
        return { ok: true };
    } catch (error) {
        console.error('연락처 접수 실패:', error);
        return { ok: false, error: '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
    }
}

export interface LinkPageLeadRow {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    memo: string | null;
    sourceCode: string;
    sourceLabel: string | null;
    device: string;
    readAt: string | null;
    createdAt: string;
}

/** 조직별 받은 연락처 목록 (최신순). 보관 기간이 지난 접수는 이때 함께 삭제 */
export async function getLinkPageLeads(organizationId: number) {
    await requireAdmin();
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, company_name: true, slug: true },
    });
    if (!org) return null;

    await prisma.linkPageLead.deleteMany({ where: { created_at: { lt: retentionCutoff() } } });
    const [leads, codes] = await Promise.all([
        prisma.linkPageLead.findMany({ where: { organization_id: org.id }, orderBy: { created_at: 'desc' } }),
        prisma.qrLink.findMany({ where: { organization_id: org.id }, select: { code: true, label: true } }),
    ]);
    const codeLabel = new Map(codes.map((c) => [c.code, c.label]));

    return {
        org: { id: org.id, name: org.company_name, slug: org.slug || String(org.id) },
        leads: leads.map(
            (l): LinkPageLeadRow => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                email: l.email,
                memo: l.memo,
                sourceCode: l.source_code,
                sourceLabel: codeLabel.get(l.source_code) ?? null,
                device: l.device,
                readAt: l.read_at?.toISOString() ?? null,
                createdAt: l.created_at.toISOString(),
            })
        ),
    };
}

/** 관리자 탭 배지용 새 접수 수 */
export async function countUnreadLinkPageLeads(organizationId: number): Promise<number> {
    await requireAdmin();
    if (!Number.isInteger(organizationId)) return 0;
    return prisma.linkPageLead.count({ where: { organization_id: organizationId, read_at: null } });
}

/** 확인 표시 (ids가 없으면 해당 조직의 새 접수 전체) */
export async function markLinkPageLeadsRead(organizationId: number, ids?: number[]) {
    await requireAdmin();
    await prisma.linkPageLead.updateMany({
        where: { organization_id: organizationId, read_at: null, ...(ids ? { id: { in: ids } } : {}) },
        data: { read_at: new Date() },
    });
    revalidatePath(`/admin/companies/${organizationId}/leads`);
}

/** 접수 삭제 (정보주체 삭제 요청 대응 등) */
export async function deleteLinkPageLead(organizationId: number, id: number) {
    await requireAdmin();
    await prisma.linkPageLead.deleteMany({ where: { id, organization_id: organizationId } });
    revalidatePath(`/admin/companies/${organizationId}/leads`);
}
