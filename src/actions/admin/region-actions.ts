'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// 지자체 지역 목록 조회 (테이블이 없을 시 빈 배열 반환)
export async function getRegionsAdmin() {
    try {
        const regions = await prisma.region.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: regions };
    } catch (e: any) {
        console.error('Failed to get regions:', e);
        return { success: true, data: [], error: '지자체 테이블이 존재하지 않거나 데이터를 가져오지 못했습니다.' };
    }
}

// 신규 지자체 등록
export async function createRegionAdmin(name: string, slug: string) {
    try {
        const cleanName = name.trim();
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

        if (!cleanName || !cleanSlug) {
            return { success: false, error: '이름과 슬러그를 올바르게 입력해 주세요.' };
        }

        const existingSlug = await prisma.region.findUnique({ where: { slug: cleanSlug } });
        if (existingSlug) {
            return { success: false, error: '이미 존재하는 영문 슬러그입니다.' };
        }

        const existingName = await prisma.region.findUnique({ where: { name: cleanName } });
        if (existingName) {
            return { success: false, error: '이미 존재하는 지자체명입니다.' };
        }

        const region = await prisma.region.create({
            data: { name: cleanName, slug: cleanSlug, isActive: true }
        });

        revalidatePath('/magazine');
        revalidatePath('/admin/magazine/regions');
        return { success: true, data: region };
    } catch (e: any) {
        console.error('Failed to create region:', e);
        return { success: false, error: '지자체 등록에 실패했습니다. DB 연결을 확인해 주세요.' };
    }
}

// 지자체 정보 수정
export async function updateRegionAdmin(id: number, name: string, slug: string, isActive: boolean) {
    try {
        const cleanName = name.trim();
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

        if (!cleanName || !cleanSlug) {
            return { success: false, error: '이름과 슬러그를 올바르게 입력해 주세요.' };
        }

        // 본인 제외 중복검사
        const existingSlug = await prisma.region.findFirst({
            where: { slug: cleanSlug, NOT: { id } }
        });
        if (existingSlug) {
            return { success: false, error: '이미 다른 지자체에서 사용 중인 영문 슬러그입니다.' };
        }

        const existingName = await prisma.region.findFirst({
            where: { name: cleanName, NOT: { id } }
        });
        if (existingName) {
            return { success: false, error: '이미 다른 지자체에서 사용 중인 이름입니다.' };
        }

        const region = await prisma.region.update({
            where: { id },
            data: { name: cleanName, slug: cleanSlug, isActive }
        });

        revalidatePath('/magazine');
        revalidatePath('/admin/magazine/regions');
        return { success: true, data: region };
    } catch (e: any) {
        console.error('Failed to update region:', e);
        return { success: false, error: '지자체 수정에 실패했습니다.' };
    }
}

// 지자체 삭제 (연결된 기사들은 Prisma 설정에 따라 regionId = null로 보호됨)
export async function deleteRegionAdmin(id: number) {
    try {
        await prisma.region.delete({
            where: { id }
        });

        revalidatePath('/magazine');
        revalidatePath('/admin/magazine/regions');
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete region:', e);
        return { success: false, error: '지자체 삭제에 실패했습니다.' };
    }
}
