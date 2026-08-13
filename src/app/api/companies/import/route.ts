import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
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
      addedArticles: 0,
    };

    for (const lead of allLeads) {
      const region_id = lead.region_id;
      
      if (!region_id) {
        console.warn(`Skipping lead ${lead.company_name}: No region_id provided.`);
        continue;
      }

      const company_name = lead.company_name;
      const articleIds = lead.related_articles?.map((a: any) => a.id) || [];

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
        company = await prisma.organization.create({
          data: {
            company_name: lead.company_name,
            aliases: lead.aliases || null,
            company_url: lead.company_url || null,
            entity_type: lead.entity_type || '기업',
            business_summary: lead.business_summary || null,
            core_keywords: lead.core_keywords || null,
            founded_year: lead.founded_year || null,
            hq_location: lead.hq_location || null,
            ceo_name: lead.ceo_name || null,
            key_references: lead.key_references || null,
            region_id: region_id,
          },
        });
        results.addedCompanies++;
      } else {
        // 기존 기업 정보 업데이트
        company = await prisma.organization.update({
          where: { id: company.id },
          data: {
            founded_year: lead.founded_year || company.founded_year,
            hq_location: lead.hq_location || company.hq_location,
            ceo_name: lead.ceo_name || company.ceo_name,
            key_references: lead.key_references || company.key_references,
            region_id: region_id,
          }
        });
        results.updatedCompanies++;
      }

      // 기사 연결 (기사 테이블에 이미 존재하는 기사 ID들)
      for (const articleId of articleIds) {
        const existingLink = await prisma.companyArticle.findUnique({
          where: {
            company_id_article_id: {
              company_id: company.id,
              article_id: articleId,
            },
          },
        });

        if (!existingLink) {
          try {
            await prisma.companyArticle.create({
              data: {
                company_id: company.id,
                article_id: articleId,
              },
            });
            results.addedArticles++;
          } catch (err) {
            console.warn(`기사 아이디 ${articleId} 매핑 실패: DB에 기사가 존재하지 않을 수 있습니다.`, err);
          }
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Import ERROR:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
