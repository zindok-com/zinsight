import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const domain = "www.zinsight.co.kr";
  const baseUrl = `https://${domain}`;

  // 1. ìµœì‹  ë§¤ê±°ì§??¬ìŠ¤??20ê°œë§Œ ê¸ì–´?¤ê¸° (ë°œí–‰ ?íƒœ?´ë©´???Œí”„???? œ?˜ì? ?Šì? ê¸°ì‚¬)
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

  // 2. RSS ?œì? XML ?‘ì‹ ì¡°ë¦½
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
        <title>Zinsight ë§¤ê±°ì§?/title>
        <link>${baseUrl}</link>
        <description>B2B ?¸ì¼ì¦??¸í…”ë¦¬ì „??ë°??°ì—… ?™í–¥ ?´ìŠ¤?ˆí„°</description>
        <language>ko</language>
        <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
        ${rssItems}
      </channel>
    </rss>
  `;

  // 3. Content-Type??application/xmlë¡??¤ì •?˜ì—¬ ë°˜í™˜
  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59', // 1?œê°„ ìºì‹±
    },
  });
}

