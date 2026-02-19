'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\-가-힣]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '') || `exhibition-${Date.now()}`;
}

export async function getExhibitions(includeDeleted = false) {
    return prisma.exhibition.findMany({
        where: includeDeleted ? {} : { deleted_at: null },
        include: {
            _count: { select: { keywords: { where: { deleted_at: null } }, ingestions: true } }
        },
        orderBy: { created_at: 'desc' },
    });
}

export async function getExhibitionBySlug(slug: string) {
    return prisma.exhibition.findFirst({
        where: { slug, deleted_at: null },
        include: {
            keywords: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } }
        }
    });
}

export async function getExhibitionById(id: number) {
    return prisma.exhibition.findUnique({
        where: { id },
        include: {
            keywords: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } }
        }
    });
}

export async function createExhibition(data: {
    name: string;
    description?: string;
    is_active?: boolean;
}) {
    const slug = slugify(data.name);
    // Ensure uniqueness
    const existing = await prisma.exhibition.findFirst({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const exhibition = await prisma.exhibition.create({
        data: {
            name: data.name,
            slug: finalSlug,
            description: data.description,
            is_active: data.is_active ?? true,
        }
    });
    revalidatePath('/exhibitions');
    return exhibition;
}

export async function updateExhibition(id: number, data: {
    name?: string;
    description?: string;
    is_active?: boolean;
}) {
    const exhibition = await prisma.exhibition.update({
        where: { id },
        data: {
            ...data,
            ...(data.name ? { slug: slugify(data.name) } : {}),
        }
    });
    revalidatePath('/exhibitions');
    return exhibition;
}

export async function softDeleteExhibition(id: number) {
    await prisma.exhibition.update({
        where: { id },
        data: { deleted_at: new Date(), is_active: false }
    });
    revalidatePath('/exhibitions');
}

export async function restoreExhibition(id: number) {
    await prisma.exhibition.update({
        where: { id },
        data: { deleted_at: null, is_active: true }
    });
    revalidatePath('/exhibitions');
}
