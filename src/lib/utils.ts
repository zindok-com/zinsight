import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function slugifyOrganization(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * 사용자·편집자 입력 마크다운 링크용 URL 허용 목록.
 * http(s)·mailto·tel·사이트 내부 경로만 통과시키고 javascript: 등 실행 가능한 스킴은 null 반환.
 */
export function sanitizeHref(url: string): string | null {
    const trimmed = url.trim();
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
    if (trimmed.startsWith('#')) return trimmed;
    return null;
}
