'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getKeywords(regionId: number, includeDeleted = false) {
    return prisma.searchKeyword.findMany({
        where: {
            region_id: regionId,
            ...(includeDeleted ? {} : { deleted_at: null }),
        },
        orderBy: { created_at: 'asc' },
    });
}

export async function getActiveKeywordsForRegion(regionId: number) {
    return prisma.searchKeyword.findMany({
        where: { region_id: regionId, is_active: true, deleted_at: null },
        orderBy: { created_at: 'asc' },
    });
}

export async function createKeyword(data: {
    region_id: number;
    keyword_text: string;
    keyword_type?: string;
    is_active?: boolean;
}) {
    const keyword = await prisma.searchKeyword.create({
        data: {
            region_id: data.region_id,
            keyword_text: data.keyword_text,
            keyword_type: data.keyword_type,
            is_active: data.is_active ?? true,
        }
    });
    revalidatePath('/keywords');
    return keyword;
}

export async function updateKeyword(id: number, data: {
    keyword_text?: string;
    keyword_type?: string;
    is_active?: boolean;
}) {
    const keyword = await prisma.searchKeyword.update({
        where: { id },
        data,
    });
    revalidatePath('/keywords');
    return keyword;
}

export async function softDeleteKeyword(id: number) {
    await prisma.searchKeyword.update({
        where: { id },
        data: { deleted_at: new Date(), is_active: false }
    });
    revalidatePath('/keywords');
}

export async function restoreKeyword(id: number) {
    await prisma.searchKeyword.update({
        where: { id },
        data: { deleted_at: null, is_active: true }
    });
    revalidatePath('/keywords');
}

export async function toggleKeywordActive(id: number, is_active: boolean) {
    await prisma.searchKeyword.update({ where: { id }, data: { is_active } });
    revalidatePath('/keywords');
}
