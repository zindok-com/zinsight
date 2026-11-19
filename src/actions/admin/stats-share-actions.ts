'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { decryptShareToken, encryptShareToken, hashShareToken, newShareToken, shareStatsPath } from '@/lib/stats-share';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export interface ShareLinkInfo {
    id: number;
    /** 사이트 기준 경로 (/share/stats/...). 원문을 복호화하지 못하면 null → 재발급 필요 */
    path: string | null;
    defaultFrom: string | null;
    defaultTo: string | null;
    expiresAt: string | null;
    createdAt: string;
    lastViewedAt: string | null;
    viewCount: number;
}

export interface ShareLinkInput {
    defaultFrom?: string | null;
    defaultTo?: string | null;
    /** 만료일 (KST 일자, 그날 끝까지 열림) */
    expiresOn?: string | null;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const ymdOf = (d: Date) => d.toISOString().slice(0, 10);

function toInfo(link: {
    id: number;
    token_enc: string | null;
    default_from: Date | null;
    default_to: Date | null;
    expires_at: Date | null;
    created_at: Date;
    last_viewed_at: Date | null;
    view_count: number;
}): ShareLinkInfo {
    const token = decryptShareToken(link.token_enc);
    return {
        id: link.id,
        path: token ? shareStatsPath(token) : null,
        defaultFrom: link.default_from ? ymdOf(link.default_from) : null,
        defaultTo: link.default_to ? ymdOf(link.default_to) : null,
        expiresAt: link.expires_at ? link.expires_at.toISOString() : null,
        createdAt: link.created_at.toISOString(),
        lastViewedAt: link.last_viewed_at ? link.last_viewed_at.toISOString() : null,
        viewCount: link.view_count,
    };
}

/** 지금 열리는 공유 링크 (끊기지 않고 만료 전인 최신 1개) */
async function findActive(organizationId: number) {
    return prisma.statsShareLink.findFirst({
        where: {
            organization_id: organizationId,
            revoked_at: null,
            OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        orderBy: { created_at: 'desc' },
    });
}

export async function getShareLink(organizationId: number): Promise<ShareLinkInfo | null> {
    await requireAdmin();
    if (!Number.isInteger(organizationId)) return null;
    const link = await findActive(organizationId);
    return link ? toInfo(link) : null;
}

function parseInput(input: ShareLinkInput): Result<{ defaultFrom: Date | null; defaultTo: Date | null; expiresAt: Date | null }> {
    const from = input.defaultFrom?.trim() || '';
    const to = input.defaultTo?.trim() || '';
    const expires = input.expiresOn?.trim() || '';
    if ((from && !YMD.test(from)) || (to && !YMD.test(to)) || (expires && !YMD.test(expires))) {
        return { ok: false, error: '날짜 형식이 올바르지 않습니다.' };
    }
    if (!!from !== !!to) return { ok: false, error: '기본 기간은 시작일과 종료일을 모두 입력하거나 모두 비워 주세요.' };
    const [a, b] = from <= to ? [from, to] : [to, from];
    let expiresAt: Date | null = null;
    if (expires) {
        // 만료일 당일 끝(KST 24시)까지 열림
        expiresAt = new Date(new Date(`${expires}T00:00:00.000+09:00`).getTime() + 86_400_000);
        if (expiresAt.getTime() <= Date.now()) return { ok: false, error: '만료일은 오늘 이후로 지정해 주세요.' };
    }
    return {
        ok: true,
        data: {
            defaultFrom: from ? new Date(`${a}T00:00:00.000Z`) : null,
            defaultTo: to ? new Date(`${b}T00:00:00.000Z`) : null,
            expiresAt,
        },
    };
}

/** 새 공유 링크 발급. 이미 열리는 링크가 있으면 끊고 새로 만듦 (조직당 유효한 링크는 1개) */
export async function issueShareLink(organizationId: number, input: ShareLinkInput = {}): Promise<Result<ShareLinkInfo>> {
    await requireAdmin();
    if (!Number.isInteger(organizationId)) return { ok: false, error: '잘못된 요청입니다.' };
    const parsed = parseInput(input);
    if (!parsed.ok) return parsed;
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!org) return { ok: false, error: '조직을 찾을 수 없습니다.' };

    const token = newShareToken();
    const now = new Date();
    const [, created] = await prisma.$transaction([
        prisma.statsShareLink.updateMany({
            where: { organization_id: org.id, revoked_at: null },
            data: { revoked_at: now },
        }),
        prisma.statsShareLink.create({
            data: {
                organization_id: org.id,
                token_hash: hashShareToken(token),
                token_enc: encryptShareToken(token),
                default_from: parsed.data.defaultFrom,
                default_to: parsed.data.defaultTo,
                expires_at: parsed.data.expiresAt,
            },
        }),
    ]);
    return { ok: true, data: toInfo(created) };
}

/** 공유 링크의 기본 기간·만료일만 변경 (주소는 그대로) */
export async function updateShareLink(organizationId: number, input: ShareLinkInput): Promise<Result<ShareLinkInfo>> {
    await requireAdmin();
    const parsed = parseInput(input);
    if (!parsed.ok) return parsed;
    const link = Number.isInteger(organizationId) ? await findActive(organizationId) : null;
    if (!link) return { ok: false, error: '열려 있는 공유 링크가 없습니다.' };
    const updated = await prisma.statsShareLink.update({
        where: { id: link.id },
        data: {
            default_from: parsed.data.defaultFrom,
            default_to: parsed.data.defaultTo,
            expires_at: parsed.data.expiresAt,
        },
    });
    return { ok: true, data: toInfo(updated) };
}

/** 공유 링크 끊기: 이 조직의 모든 공유 링크가 즉시 열리지 않음 */
export async function revokeShareLink(organizationId: number): Promise<Result<null>> {
    await requireAdmin();
    if (!Number.isInteger(organizationId)) return { ok: false, error: '잘못된 요청입니다.' };
    await prisma.statsShareLink.updateMany({
        where: { organization_id: organizationId, revoked_at: null },
        data: { revoked_at: new Date() },
    });
    return { ok: true, data: null };
}
