import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const domain = process.env.DOMAIN || 'zinsight.co.kr';
  const baseUrl = `https://${domain}`;

  // 1. 최신 매거진 포스트 20개만 긁어오기 (발행 상태이면서 소프트 삭제되지 않은 기사)
  const posts = await prisma.magazinePost.findMany({
    where: { 
      status: 'PUBLISHED',
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { 
      title: true, 
      slug: true, 
      summary: true, 
      createdAt: true 
    }
  });

  // 2. RSS 표준 XML 양식 조립
  const rssItems = posts
    .map((post) => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${baseUrl}/magazine/${post.slug}</link>
        <description><![CDATA[${post.summary || ''}]]></description>
        <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
        <guid>${baseUrl}/magazine/${post.slug}</guid>
      </item>
    `)
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
