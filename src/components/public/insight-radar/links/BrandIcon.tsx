import { siFacebook, siInstagram, siKakaotalk, siThreads, siTiktok, siTistory, siX, siYoutube } from 'simple-icons';
import { Globe, Linkedin } from 'lucide-react';
import type { SocialPlatform } from '@/lib/org-links';

// 각 플랫폼 공식 로고 (simple-icons, CC0). 링크드인은 simple-icons에서 제외되어 lucide 아이콘,
// 네이버 블로그는 simple-icons에 없어 앱 아이콘 형태(초록 바탕 + 흰 말풍선 + blog)를 직접 그려 사용
const ICONS: Partial<Record<SocialPlatform, { path: string; hex: string }>> = {
    instagram: siInstagram,
    youtube: siYoutube,
    x: siX,
    threads: siThreads,
    facebook: siFacebook,
    kakao: siKakaotalk,
    tiktok: siTiktok,
    tistory: siTistory,
};

export function BrandIcon({ platform, className = 'h-5 w-5' }: { platform: SocialPlatform | null; className?: string }) {
    if (platform === 'naver-blog') return <NaverBlogIcon className={className} />;
    if (platform === 'linkedin') return <Linkedin className={className} style={{ color: '#0A66C2' }} aria-hidden="true" />;
    const icon = platform ? ICONS[platform] : undefined;
    if (!icon) return <Globe className={`${className} text-slate-600`} aria-hidden="true" />;
    return (
        <svg viewBox="0 0 24 24" className={className} fill={`#${icon.hex}`} aria-hidden="true" focusable="false">
            <path d={icon.path} />
        </svg>
    );
}

function NaverBlogIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
            <rect width="24" height="24" rx="6" fill="#03C75A" />
            <path fill="#fff" d="M6 5h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-3.2 2.4V17H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" />
            {/* 'blog' 글자는 글꼴에 따라 달라지지 않도록 선으로 그림 */}
            <g fill="none" stroke="#03C75A" strokeWidth="1.3" strokeLinecap="round">
                <path d="M6.3 8.4v5" />
                <circle cx="7.9" cy="11.8" r="1.6" />
                <path d="M10.4 8.4v5" />
                <circle cx="12.9" cy="11.8" r="1.6" />
                <circle cx="17" cy="11.8" r="1.6" />
                <path d="M18.6 10.2v3.6a1.6 1.6 0 0 1-2.9.9" />
            </g>
        </svg>
    );
}
