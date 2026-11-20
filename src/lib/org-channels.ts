import { normalizeExtraMaterials } from './org-materials';

// 조직 공식 채널 정의. 관리자 화면(클라이언트)과 서버에서 함께 쓰므로 DB·서버 모듈을 가져오지 않는다.
// 새 종류는 CHANNEL_TYPE_KEYS와 CHANNEL_TYPES에 한 항목씩 추가하고, 아이콘은 BrandIcon에 추가한다.

export const CHANNEL_TYPE_KEYS = [
    'homepage',
    'naver_blog',
    'instagram',
    'youtube',
    'threads',
    'facebook',
    'linkedin',
    'x',
    'kakao_channel',
    'smartstore',
    'naver_place',
    'google_maps',
    'brochure',
    'other',
] as const;
export type ChannelType = (typeof CHANNEL_TYPE_KEYS)[number];

/** 리포트 집계 그룹 */
export const CHANNEL_GROUP_KEYS = ['homepage', 'sns', 'map_store', 'material', 'other'] as const;
export type ChannelGroup = (typeof CHANNEL_GROUP_KEYS)[number];

export const CHANNEL_GROUP_LABEL: Record<ChannelGroup, string> = {
    homepage: '홈페이지',
    sns: 'SNS',
    map_store: '지도·매장',
    material: '자료',
    other: '기타',
};

export type ChannelDisplay = 'card' | 'button' | 'icon';

interface ChannelTypeDef {
    label: string;
    /** 표시 문구 기본값. other는 직접 입력 필수라 빈 값 */
    defaultText: string;
    group: ChannelGroup;
    /** Organization JSON-LD sameAs 포함 여부 */
    sameAs: boolean;
    /** 진사이트 카드 기본 형태 */
    defaultDisplay: ChannelDisplay;
    /** 주소로 자동 판별 (homepage·other는 판별 규칙 없음) */
    match?: (u: { host: string; path: string }) => boolean;
}

const hostIs = (host: string, ...domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`));

export const CHANNEL_TYPES: Record<ChannelType, ChannelTypeDef> = {
    homepage: { label: '홈페이지', defaultText: '홈페이지 바로가기', group: 'homepage', sameAs: true, defaultDisplay: 'button' },
    naver_blog: {
        label: '네이버 블로그',
        defaultText: '블로그',
        group: 'sns',
        sameAs: true,
        defaultDisplay: 'icon',
        match: ({ host }) => host === 'blog.naver.com' || host === 'm.blog.naver.com',
    },
    instagram: { label: '인스타그램', defaultText: '인스타그램', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'instagram.com') },
    youtube: { label: '유튜브', defaultText: '유튜브', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'youtube.com', 'youtu.be') },
    threads: { label: '스레드', defaultText: '스레드', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'threads.com', 'threads.net') },
    facebook: { label: '페이스북', defaultText: '페이스북', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'facebook.com', 'fb.com') },
    linkedin: { label: '링크드인', defaultText: '링크드인', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'linkedin.com') },
    x: { label: 'X', defaultText: 'X', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => hostIs(host, 'x.com', 'twitter.com') },
    kakao_channel: { label: '카카오톡 채널', defaultText: '카카오톡 채널', group: 'sns', sameAs: true, defaultDisplay: 'icon', match: ({ host }) => host === 'pf.kakao.com' },
    smartstore: {
        label: '네이버 스마트스토어',
        defaultText: '스마트스토어',
        group: 'map_store',
        sameAs: true,
        defaultDisplay: 'button',
        match: ({ host }) => host === 'smartstore.naver.com' || host === 'm.smartstore.naver.com',
    },
    naver_place: {
        label: '네이버 플레이스',
        defaultText: '네이버 지도',
        group: 'map_store',
        sameAs: true,
        defaultDisplay: 'button',
        match: ({ host }) => hostIs(host, 'map.naver.com', 'place.naver.com') || host === 'naver.me',
    },
    google_maps: {
        label: '구글 지도',
        defaultText: '구글 지도',
        group: 'map_store',
        sameAs: true,
        defaultDisplay: 'button',
        match: ({ host, path }) =>
            (/^(www\.)?google\.[a-z.]+$/.test(host) && path.startsWith('/maps')) ||
            host === 'maps.google.com' ||
            host === 'maps.app.goo.gl' ||
            host === 'g.page' ||
            (host === 'goo.gl' && path.startsWith('/maps')),
    },
    brochure: {
        label: '소개자료',
        defaultText: '소개자료 보기',
        group: 'material',
        sameAs: false,
        defaultDisplay: 'button',
        match: ({ path }) => /\.(pdf|pptx?|docx?|hwpx?|key|zip)$/i.test(path) || path.includes('/attachments/'),
    },
    other: { label: '기타', defaultText: '', group: 'other', sameAs: false, defaultDisplay: 'button' },
};

/** 화면 선택 순서 (자동 판별 우선순위와 같음) */
export const CHANNEL_TYPE_OPTIONS = CHANNEL_TYPE_KEYS.map((key) => ({ key, label: CHANNEL_TYPES[key].label }));

export const CHANNELS_MAX = 30;
export const CHANNEL_LABEL_MAX = 100;

export function isChannelType(v: unknown): v is ChannelType {
    return (CHANNEL_TYPE_KEYS as readonly unknown[]).includes(v);
}

export function channelTypeOf(v: unknown): ChannelType {
    return isChannelType(v) ? v : 'other';
}

/** 화면에 보일 문구: 직접 입력한 문구, 없으면 종류의 기본 문구 */
export function channelText(type: ChannelType, label: string | null | undefined): string {
    const trimmed = (label ?? '').trim();
    return trimmed || CHANNEL_TYPES[type].defaultText || '바로가기';
}

function parseHost(url: string): { host: string; path: string } | null {
    try {
        const u = new URL(url);
        return { host: u.hostname.toLowerCase().replace(/^www\./, ''), path: u.pathname.toLowerCase() };
    } catch {
        return null;
    }
}

/** 주소로 종류 판별. 규칙에 맞는 종류가 없으면 null (호출하는 쪽이 homepage·other 결정) */
export function detectChannelType(url: string): ChannelType | null {
    const parsed = parseHost(url);
    if (!parsed) return null;
    for (const key of CHANNEL_TYPE_KEYS) {
        if (CHANNEL_TYPES[key].match?.(parsed)) return key;
    }
    return null;
}

/** 새 행의 종류 추천: 판별되면 그 종류, 아니면 대표 홈페이지가 없을 때만 homepage, 그 밖은 other */
export function guessChannelType(url: string, hasHomepage: boolean): ChannelType {
    return detectChannelType(url) ?? (hasHomepage ? 'other' : 'homepage');
}

// ── 주소 정리 ──

const STRIP_PARAMS = new Set(['hl', 'fbclid', 'gclid', 'igshid', 'igsh', 'si', 'feature', 'ref', 'nl-query', 'nl-ts-pid', 'napm', 'mibextid']);
const MOBILE_HOSTS: Record<string, string> = {
    'm.blog.naver.com': 'blog.naver.com',
    'm.facebook.com': 'www.facebook.com',
    'm.youtube.com': 'www.youtube.com',
    'm.smartstore.naver.com': 'smartstore.naver.com',
};

export type NormalizedUrl = { ok: true; url: string; notes: string[] } | { ok: false; error: string };

/**
 * 채널 주소 정리: https로 통일, 추적·언어 파라미터(utm_*, hl, fbclid, igshid, si 등)와 # 이하 제거,
 * 모바일 주소를 일반 주소로, 끝의 / 제거. notes는 사람에게 알려 줄 변경 내용
 */
export function normalizeChannelUrl(raw: string): NormalizedUrl {
    let s = (raw ?? '').trim();
    if (!s) return { ok: false, error: '주소를 입력해 주세요.' };
    if (/^(mailto|tel|javascript|data):/i.test(s)) return { ok: false, error: '웹 주소(https://…)만 등록할 수 있습니다.' };
    if (s.startsWith('//')) s = `https:${s}`;
    else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;

    let u: URL;
    try {
        u = new URL(s);
    } catch {
        return { ok: false, error: '주소 형식이 올바르지 않습니다.' };
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, error: '웹 주소(https://…)만 등록할 수 있습니다.' };
    if (!u.hostname.includes('.') || /\s/.test(s)) return { ok: false, error: '주소 형식이 올바르지 않습니다.' };

    const notes: string[] = [];
    if (u.protocol === 'http:') notes.push('http → https');
    if (u.username || u.password) return { ok: false, error: '주소에 계정 정보를 넣을 수 없습니다.' };

    let host = u.host.toLowerCase();
    if (MOBILE_HOSTS[u.hostname.toLowerCase()]) {
        host = MOBILE_HOSTS[u.hostname.toLowerCase()] + (u.port ? `:${u.port}` : '');
        notes.push('모바일 주소 → 일반 주소');
    }

    const removed: string[] = [];
    for (const key of Array.from(u.searchParams.keys())) {
        const k = key.toLowerCase();
        if (k.startsWith('utm_') || STRIP_PARAMS.has(k)) {
            if (!removed.includes(key)) removed.push(key);
            u.searchParams.delete(key);
        }
    }
    if (removed.length > 0) notes.push(`${removed.map((k) => `?${k}`).join(' ')} 제거`);
    if (u.hash) notes.push('# 이하 제거');

    const path = u.pathname.replace(/\/+$/, '');
    const search = u.searchParams.toString();
    const url = `https://${host}${path}${search ? `?${search}` : ''}`;
    if (url.length > 512) return { ok: false, error: '주소가 너무 깁니다 (512자 이내).' };
    return { ok: true, url, notes };
}

/** 같은 주소인지 (정리 후 비교, www 차이는 같은 주소로 봄) */
export function sameChannelUrl(a: string, b: string): boolean {
    const key = (u: string) => {
        const n = normalizeChannelUrl(u);
        return (n.ok ? n.url : u.trim()).toLowerCase().replace(/^https:\/\/www\./, 'https://');
    };
    return key(a) === key(b);
}

/** 스마트스토어 상품 주소면 스토어 첫 화면 주소 (아니면 null) */
export function smartstoreRootOf(url: string): string | null {
    try {
        const u = new URL(url);
        if (!/^(m\.)?smartstore\.naver\.com$/i.test(u.hostname)) return null;
        const [store, ...rest] = u.pathname.split('/').filter(Boolean);
        if (!store || rest.length === 0) return null;
        return `https://smartstore.naver.com/${store}`;
    } catch {
        return null;
    }
}

// ── 저장 전 검사 ──

export interface ChannelInput {
    id?: number | null;
    type: ChannelType | string;
    url: string;
    label?: string | null;
    is_primary?: boolean;
}

export interface PreparedChannel {
    id: number | null;
    type: ChannelType;
    url: string;
    label: string | null;
    is_primary: boolean;
}

export type PrepareResult = { ok: true; channels: PreparedChannel[] } | { ok: false; error: string; index: number | null };

/**
 * 화면 순서대로 정리·검사. 주소가 빈 행은 버림.
 * 대표 홈페이지: homepage 종류에서 하나. 지정이 없으면 첫 homepage를 대표로
 */
export function prepareChannels(input: ChannelInput[]): PrepareResult {
    const rows = (Array.isArray(input) ? input : []).filter((r) => String(r?.url ?? '').trim() !== '');
    if (rows.length > CHANNELS_MAX) return { ok: false, error: `공식 채널은 ${CHANNELS_MAX}개까지 등록할 수 있습니다.`, index: null };

    const channels: PreparedChannel[] = [];
    for (const [index, raw] of rows.entries()) {
        const normalized = normalizeChannelUrl(String(raw.url));
        if (!normalized.ok) return { ok: false, error: `${index + 1}번째 채널: ${normalized.error}`, index };
        const type = channelTypeOf(raw.type);
        const label = String(raw.label ?? '').trim().slice(0, CHANNEL_LABEL_MAX);
        if (type === 'other' && !label) return { ok: false, error: `${index + 1}번째 채널: '기타'는 표시 문구를 입력해 주세요.`, index };
        const dup = channels.findIndex((c) => sameChannelUrl(c.url, normalized.url));
        if (dup !== -1) return { ok: false, error: `${index + 1}번째 채널 주소가 ${dup + 1}번째와 같습니다.`, index };
        channels.push({
            id: typeof raw.id === 'number' ? raw.id : null,
            type,
            url: normalized.url,
            label: label && label !== CHANNEL_TYPES[type].defaultText ? label : null,
            is_primary: type === 'homepage' && raw.is_primary === true,
        });
    }

    const primaries = channels.filter((c) => c.is_primary);
    if (primaries.length > 1) return { ok: false, error: '대표 홈페이지는 하나만 지정할 수 있습니다.', index: null };
    if (primaries.length === 0) {
        const firstHome = channels.find((c) => c.type === 'homepage');
        if (firstHome) firstHome.is_primary = true;
    }
    return { ok: true, channels };
}

// ── 읽기 (DB 행 또는 이전 전 값) ──

export interface OrgChannel {
    /** 공식 채널 id. 이전 전 값으로 만든 목록이면 null */
    id: number | null;
    type: ChannelType;
    url: string;
    label: string | null;
    /** 표시 문구 (기본 문구 반영) */
    text: string;
    isPrimary: boolean;
}

export interface ChannelRow {
    id: number;
    channel_type: string;
    url: string;
    label: string | null;
    is_primary: boolean;
    sort_order: number;
}

export interface LegacyLinkSource {
    company_url?: string | null;
    backlinks?: unknown;
    brochure_url?: string | null;
    extra_materials?: unknown;
}

function parseBacklinks(raw: unknown): Array<{ title: string; url: string }> {
    let list: unknown = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({ title: String(item?.title ?? '').trim(), url: String(item?.url ?? '').trim() })).filter((i) => i.url);
}

/**
 * 이전 전 값(company_url + backlinks + 소개자료·추가 자료)으로 공식 채널 목록 만들기.
 * 이전 스크립트와, 채널을 아직 옮기지 않은 조직의 화면 표시(대비 경로)에서 같이 쓴다.
 * 스마트스토어 상품 주소는 스토어 주소로 바꾼다 (sameAs에 상품 페이지가 들어가지 않도록)
 */
export function channelsFromLegacy(org: LegacyLinkSource): { channels: PreparedChannel[]; notes: string[] } {
    const notes: string[] = [];
    const out: PreparedChannel[] = [];
    const push = (type: ChannelType, rawUrl: string, label: string | null, isPrimary = false) => {
        const n = normalizeChannelUrl(rawUrl);
        if (!n.ok) {
            notes.push(`건너뜀(주소 오류): ${rawUrl} — ${n.error}`);
            return;
        }
        let url = n.url;
        const storeRoot = type === 'smartstore' ? smartstoreRootOf(url) : null;
        if (storeRoot) {
            notes.push(`스마트스토어 상품 주소 → 스토어 주소: ${url} → ${storeRoot}`);
            url = storeRoot;
        }
        if (out.some((c) => sameChannelUrl(c.url, url))) return;
        const text = (label ?? '').trim();
        const finalLabel = text && text !== CHANNEL_TYPES[type].defaultText ? text.slice(0, CHANNEL_LABEL_MAX) : null;
        if (type === 'other') notes.push(`기타로 분류: ${finalLabel ?? '(문구 없음)'} ${url}`);
        out.push({ id: null, type, url, label: type === 'other' ? finalLabel ?? '바로가기' : finalLabel, is_primary: isPrimary });
    };

    const backlinks = parseBacklinks(org.backlinks);
    const homepage = (org.company_url ?? '').trim();
    if (homepage) {
        const first = backlinks.find((b) => sameChannelUrl(b.url, homepage));
        push('homepage', homepage, first?.title ?? null, true);
    }
    for (const item of backlinks) {
        const hasHome = out.some((c) => c.type === 'homepage');
        const detected = detectChannelType(item.url);
        const type = detected ?? (hasHome ? 'other' : 'homepage');
        push(type, item.url, item.title || null, type === 'homepage' && !hasHome);
    }
    if (org.brochure_url) push('brochure', org.brochure_url, null);
    for (const m of normalizeExtraMaterials(org.extra_materials)) push('brochure', m.url, m.label);
    return { channels: out, notes };
}

/** DB 행이 있으면 그 목록, 없으면 이전 전 값으로 만든 목록 (id null) */
export function resolveOrgChannels(rows: ChannelRow[] | null | undefined, legacy: LegacyLinkSource): OrgChannel[] {
    if (rows && rows.length > 0) {
        return [...rows]
            .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
            .map((r) => {
                const type = channelTypeOf(r.channel_type);
                return { id: r.id, type, url: r.url, label: r.label, text: channelText(type, r.label), isPrimary: r.is_primary };
            });
    }
    return channelsFromLegacy(legacy).channels.map((c) => ({
        id: null,
        type: c.type,
        url: c.url,
        label: c.label,
        text: channelText(c.type, c.label),
        isPrimary: c.is_primary,
    }));
}

export function primaryHomepage(channels: OrgChannel[]): OrgChannel | null {
    return channels.find((c) => c.isPrimary) ?? channels.find((c) => c.type === 'homepage') ?? null;
}

/** 프로필 헤더용: 대표 홈페이지를 맨 앞에, 소개자료 제외, 상위 count개 */
export function profileHeaderChannels(channels: OrgChannel[], count: number): OrgChannel[] {
    const primary = primaryHomepage(channels);
    const rest = channels.filter((c) => c !== primary && c.type !== 'brochure');
    return [...(primary ? [primary] : []), ...rest].slice(0, Math.max(0, count));
}

/** JSON-LD sameAs: sameAs 포함 종류의 정리된 주소 (중복 제거) */
export function channelSameAs(channels: OrgChannel[]): string[] {
    const out: string[] = [];
    for (const c of channels) {
        if (!CHANNEL_TYPES[c.type].sameAs) continue;
        if (!out.some((u) => sameChannelUrl(u, c.url))) out.push(c.url);
    }
    return out;
}

/** 이전 전 컬럼에 함께 써 둘 값 (company_url·backlinks·brochure_url·extra_materials를 읽는 기존 코드 호환) */
export function legacyMirrorOf(channels: PreparedChannel[]) {
    const primary = channels.find((c) => c.is_primary) ?? null;
    const links = channels.filter((c) => c.type !== 'brochure');
    const ordered = [...(primary ? [primary] : []), ...links.filter((c) => c !== primary)];
    const brochures = channels.filter((c) => c.type === 'brochure');
    return {
        company_url: primary && primary.url.length <= 255 ? primary.url : null,
        backlinks: ordered.map((c) => ({ title: channelText(c.type, c.label), url: c.url })),
        brochure_url: brochures[0]?.url ?? null,
        extra_materials: brochures.slice(1).map((c) => ({ label: channelText(c.type, c.label).slice(0, 30), url: c.url })),
    };
}
