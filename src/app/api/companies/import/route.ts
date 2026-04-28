import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const top_industry_id = data.industry_id;
    
    let allLeads: any[] = [];

    // 1. 그룹형 구조 처리 (여러 산업군 통합)
    if (data.industries && Array.isArray(data.industries)) {
      for (const ind of data.industries) {
        if (ind.leads && Array.isArray(ind.leads)) {
          for (const lead of ind.leads) {
            // 개별 lead에 industry_id가 없으면 상위 그룹의 industry_id 사용
            lead.industry_id = lead.industry_id || ind.industry_id;
            allLeads.push(lead);
          }
        }
      }
    }

    // 2. 평면형 구조 처리 (기존 단일 배열 형태)
    if (data.leads && Array.isArray(data.leads)) {
      for (const lead of data.leads) {
        lead.industry_id = lead.industry_id || top_industry_id;
        allLeads.push(lead);
      }
    }

    if (allLeads.length === 0) {
      return NextResponse.json({ error: 'Invalid data format: leads array or industries array is required' }, { status: 400 });
    }

    const results = {
      addedCompanies: 0,
      updatedCompanies: 0,
      addedArticles: 0,
    };

    for (const lead of allLeads) {
      const industry_id = lead.industry_id;
      
      if (!industry_id) {
        console.warn(`Skipping lead ${lead.company_name}: No industry_id provided.`);
        continue;
      }

      const company_name = lead.company_name;
      const articleIds = lead.related_articles?.map((a: any) => a.id) || [];

      // 기업 조회 (중복 확인)
      let company = await prisma.company.findUnique({
        where: {
          industry_id_company_name: {
            industry_id,
            company_name,
          },
        },
      });

      if (!company) {
        // 신규 기업 추가
        company = await prisma.company.create({
          data: {
            industry_id,
            company_name: lead.company_name,
            company_url: lead.company_url || null,
            entity_type: lead.entity_type || '기업',
            business_summary: lead.business_summary || null,
            core_keywords: lead.core_keywords || null,
            recent_status: lead.recent_status || null,
          },
        });
        results.addedCompanies++;
      } else {
        // 기존 기업 최신 상태 업데이트
        company = await prisma.company.update({
          where: { id: company.id },
          data: {
            recent_status: lead.recent_status || company.recent_status,
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
