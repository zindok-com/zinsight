import { headers } from 'next/headers';

/**
 * 공개 엔드포인트용 요청 횟수 제한 (IP·키별 고정 시간 창, 서버 메모리 기준).
 * 서버 인스턴스마다 따로 세므로 대규모 분산 공격까지 막지는 못합니다.
 * 스팸·무차별 대입 같은 단일 출처 반복 요청을 줄이는 1차 방어이며, 대량 공격은 Vercel Firewall 규칙으로 함께 막습니다.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 10_000;

/** 허용이면 true, 한도를 넘었으면 false */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    if (buckets.size >= MAX_BUCKETS) {
        for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
        // 만료된 항목이 없을 만큼 꽉 찼으면 통째로 비움 (메모리 보호)
        if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    bucket.count += 1;
    return bucket.count <= limit;
}

/** 요청자 IP (Vercel이 설정하는 x-forwarded-for 첫 값). 알 수 없으면 'unknown' */
export function clientIpFromHeaders(h: Headers): string {
    const forwarded = h.get('x-forwarded-for');
    return (forwarded ? forwarded.split(',')[0] : h.get('x-real-ip') || '').trim() || 'unknown';
}

/** 서버 액션용: 현재 요청의 IP 기준으로 제한 */
export async function rateLimitByIp(name: string, limit: number, windowMs: number): Promise<boolean> {
    const ip = clientIpFromHeaders(await headers());
    return rateLimit(`${name}:${ip}`, limit, windowMs);
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
