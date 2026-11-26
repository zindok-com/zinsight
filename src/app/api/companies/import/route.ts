import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { slugifyOrganization } from '@/lib/utils';
import { isAdminRequest } from '@/lib/admin-auth';
import { channelsFromLegacy } from '@/lib/org-channels';
import { saveOrgChannels } from '@/lib/org-channel-store';

export async function POST(request: Request) {
  // proxy 보호에 더한 이중 확인 (경로 매처 변경 시에도 무인증 DB 쓰기 방지)
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await request.json();
    const region_id = data.region_id;
    const leads = data.leads;

    if (!region_id || !leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid data format: region_id and leads array are required' }, { status: 400 });
    }

    const allLeads = leads.map(lead => ({
      ...lead,
      region_id: lead.region_id || region_id
    }));

    const results = {
      addedCompanies: 0,
      updatedCompanies: 0,
    };

    for (const lead of allLeads) {
      const region_id = lead.region_id;
      
      if (!region_id) {
        console.warn(`Skipping lead ${lead.company_name}: No region_id provided.`);
        continue;
      }

      const company_name = lead.company_name;

      // 기업 조회 (중복 확인)
      // 1. 정확한 조직명으로 검색
      let company = await prisma.organization.findUnique({
        where: {
          company_name,
        },
      });

      // 2. 정확한 매칭이 없을 경우, 임포트 데이터의 별칭(aliases) 중 하나가 DB의 조직명과 일치하는지 확인
      if (!company && lead.aliases && Array.isArray(lead.aliases) && lead.aliases.length > 0) {
        company = await prisma.organization.findFirst({
          where: {
            company_name: {
              in: lead.aliases
            }
          }
        });
        
        if (company) {
          console.log(`Matched existing company "${company.company_name}" via import alias.`);
        }
      }

      if (!company) {
        // 신규 기업 추가
        const slugValue = lead.slug ? slugifyOrganization(lead.slug) : slugifyOrganization(company_name);
        company = await prisma.organization.create({
          data: {
            company_name: lead.company_name,
            slug: slugValue || null,
            aliases: lead.aliases || null,
            company_url: lead.company_url || null,
            entity_type: lead.entity_type || '기업',
            business_summary: lead.business_summary || null,
            core_keywords: lead.core_keywords || null,
            founded_year: lead.founded_year || null,
            hq_location: lead.hq_location || null,
            ceo_name: lead.ceo_name || null,
            key_references: lead.key_references || null,
            backlinks: lead.backlinks || null,
            region_id: region_id,
          },
        });
        // 홈페이지·외부 링크를 공식 채널로 (종류는 주소로 판별)
        const created = company;
        const { channels } = channelsFromLegacy(created);
        if (channels.length > 0) await prisma.$transaction((tx) => saveOrgChannels(tx, created.id, channels));
        results.addedCompanies++;
      } else {
        // 기존 기업 정보 업데이트 (공식 채널이 있는 조직은 링크를 덮어쓰지 않음: 채널이 원본)
        const hasChannels = (await prisma.organizationChannel.count({ where: { organization_id: company.id, deleted_at: null } })) > 0;
        company = await prisma.organization.update({
          where: { id: company.id },
          data: {
            founded_year: lead.founded_year || company.founded_year,
            hq_location: lead.hq_location || company.hq_location,
            ceo_name: lead.ceo_name || company.ceo_name,
            key_references: lead.key_references || company.key_references,
            ...(hasChannels ? {} : { backlinks: lead.backlinks || company.backlinks }),
            region_id: region_id,
          }
        });
        results.updatedCompanies++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Import ERROR:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
