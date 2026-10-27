/**
 * Video helper utilities for Magazine and public post viewers.
 * Kept in a standalone module (without 'use client') so it can be safely used
 * in both Server Components (SSR / static prerendering) and Client Components.
 */

export function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export function isDirectVideoUrl(url: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url.trim());
}
