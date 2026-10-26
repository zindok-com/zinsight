'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export interface VisitorOrgLogItem {
    id: number;
    ip_hash: string;
    org_name: string;
    asn: string | null;
    isp_name: string | null;
    city: string | null;
    country: string | null;
    page_path: string;
    page_type: string;
    target_id: number | null;
    target_name: string | null;
    referrer: string | null;
    is_b2b: boolean;
    visited_at: Date;
}

interface ResolvedIpOrg {
    orgName: string;
    asn: string | null;
    ispName: string | null;
    city: string | null;
    country: string | null;
    isB2b: boolean;
}

// 프로세스 내 IP 역추적 캐시 (동일 IP 반복 외부 API 호출 방지)
const ipOrgCache = new Map<string, { data: ResolvedIpOrg; expiresAt: number }>();
// 동일 방문자(ip_hash + page_path) 15분 내 중복 로깅 방지
const recentVisitDedup = new Map<string, number>();

// 일반 가정용/모바일 통신사 ISP 패턴 (전용회선 기관명이 없을 경우 일반 통신망으로 분류)
const RESIDENTIAL_ISP_PATTERNS = [
    /^korea telecom$/i,
    /^kt$/i,
    /^kornet$/i,
    /^sk broadband/i,
    /^sk telecom/i,
    /^skb$/i,
    /^lg uplus/i,
    /^lg dacom/i,
    /^lg powercomm/i,
    /^lgu\+$/i,
    /^boranet$/i,
    /^cmb /i,
    /^hcn /i,
    /^dlive/i,
    /^kctv/i,
    /^dreamline/i,
    /^sejong telecom/i,
];

// 기업·기관·대학교·지자체·공공기관 식별 키워드
const B2B_KEYWORDS = [
    /univ/i,
    /college/i,
    /school/i,
    /academy/i,
    /institute/i,
    /research/i,
    /gov/i,
    /ministry/i,
    /city/i,
    /provinc/i,
    /municipal/i,
    /foundation/i,
    /agency/i,
    /authority/i,
    /hospital/i,
    /medical/i,
    /bank/i,
    /financial/i,
    /securities/i,
    /insurance/i,
    /samsung/i,
    /hyundai/i,
    /kia/i,
    /naver/i,
    /kakao/i,
    /posco/i,
    /hanwha/i,
    /lotte/i,
    /doosan/i,
    /cj /i,
    /gs /i,
    /nhn/i,
    /ncsoft/i,
    /krafton/i,
    /netmarble/i,
    /woowa/i,
    /coupang/i,
    /toss/i,
    /viva republica/i,
    /daelim/i,
    /anyang/i,
    /suwon/i,
    /seongnam/i,
    /pangyo/i,
    /대학/,
    /시청/,
    /구청/,
    /도청/,
    /진흥원/,
    /연구원/,
    /연구소/,
    /재단/,
    /공단/,
    /공사/,
    /병원/,
    /은행/,
    /증권/,
];

// 주요 한국 기관/대학/기업 영문 네트워크명 한글 매핑 사전
const KNOWN_ORG_KO_MAP: Array<{ pattern: RegExp; koName: string }> = [
    { pattern: /daelim\s*univ/i, koName: '대림대학교 (Daelim University)' },
    { pattern: /sungkyul\s*univ/i, koName: '성결대학교 (Sungkyul University)' },
    { pattern: /anyang\s*univ/i, koName: '안양대학교 (Anyang University)' },
    { pattern: /yeonsei|yonsei/i, koName: '연세대학교 (Yonsei University)' },
    { pattern: /seoul\s*national\s*univ|snu/i, koName: '서울대학교 (SNU)' },
    { pattern: /korea\s*univ/i, koName: '고려대학교 (Korea University)' },
    { pattern: /kaist/i, koName: '카이스트 (KAIST)' },
    { pattern: /hanyang\s*univ/i, koName: '한양대학교 (Hanyang University)' },
    { pattern: /sungkyunkwan|skku/i, koName: '성균관대학교 (SKKU)' },
    { pattern: /kyung\s*hee/i, koName: '경희대학교 (Kyung Hee University)' },
    { pattern: /ajou\s*univ/i, koName: '아주대학교 (Ajou University)' },
    { pattern: /gachon\s*univ/i, koName: '가천대학교 (Gachon University)' },
    { pattern: /dankook\s*univ/i, koName: '단국대학교 (Dankook University)' },
    { pattern: /anyang\s*city|anyang-si/i, koName: '안양시청 행정망' },
    { pattern: /korea\s*information\s*society|nia/i, koName: '한국지능정보사회진흥원 (NIA)' },
    { pattern: /national\s*information\s*resources|nirs/i, koName: '정부통합전산센터 / 공공행정망' },
    { pattern: /koren|krnet|kreonet/i, koName: '국가과학기술연구망 / 대학·연구기관망 (KREONET)' },
    { pattern: /samsung/i, koName: '삼성그룹 사내망 (Samsung Network)' },
    { pattern: /hyundai/i, koName: '현대자동차그룹 사내망 (Hyundai Network)' },
    { pattern: /naver/i, koName: '네이버 사내망 (NAVER Cloud/Corp)' },
    { pattern: /kakao/i, koName: '카카오 사내망 (Kakao Corp)' },
];

function classifyNetworkOrg(rawOrg: string, rawIsp: string, rawAs: string): {
    displayOrgName: string;
    asn: string | null;
    isB2b: boolean;
} {
    const combined = `${rawOrg} ${rawIsp} ${rawAs}`.trim();
    const asnMatch = combined.match(/\b(AS\d+)\b/i);
    const asn = asnMatch ? asnMatch[1].toUpperCase() : null;

    const cleanOrg = rawOrg.replace(/^AS\d+\s+/i, '').trim();
    const cleanIsp = rawIsp.replace(/^AS\d+\s+/i, '').trim();
    const candidate = cleanOrg || cleanIsp || '미식별 네트워크';

    for (const item of KNOWN_ORG_KO_MAP) {
        if (item.pattern.test(combined)) {
            return {
                displayOrgName: item.koName,
                asn,
                isB2b: true,
            };
        }
    }

    const hasB2bKeyword = B2B_KEYWORDS.some((rx) => rx.test(combined));
    if (hasB2bKeyword) {
        return {
            displayOrgName: candidate,
            asn,
            isB2b: true,
        };
    }

    const isResidential = RESIDENTIAL_ISP_PATTERNS.some(
        (rx) => rx.test(cleanOrg) || rx.test(cleanIsp)
    );

    if (isResidential) {
        const ispLabel =
            /korea telecom|kornet|^kt$/i.test(combined)
                ? 'KT (일반 유무선 통신망)'
                : /sk broadband|sk telecom|^skb$/i.test(combined)
                ? 'SK브로드밴드/SKT (일반 통신망)'
                : /lg uplus|lg dacom|lg powercomm/i.test(combined)
                ? 'LG U+ (일반 유무선 통신망)'
                : `${candidate} (일반 ISP)`;
        return {
            displayOrgName: ispLabel,
            asn,
            isB2b: false,
        };
    }

    // 클라우드/봇/해외 데이터센터 필터링
    if (/amazon|aws|google\s*cloud|microsoft|azure|cloudflare|akamai|fastly|digitalocean|linode|vercel/i.test(combined)) {
        return {
            displayOrgName: `${candidate} (클라우드/데이터센터)`,
            asn,
            isB2b: false,
        };
    }

    // 일반 ISP나 클라우드가 아닌 고유 AS/조직명이면 기업·기관 전용망으로 간주
    const isLikelyB2b = candidate !== '미식별 네트워크' && candidate.length >= 2;
    return {
        displayOrgName: candidate,
        asn,
        isB2b: isLikelyB2b,
    };
}

function isPrivateOrLocalIp(ip: string): boolean {
    if (!ip) return true;
    const clean = ip.replace(/^::ffff:/, '');
    if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;
    if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(clean)) return true;
    return false;
}

async function resolveIpOrganization(ip: string): Promise<ResolvedIpOrg | null> {
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    if (isPrivateOrLocalIp(cleanIp)) {
        return null;
    }

    const cached = ipOrgCache.get(cleanIp);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    try {
        // 1차: ip-api.com (org, isp, asname을 분리 제공하여 기업 전용회선 식별에 유리)
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,countryCode,regionName,city,isp,org,as,asname`,
            { signal: AbortSignal.timeout(2200), cache: 'no-store' }
        );
        if (res.ok) {
            const json = await res.json();
            if (json && json.status === 'success') {
                const rawOrg = String(json.org || json.asname || '').trim();
                const rawIsp = String(json.isp || '').trim();
                const rawAs = String(json.as || '').trim();
                const classified = classifyNetworkOrg(rawOrg, rawIsp, rawAs);

                const result: ResolvedIpOrg = {
                    orgName: classified.displayOrgName,
                    asn: classified.asn,
                    ispName: rawIsp || rawOrg || null,
                    city: json.city ? `${json.regionName ? json.regionName + ' ' : ''}${json.city}` : null,
                    country: json.countryCode || null,
                    isB2b: classified.isB2b,
                };
                ipOrgCache.set(cleanIp, { data: result, expiresAt: Date.now() + 6 * 3600 * 1000 });
                return result;
            }
        }
    } catch {
        // fallback below
    }

    try {
        // 2차 폴백: ipinfo.io
        const tokenParam = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : '';
        const res2 = await fetch(`https://ipinfo.io/${encodeURIComponent(cleanIp)}/json${tokenParam}`, {
            signal: AbortSignal.timeout(2200),
            cache: 'no-store',
        });
        if (res2.ok) {
            const json2 = await res2.json();
            const rawOrg = String(json2.org || '').trim();
            const classified = classifyNetworkOrg(rawOrg, rawOrg, rawOrg);
            const result: ResolvedIpOrg = {
                orgName: classified.displayOrgName,
                asn: classified.asn,
                ispName: rawOrg || null,
                city: json2.city ? `${json2.region ? json2.region + ' ' : ''}${json2.city}` : null,
                country: json2.country || null,
                isB2b: classified.isB2b,
            };
            ipOrgCache.set(cleanIp, { data: result, expiresAt: Date.now() + 6 * 3600 * 1000 });
            return result;
        }
    } catch {
        // ignore network errors
    }

    return null;
}

/**
 * 공개 페이지 진입 시 접속 네트워크(ASN/Whois 기관명) 역추적 로깅
 * 개인정보보호법 준수를 위해 원문 IP는 절대 DB에 저장하지 않고 SHA-256 단방향 해시만 저장합니다.
 */
export async function recordVisitorNetworkPing(payload: {
    pagePath: string;
    pageType: 'magazine' | 'radar' | 'home' | 'other';
    targetId?: number | null;
    targetName?: string | null;
    referrer?: string | null;
}): Promise<{ ok: boolean }> {
    try {
        const hdrs = await headers();
        const forwardedFor = hdrs.get('x-forwarded-for');
        const realIp = hdrs.get('x-real-ip') || hdrs.get('cf-connecting-ip');
        const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp?.trim() || '';

        if (!rawIp || isPrivateOrLocalIp(rawIp)) {
            return { ok: false };
        }

        const userAgent = hdrs.get('user-agent') || '';
        if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|mediapartners/i.test(userAgent)) {
            return { ok: false };
        }

        const salt = process.env.NEXTAUTH_SECRET || 'zinsight-b2b-privacy-salt';
        const ipHash = crypto
            .createHash('sha256')
            .update(`${rawIp}:${salt}`)
            .digest('hex')
            .slice(0, 24);

        const pagePath = (payload.pagePath || '/').slice(0, 512);
        const dedupKey = `${ipHash}:${pagePath}`;
        const lastLogged = recentVisitDedup.get(dedupKey);
        if (lastLogged && Date.now() - lastLogged < 15 * 60 * 1000) {
            return { ok: true };
        }
        recentVisitDedup.set(dedupKey, Date.now());

        const resolved = await resolveIpOrganization(rawIp);
        if (!resolved) {
            return { ok: false };
        }

        await prisma.visitorOrgLog.create({
            data: {
                ip_hash: ipHash,
                org_name: resolved.orgName.slice(0, 255),
                asn: resolved.asn ? resolved.asn.slice(0, 64) : null,
                isp_name: resolved.ispName ? resolved.ispName.slice(0, 255) : null,
                city: resolved.city ? resolved.city.slice(0, 100) : null,
                country: resolved.country ? resolved.country.slice(0, 10) : null,
                page_path: pagePath,
                page_type: payload.pageType || 'other',
                target_id: payload.targetId ?? null,
                target_name: payload.targetName ? payload.targetName.slice(0, 255) : null,
                referrer: payload.referrer ? payload.referrer.slice(0, 512) : null,
                is_b2b: resolved.isB2b,
            },
        });

        return { ok: true };
    } catch {
        // DB 테이블 미생성 등 예외 시 페이지 렌더링에 영향을 주지 않도록 조용히 무시
        return { ok: false };
    }
}

/**
 * 어드민 대시보드용 B2B 기업/기관/지자체 IP 역추적 방문 로그 조회
 */
export async function getVisitorOrgLogs(limit = 30): Promise<{
    logs: VisitorOrgLogItem[];
    b2bCount: number;
    totalCount: number;
    tableReady: boolean;
}> {
    await requireAdmin();
    try {
        const [logs, b2bCount, totalCount] = await Promise.all([
            prisma.visitorOrgLog.findMany({
                orderBy: [
                    { is_b2b: 'desc' },
                    { visited_at: 'desc' },
                ],
                take: limit,
            }),
            prisma.visitorOrgLog.count({ where: { is_b2b: true } }),
            prisma.visitorOrgLog.count(),
        ]);

        return {
            logs,
            b2bCount,
            totalCount,
            tableReady: true,
        };
    } catch {
        return {
            logs: [],
            b2bCount: 0,
            totalCount: 0,
            tableReady: false,
        };
    }
}
