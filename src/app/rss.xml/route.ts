import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const domain = "www.zinsight.co.kr";
  const baseUrl = `https://${domain}`;

  // 1. 최신 매거진 포스트 및 최신 등록/갱신 기업 프로필 병렬 조회
  const [posts, organizations] = await Promise.all([
    prisma.magazinePost.findMany({
      where: { 
        status: 'PUBLISHED',
        deletedAt: null
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: { 
        title: true, 
        slug: true, 
        summary: true, 
        createdAt: true,
        publishedAt: true,
        category: {
          select: { isLocal: true }
        },
        region: {
          select: { slug: true }
        }
      }
    }),
    prisma.organization.findMany({
      orderBy: { updated_at: 'desc' },
      take: 20,
      select: {
        id: true,
        company_name: true,
        slug: true,
        business_summary: true,
        updated_at: true,
        created_at: true,
        region: {
          select: { name: true }
        }
      }
    })
  ]);

  // 2. RSS 표준 XML 양식 조립 (기사 + 기업 프로필)
  const postItems = posts.map((post) => {
    const pubDate = new Date(post.publishedAt || post.createdAt).toUTCString();
    const path = post.category?.isLocal && post.region
      ? `/magazine/local/${post.region.slug}/${post.slug}`
      : `/magazine/tech-marketing/${post.slug}`;
    const itemUrl = `${baseUrl}${path}`;
    return {
      date: new Date(post.publishedAt || post.createdAt),
      xml: `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${itemUrl}</link>
        <description><![CDATA[${post.summary || ''}]]></description>
        <pubDate>${pubDate}</pubDate>
        <guid>${itemUrl}</guid>
      </item>
    `
    };
  });

  const orgItems = organizations.map((org) => {
    const pubDate = new Date(org.updated_at || org.created_at).toUTCString();
    const itemUrl = `${baseUrl}/insight-radar/${org.slug || org.id}`;
    const desc = org.business_summary || `${org.region?.name || ''} 관내 기업 ${org.company_name} 비즈니스 분석 프로필`;
    return {
      date: new Date(org.updated_at || org.created_at),
      xml: `
      <item>
        <title><![CDATA[[기업 프로필] ${org.company_name} - ${org.region?.name ? `${org.region.name} ` : ''}기업 분석 정보]]></title>
        <link>${itemUrl}</link>
        <description><![CDATA[${desc}]]></description>
        <pubDate>${pubDate}</pubDate>
        <guid>${itemUrl}</guid>
      </item>
    `
    };
  });

  const rssItems = [...postItems, ...orgItems]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((item) => item.xml)
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>진사이트 - 매거진 &amp; 인사이트 레이더</title>
        <link>${baseUrl}</link>
        <description>진사이트 AEO·SEO·GEO 통합 마케팅 인텔리전스 및 관내 기업 분석 피드</description>
        <language>ko</language>
        <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
        ${rssItems}
      </channel>
    </rss>
  `;

  // 3. Content-Type을 application/xml로 설정하여 반환
  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59', // 1시간 캐싱
    },
  });
}
