'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// 리다이렉트 전체 목록 조회
export async function getRedirects() {
    try {
        const redirects = await prisma.redirect.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: redirects };
    } catch (error: any) {
        console.error('Failed to fetch redirects:', error);
        return { success: false, error: error.message || '리다이렉트 목록을 불러오지 못했습니다.' };
    }
}

// 리다이렉트 규칙 추가
export async function createRedirect(sourcePath: string, targetPath: string, permanent: boolean = true) {
    try {
        // 간단한 입력 검증 및 정규화
        const cleanSource = sourcePath.trim().toLowerCase();
        const cleanTarget = targetPath.trim();

        if (!cleanSource.startsWith('/')) {
            return { success: false, error: '이전 경로는 반드시 "/"로 시작해야 합니다. (예: /magazine/old-post)' };
        }
        if (!cleanTarget.startsWith('/') && !cleanTarget.startsWith('http')) {
            return { success: false, error: '이동할 경로는 "/"로 시작하거나 올바른 URL이어야 합니다.' };
        }
        if (cleanSource === cleanTarget) {
            return { success: false, error: '이전 경로와 이동할 경로가 동일할 수 없습니다.' };
        }

        // 중복 체크
        const existing = await prisma.redirect.findUnique({
            where: { sourcePath: cleanSource }
        });

        if (existing) {
            return { success: false, error: `이미 등록된 이전 경로입니다. (기존 대상: ${existing.targetPath})` };
        }

        const newRedirect = await prisma.redirect.create({
            data: {
                sourcePath: cleanSource,
                targetPath: cleanTarget,
                permanent
            }
        });

        // 관련 페이지 캐시 무효화
        revalidatePath('/magazine');
        revalidatePath('/admin/settings/redirects');

        return { success: true, data: newRedirect };
    } catch (error: any) {
        console.error('Failed to create redirect:', error);
        return { success: false, error: error.message || '리다이렉트 등록에 실패했습니다.' };
    }
}

// 리다이렉트 규칙 삭제
export async function deleteRedirect(id: number) {
    try {
        await prisma.redirect.delete({
            where: { id }
        });

        revalidatePath('/magazine');
        revalidatePath('/admin/settings/redirects');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete redirect:', error);
        return { success: false, error: error.message || '리다이렉트 삭제에 실패했습니다.' };
    }
}
