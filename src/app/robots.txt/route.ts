import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.DOMAIN || 'zinsight.co.kr';
  const baseUrl = `https://${domain}`;

  // 다음 웹마스터도구 인증용 주석을 최상단에 배치한 robots.txt 콘텐츠 정의
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
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600', // 하루 단위 CDN 캐싱
    },
  });
}
