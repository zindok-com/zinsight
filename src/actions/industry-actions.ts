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
        .replace(/^-+|-+$/g, '') || `industry-${Date.now()}`;
}

export async function getIndustries(includeDeleted = false) {
    return prisma.industry.findMany({
        where: includeDeleted ? {} : { deleted_at: null },
        include: {
            _count: { select: { keywords: { where: { deleted_at: null } }, ingestions: true } }
        },
        orderBy: { created_at: 'desc' },
    });
}

export async function getIndustryBySlug(slug: string) {
    return prisma.industry.findFirst({
        where: { slug, deleted_at: null },
        include: {
            keywords: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } }
        }
    });
}

export async function getIndustryById(id: number) {
    return prisma.industry.findUnique({
        where: { id },
        include: {
            keywords: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } }
        }
    });
}

export async function createIndustry(data: {
    name: string;
    description?: string;
    is_active?: boolean;
}) {
    const slug = slugify(data.name);
    // Ensure uniqueness
    const existing = await prisma.industry.findFirst({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const industry = await prisma.industry.create({
        data: {
            name: data.name,
            slug: finalSlug,
            description: data.description,
            is_active: data.is_active ?? true,
        }
    });
    revalidatePath('/industries');
    return industry;
}

export async function updateIndustry(id: number, data: {
    name?: string;
    description?: string;
    is_active?: boolean;
}) {
    const industry = await prisma.industry.update({
        where: { id },
        data: {
            ...data,
            ...(data.name ? { slug: slugify(data.name) } : {}),
        }
    });
    revalidatePath('/industries');
    return industry;
}

export async function softDeleteIndustry(id: number) {
    await prisma.industry.update({
        where: { id },
        data: { deleted_at: new Date(), is_active: false }
    });
    revalidatePath('/industries');
}

export async function restoreIndustry(id: number) {
    await prisma.industry.update({
        where: { id },
        data: { deleted_at: null, is_active: true }
    });
    revalidatePath('/industries');
}
