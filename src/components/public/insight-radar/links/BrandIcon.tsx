import { siFacebook, siInstagram, siKakaotalk, siNaver, siThreads, siTiktok, siTistory, siX, siYoutube } from 'simple-icons';
import { Globe, Linkedin } from 'lucide-react';
import type { SocialPlatform } from '@/lib/org-links';

// 각 플랫폼 공식 로고 (simple-icons, CC0). 링크드인은 simple-icons에서 제외되어 lucide 아이콘 사용
const ICONS: Partial<Record<SocialPlatform, { path: string; hex: string }>> = {
    instagram: siInstagram,
    youtube: siYoutube,
    x: siX,
    threads: siThreads,
    'naver-blog': siNaver,
    facebook: siFacebook,
    kakao: siKakaotalk,
    tiktok: siTiktok,
    tistory: siTistory,
};

export function BrandIcon({ platform, className = 'h-5 w-5' }: { platform: SocialPlatform | null; className?: string }) {
    if (platform === 'linkedin') return <Linkedin className={className} style={{ color: '#0A66C2' }} aria-hidden="true" />;
    const icon = platform ? ICONS[platform] : undefined;
    if (!icon) return <Globe className={`${className} text-slate-600`} aria-hidden="true" />;
    return (
        <svg viewBox="0 0 24 24" className={className} fill={`#${icon.hex}`} aria-hidden="true" focusable="false">
            <path d={icon.path} />
        </svg>
    );
}
