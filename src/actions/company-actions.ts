'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { slugifyOrganization } from '@/lib/utils';

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
    backlinks?: any;
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
    revalidatePath(`/admin/companies/${id}`);
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
  backlinks?: any;
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
        backlinks: data.backlinks || null,
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

export async function linkArticleToCompany(articleId: number, companyId: number) {
  try {
    const existing = await prisma.companyArticle.findFirst({
      where: {
        company_id: companyId,
        article_id: articleId,
      },
    });

    if (!existing) {
      await prisma.companyArticle.create({
        data: {
          company_id: companyId,
          article_id: articleId,
        },
      });
    }

    revalidatePath('/admin/articles');
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${companyId}`);
    revalidatePath('/insight-radar');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to link article to company:', error);
    return { success: false, error: error.message };
  }
}

export async function unlinkArticleFromCompany(articleId: number, companyId: number) {
  try {
    await prisma.companyArticle.deleteMany({
      where: {
        company_id: companyId,
        article_id: articleId,
      },
    });

    revalidatePath('/admin/articles');
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${companyId}`);
    revalidatePath('/insight-radar');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to unlink article from company:', error);
    return { success: false, error: error.message };
  }
}

// ─── 조직 등록 초대 링크 생성 ──────────────────────────────────────
export async function createOrganizationInvite(data: {
  region_id: number;
  label?: string;
}) {
  const { randomUUID } = await import('crypto');
  const token = randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후

  const invite = await prisma.organizationInvite.create({
    data: {
      token,
      region_id: data.region_id,
      label: data.label ?? null,
      expires_at: expiresAt,
    },
  });

  revalidatePath('/admin/companies');
  return { success: true, invite };
}

export async function getOrganizationInvites() {
  return prisma.organizationInvite.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      region: { select: { id: true, name: true } },
      submissions: { select: { id: true, status: true } },
    },
  });
}

// ─── 공개 폼: 초대 토큰 유효성 확인 ──────────────────────────────────
export async function getInviteByToken(token: string) {
  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { region: { select: { id: true, name: true } } },
  });
  if (!invite) return { valid: false as const, reason: 'NOT_FOUND' as const };
  if (invite.used_at) return { valid: false as const, reason: 'USED' as const };
  if (invite.expires_at < new Date()) return { valid: false as const, reason: 'EXPIRED' as const };
  return { valid: true as const, invite };
}

// ─── 공개 폼: 고객 신청서 제출 ────────────────────────────────────────
export async function submitOrganizationForm(
  token: string,
  formData: {
    company_name: string;
    entity_type: string;
    ceo_name?: string;
    founded_year?: string;
    hq_location?: string;
    company_url?: string;
    business_summary?: string;
    backlinks?: Array<{ title: string; url: string }>;
    core_keywords?: string[];
  }
) {
  const check = await getInviteByToken(token);
  if (!check.valid) {
    return { success: false, reason: check.reason };
  }

  await prisma.$transaction([
    prisma.organizationSubmission.create({
      data: {
        invite_id: check.invite.id,
        company_name: formData.company_name,
        entity_type: formData.entity_type,
        ceo_name: formData.ceo_name ?? null,
        founded_year: formData.founded_year ?? null,
        hq_location: formData.hq_location ?? null,
        company_url: formData.company_url ?? null,
        business_summary: formData.business_summary ?? null,
        backlinks: formData.backlinks ?? [],
        core_keywords: formData.core_keywords ?? [],
      },
    }),
    prisma.organizationInvite.update({
      where: { id: check.invite.id },
      data: { used_at: new Date() },
    }),
  ]);

  return { success: true };
}

// ─── 어드민: 신청 목록 조회 ───────────────────────────────────────────
export async function getOrganizationSubmissions(status?: string) {
  return prisma.organizationSubmission.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      invite: { include: { region: { select: { id: true, name: true } } } },
    },
  });
}

// ─── 어드민: 신청 승인 → 조직(companies) 등록 ──────────────────────
export async function approveOrganizationSubmission(submissionId: number) {
  const submission = await prisma.organizationSubmission.findUnique({
    where: { id: submissionId },
    include: { invite: { include: { region: true } } },
  });
  if (!submission) return { success: false, error: '신청서를 찾을 수 없습니다.' };
  if (submission.status !== 'PENDING') return { success: false, error: '이미 처리된 신청서입니다.' };

  const slugBase = submission.company_name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-가-힣]/g, '');

  await prisma.$transaction([
    prisma.organization.create({
      data: {
        company_name: submission.company_name,
        slug: slugBase,
        entity_type: submission.entity_type,
        ceo_name: submission.ceo_name,
        founded_year: submission.founded_year,
        hq_location: submission.hq_location,
        company_url: submission.company_url,
        business_summary: submission.business_summary,
        backlinks: submission.backlinks ?? [],
        core_keywords: submission.core_keywords ?? [],
        region_id: submission.invite.region_id,
      },
    }),
    prisma.organizationSubmission.update({
      where: { id: submissionId },
      data: { status: 'APPROVED', reviewed_at: new Date() },
    }),
  ]);

  revalidatePath('/admin/companies');
  revalidatePath('/admin/companies/submissions');
  revalidatePath('/insight-radar');
  return { success: true };
}

// ─── 어드민: 신청 반려 ───────────────────────────────────────────────
export async function rejectOrganizationSubmission(submissionId: number) {
  await prisma.organizationSubmission.update({
    where: { id: submissionId },
    data: { status: 'REJECTED', reviewed_at: new Date() },
  });
  revalidatePath('/admin/companies/submissions');
  return { success: true };
}

// ─── 어드민: 초대 링크 무효화 ─────────────────────────────────────────
export async function revokeOrganizationInvite(inviteId: number) {
  await prisma.organizationInvite.update({
    where: { id: inviteId },
    data: { used_at: new Date() },
  });
  revalidatePath('/admin/companies');
  return { success: true };
}
