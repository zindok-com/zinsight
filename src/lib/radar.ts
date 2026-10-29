// 인사이트 레이더 목록·프로필 공용 헬퍼 (서버·클라이언트 양쪽에서 사용)

export const RADAR_SORTS = ['recent', 'articles', 'name'] as const;
export type RadarSort = (typeof RADAR_SORTS)[number];

export const RADAR_SORT_LABEL: Record<RadarSort, string> = {
    recent: '최근 활동순',
    articles: '연관 기사순',
    name: '가나다순',
};

export function parseRadarSort(value: string | undefined): RadarSort {
    return (RADAR_SORTS as readonly string[]).includes(value ?? '') ? (value as RadarSort) : 'recent';
}

export interface RadarKeywords {
    products: string[];
    technology: string[];
    target_market: string[];
}

function toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

/** core_keywords(JSON 또는 JSON 문자열)를 안전하게 파싱 */
export function parseRadarKeywords(raw: unknown): RadarKeywords {
    let value: any = raw;
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw);
        } catch {
            value = null;
        }
    }
    return {
        products: toStringArray(value?.products),
        technology: toStringArray(value?.technology),
        target_market: toStringArray(value?.target_market),
    };
}

export function flattenRadarKeywords(kw: RadarKeywords): string[] {
    return [...new Set([...kw.products, ...kw.technology, ...kw.target_market])];
}

/** "2026.05.27", "2019", "2019-03" 등에서 설립 연도 추출 */
export function parseFoundedYear(founded: string | null | undefined): number | null {
    const match = String(founded ?? '').match(/(19|20)\d{2}/);
    return match ? Number(match[0]) : null;
}

/** 업력 표기: 설립 연도 기준 (올해 설립은 "1년 미만") */
export function formatCompanyAge(founded: string | null | undefined, now = new Date()): string | null {
    const year = parseFoundedYear(founded);
    if (!year) return null;
    const age = now.getFullYear() - year;
    if (age < 0) return null;
    return age === 0 ? '1년 미만' : `${age}년`;
}

/** 설립일 표기를 "2026.05" 형태로 정리 (원문에 월이 없으면 연도만) */
export function formatFoundedDate(founded: string | null | undefined): string | null {
    const raw = String(founded ?? '').trim();
    if (!raw) return null;
    const match = raw.match(/((?:19|20)\d{2})(?:[.\-/년\s]+(\d{1,2}))?/);
    if (!match) return raw;
    return match[2] ? `${match[1]}.${match[2].padStart(2, '0')}` : match[1];
}

/** 날짜를 KST 기준 "2026.10.20"으로 표기 */
export function formatRadarDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}.${get('month')}.${get('day')}`;
}

/** 목록용 한 줄 소개: 비즈니스 요약의 첫 문단(마크업 기호 제거). 표시 길이는 CSS clamp로 조절 */
export function extractRadarTagline(summary: string | null | undefined): string | null {
    const firstLine = String(summary ?? '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line && !/^(\-{3,}|\*{3,}|_{3,}|\[(여백|space|spacer).*\])$/i.test(line));
    if (!firstLine) return null;
    return firstLine
        .replace(/^[•▪\-*]\s*/, '')
        .replace(/\*\*\{?(.*?)\}?\*\*/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1');
}

/** 로고가 없을 때 쓰는 이니셜 (한글은 첫 글자, 영문은 앞 두 글자) */
export function getOrgInitial(name: string): string {
    const trimmed = name.replace(/^(주식회사|\(주\)|㈜)\s*/, '').trim();
    if (!trimmed) return '?';
    return /^[A-Za-z]/.test(trimmed) ? trimmed.slice(0, 2).toUpperCase() : trimmed.slice(0, 1);
}

/** 유튜브 영상 ID 추출 (watch, youtu.be, embed, shorts 형식) */
export function getYoutubeId(url: string | null | undefined): string | null {
    const match = String(url ?? '').match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : null;
}
