'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export function slugifyOrganization(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function updateCompany(
  id: number,
  regionId: number,
  data: {
    company_name: string;
    slug?: string;
    entity_type?: string;
    company_url?: string;
    business_summary?: string;
    core_keywords?: any;
    founded_year?: string;
    hq_location?: string;
    ceo_name?: string;
    key_references?: any;
    aliases?: any;
    is_featured?: boolean;
  }
) {
  try {
    const { is_featured, slug, ...companyData } = data;

    const formattedSlug = slug && slug.trim() !== ''
      ? slugifyOrganization(slug)
      : null;

    const updatedCompany = await prisma.organization.update({
      where: { id },
      data: {
        ...companyData,
        slug: formattedSlug,
        is_featured,
        region_id: regionId,
      },
      include: {
        region: true,
        company_articles: {
          include: {
            article: true,
          },
        },
      },
    });

    revalidatePath('/admin/companies');
    revalidatePath('/insight-radar');
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

export async function searchOrganizations(query: string) {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        company_name: {
          contains: query
        }
      },
      select: {
        id: true,
        company_name: true
      },
      take: 15
    });
    return orgs;
  } catch (error) {
    console.error('Failed to search organizations:', error);
    return [];
  }
}

export async function createOrganizationInline(data: {
  company_name: string;
  slug?: string;
  ceo_name?: string;
  founded_year?: string;
  hq_location?: string;
  entity_type?: string;
  region_id: number;
}) {
  try {
    const slugValue = data.slug && data.slug.trim() !== ''
      ? slugifyOrganization(data.slug)
      : slugifyOrganization(data.company_name);

    const newOrg = await prisma.organization.create({
      data: {
        company_name: data.company_name,
        slug: slugValue || null,
        ceo_name: data.ceo_name || null,
        founded_year: data.founded_year || null,
        hq_location: data.hq_location || null,
        entity_type: data.entity_type || '기업',
        region_id: data.region_id,
      }
    });
    revalidatePath('/admin/companies');
    revalidatePath('/insight-radar');
    return { success: true, organization: newOrg };
  } catch (error: any) {
    console.error('Failed to create inline organization:', error);
    return { success: false, error: error.message };
  }
}

