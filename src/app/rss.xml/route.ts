import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const domain = "www.zinsight.co.kr";
  const baseUrl = `https://${domain}`;

  // 1. 최신 매거진 포스트 20개만 긁어오기 (발행 상태이면서 소프트 삭제되지 않은 기사, 발행일 기준)
  const posts = await prisma.magazinePost.findMany({
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
  });

  // 2. RSS 표준 XML 양식 조립
  const rssItems = posts
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post.createdAt).toUTCString();
      const path = post.category?.isLocal && post.region
        ? `/magazine/local/${post.region.slug}/${post.slug}`
        : `/magazine/tech-marketing/${post.slug}`;
      const itemUrl = `${baseUrl}${path}`;
      return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${itemUrl}</link>
        <description><![CDATA[${post.summary || ''}]]></description>
        <pubDate>${pubDate}</pubDate>
        <guid>${itemUrl}</guid>
      </item>
    `;
    })
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Zinsight 매거진</title>
        <link>${baseUrl}</link>
        <description>B2B 세일즈 인텔리전스 및 산업 동향 뉴스레터</description>
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
