const isDev = process.env.NODE_ENV === 'development';

// 콘텐츠 보안 정책: 외부 스크립트·프레임·데이터 전송처를 쓰는 곳만 허용.
// Next.js 인라인 스크립트(하이드레이션·GA 초기화)는 nonce 없이 쓰므로 'unsafe-inline' 유지 (nonce 방식은 모든 페이지를 동적 렌더링으로 바꿈).
// 기업 로고·매거진 이미지·영상은 외부 https 주소를 그대로 쓰므로 img·media는 https 전체 허용.
const contentSecurityPolicy = [
    "default-src 'self'",
    // news.google.com: Google 선호 출처(Preferred Source) 버튼 스크립트
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://news.google.com https://www.gstatic.com https://va.vercel-scripts.com https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://www.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // GA4 수집 주소(analytics.google.com, www.google.com/g/collect 포함), 브라우저 직접 업로드(NCP), Vercel 분석
    `connect-src 'self'${isDev ? ' ws: wss:' : ''} https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://stats.g.doubleclick.net https://news.google.com https://vitals.vercel-insights.com https://kr.object.ncloudstorage.com https://*.kr.object.ncloudstorage.com https://vercel.live wss://ws-us3.pusher.com`,
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://news.google.com https://vercel.live",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure we can import files from outside if needed, though usually not recommended
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'kr.object.ncloudstorage.com',
                pathname: '/zinsight-media/**',
            },
            // 기존 Vercel Blob 주소는 마이그레이션 과도기 동안 유지
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
            {
                protocol: 'https',
                hostname: '**.public.blob.vercel-storage.com',
                port: '',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            }
        ],
    },
    // 기본 보안 헤더: 클릭재킹(관리자 화면 포함)·MIME 스니핑 방지, 외부로 전체 URL(초대 토큰 등) 유출 최소화
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
