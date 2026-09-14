import { NextResponse } from 'next/server';

export async function GET() {
  const domain = "www.zinsight.co.kr";
  const baseUrl = `https://${domain}`;

  // ?¤ìŒ ?¹ë§ˆ?¤í„°?„êµ¬ ?¸ì¦??ì£¼ì„??ìµœìƒ?¨ì— ë°°ì¹˜??robots.txt ì½˜í…ì¸??•ì˜
  const robotsTxt = `#DaumWebMasterTool:78c6bd7dbf36a16c27449f879b8a73f7059a4829426637f8aec5661c43a687d8:whLx8lcYCHguYaKJISJSUA==
User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /api

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600', // ?˜ë£¨ ?¨ìœ„ CDN ìºì‹±
    },
  });
}

