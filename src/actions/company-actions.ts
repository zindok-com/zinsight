'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateCompany(
  id: number,
  industryId: number,
  data: {
    company_name: string;
    entity_type?: string;
    company_url?: string;
    business_summary?: string;
    recent_status?: string;
    core_keywords?: any;
    founded_year?: string;
    hq_location?: string;
    ceo_name?: string;
    key_references?: any;
    aliases?: any;
    recent_keywords?: any;
    is_featured?: boolean;
  }
) {
  try {
    const { recent_status, recent_keywords, is_featured, ...companyData } = data;

    const updatedCompany = await prisma.organization.update({
      where: { id },
      data: {
        ...companyData,
        is_featured,
        industries: {
          upsert: {
            where: {
              company_id_industry_id: {
                company_id: id,
                industry_id: industryId,
              },
            },
            create: {
              industry_id: industryId,
              recent_status,
              recent_keywords,
            },
            update: {
              recent_status,
              recent_keywords,
            },
          },
        },
      },
      include: {
        industries: {
          include: {
            industry: true,
          },
        },
        company_articles: {
          include: {
            article: true,
          },
        },
      },
    });

    revalidatePath('/admin/companies');
    return { success: true, company: updatedCompany };
  } catch (error: any) {
    console.error('Failed to update company:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleCompanyFeatured(id: number, is_featured: boolean) {
  try {
    const updatedCompany = await prisma.organization.update({
      where: { id },
      data: { is_featured },
    });
    revalidatePath('/admin/companies');
    revalidatePath('/insight-radar'); // public insight-radar page
    return { success: true, company: updatedCompany };
  } catch (error: any) {
    console.error('Failed to toggle featured status:', error);
    return { success: false, error: error.message };
  }
}

