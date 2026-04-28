'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateCompany(
  id: number,
  data: {
    company_name: string;
    entity_type?: string;
    company_url?: string;
    business_summary?: string;
    recent_status?: string;
    core_keywords?: any;
  }
) {
  try {
    const updatedCompany = await prisma.company.update({
      where: { id },
      data,
    });
    
    revalidatePath('/admin/companies');
    return { success: true, company: updatedCompany };
  } catch (error: any) {
    console.error('Failed to update company:', error);
    return { success: false, error: error.message };
  }
}
