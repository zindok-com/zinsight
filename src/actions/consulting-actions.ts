'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitConsultingRequest(data: {
    email: string;
    companyName: string;
    industry?: string;
}) {
    // 공개 엔드포인트이므로 형식·길이 검증 후 저장
    const email = String(data?.email ?? '').trim();
    const companyName = String(data?.companyName ?? '').trim();
    const industry = data?.industry ? String(data.industry).trim().slice(0, 100) : undefined;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !companyName || companyName.length > 200) {
        return { success: false, error: '입력값이 올바르지 않습니다.' };
    }
    try {
        // 1. 데이터 수집 (Lead Generation)
        const request = await prisma.consultingRequest.create({
            data: {
                email,
                company_name: companyName,
                industry,
                status: 'PENDING'
            }
        });

        return { 
            success: true, 
            requestId: request.id
        };
    } catch (error: any) {
        console.error('Failed to submit consulting request:', error);
        return { success: false, error: '요청을 저장하지 못했습니다.' };
    }
}

export async function getConsultingRequests() {
    await requireAdmin();
    try {
        return await prisma.consultingRequest.findMany({
            orderBy: {
                created_at: 'desc'
            }
        });
    } catch (error) {
        console.error('Failed to fetch consulting requests:', error);
        return [];
    }
}
