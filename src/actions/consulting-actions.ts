'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitConsultingRequest(data: {
    email: string;
    companyName: string;
    industry?: string;
}) {
    try {
        // 1. 데이터 수집 (Lead Generation)
        const request = await prisma.consultingRequest.create({
            data: {
                email: data.email,
                company_name: data.companyName,
                industry: data.industry,
                status: 'PENDING'
            }
        });

        return { 
            success: true, 
            requestId: request.id
        };
    } catch (error: any) {
        console.error('Failed to submit consulting request:', error);
        return { success: false, error: error.message };
    }
}

export async function getConsultingRequests() {
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
