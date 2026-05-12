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
  }
) {
  try {
    const { recent_status, recent_keywords, ...companyData } = data;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        ...companyData,
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
