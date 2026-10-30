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

/**
 * 목록 한 줄 소개: 전용 필드(tagline)가 있으면 그대로, 없으면 요약 첫 문장에서
 * 앞의 "{조직명}(영문명)은/는 " 주어를 떼어 사용. 말줄임은 CSS(truncate)로 처리.
 */
export function buildListTagline(
    companyName: string,
    tagline: string | null | undefined,
    summary: string | null | undefined
): string | null {
    const own = String(tagline ?? '').trim();
    if (own) return own;
    const firstLine = extractRadarTagline(summary);
    if (!firstLine) return null;
    // 첫 문장: "~다." "~요." 로 끝나는 지점까지 (없으면 첫 줄 전체)
    const sentence = firstLine.match(/^(.+?[다요]\.)(?=\s|$)/)?.[1] ?? firstLine;
    // 조직명은 띄어쓰기 차이("부트캠프 사업단" ↔ "부트캠프사업단")를 허용해 비교
    const namePattern = companyName
        .replace(/\s+/g, '')
        .split('')
        .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s*');
    const stripped = sentence.replace(new RegExp(`^(?:${namePattern})\\s*(?:\\([^)]*\\))?\\s*[은는]\\s+`), '');
    return stripped.trim() || sentence;
}

// ── 주요 활동 타임라인 (주요 레퍼런스 + 관련 기사 통합) ──

export interface RadarTimelineArticle {
    key: string;
    title: string;
    summary: string;
    url?: string;
    isMagazine: boolean;
    category: string;
    thumbnailUrl: string | null;
    pubDate: Date | string | null;
}

export type RadarTimelineItem =
    | { kind: 'article'; key: string; dateLabel: string | null; article: RadarTimelineArticle }
    | { kind: 'reference'; key: string; dateLabel: string | null; text: string };

interface YearMonth {
    year: number;
    month: number; // 0 = 월 미상
}

/**
 * 레퍼런스 문구에서 시기 추출: "2026.08 …", "… (2024.12)", "(전자신문 2026.08.13)", "(2025)".
 * 올해 이후 연도("2029년까지 지원")는 계획이므로 시기로 보지 않는다.
 */
export function extractReferenceDate(text: string, now = new Date()): YearMonth | null {
    const maxYear = now.getFullYear();
    // "2026.08" "2026-08" "2026년 8월" (특허·상표 번호 속 숫자는 앞이 영문·숫자라 제외)
    for (const m of text.matchAll(/(?<![\dA-Za-z])((?:19|20)\d{2})(?:[.\-/](\d{1,2})(?!\d)|년\s*(\d{1,2})월)/g)) {
        const year = Number(m[1]);
        const month = Number(m[2] ?? m[3]);
        if (year <= maxYear && month >= 1 && month <= 12) return { year, month };
    }
    for (const m of text.matchAll(/(?<![\dA-Za-z])((?:19|20)\d{2})(?!\d)/g)) {
        const year = Number(m[1]);
        if (year <= maxYear) return { year, month: 0 };
    }
    return null;
}

function kstYearMonth(date: Date | string | null): YearMonth | null {
    const label = formatRadarDate(date);
    if (!label) return null;
    const [y, m] = label.split('.');
    return { year: Number(y), month: Number(m) };
}

const formatYearMonth = (ym: YearMonth) => (ym.month ? `${ym.year}.${String(ym.month).padStart(2, '0')}` : String(ym.year));

// 기관·사건을 가리키지 않는 일반 단어 (중복 판정에서 제외)
const GENERIC_TOKENS = new Set([
    '선정', '체결', '운영', '참가', '참여', '도입', '개최', '협약', '업무협약', '기업', '사업', '지원', '지원사업',
    '프로그램', '출시', '수상', '기관', '진행', '오픈', '등록', '완료', '인증', '협력', '산학협력', '참가기업',
    '참여기업', '주관', '대표', '기준', '추가', '별도', '계약', '제휴', '구축', '설립', '국제', '해외', '센터',
]);

function eventTokens(text: string, excluded: Set<string>): string[] {
    return text
        .replace(/(?<!\d)(?:19|20)\d{2}[.\-/]?\d{0,2}[.\-/]?\d{0,2}/g, ' ')
        .split(/[^가-힣A-Za-z0-9]+/)
        .map((t) => t.replace(/(으로|에서|에게|과|와|의|을|를|은|는|이|가|에|로)$/, ''))
        .filter((t) => (/[가-힣]/.test(t) ? t.length >= 2 : t.length >= 3))
        .filter((t) => !GENERIC_TOKENS.has(t) && !excluded.has(t.toLowerCase()));
}

/**
 * 레퍼런스와 기사를 하나의 시간순(최신 먼저) 목록으로 합친다.
 * 같은 연월의 기사 제목에 레퍼런스의 기관·고유명사가 나오면 같은 사건으로 보고 기사만 남긴다.
 * 시기를 알 수 없는 레퍼런스는 맨 아래에 원래 순서대로 둔다.
 */
export function buildRadarTimeline(
    references: string[],
    articles: RadarTimelineArticle[],
    orgNames: string[]
): { items: RadarTimelineItem[]; mergedReferences: string[] } {
    const excluded = new Set(
        orgNames.flatMap((n) => [n, ...n.split(/\s+/)]).map((n) => n.replace(/\s+/g, '').toLowerCase()).filter(Boolean)
    );
    const datedArticles = articles.map((article) => ({ article, ym: kstYearMonth(article.pubDate) }));

    type Sortable = { item: RadarTimelineItem; ym: YearMonth | null; time: number; order: number };
    const rows: Sortable[] = datedArticles.map(({ article, ym }, i) => ({
        item: { kind: 'article', key: `a-${article.key}`, dateLabel: ym ? formatYearMonth(ym) : null, article },
        ym,
        time: article.pubDate ? new Date(article.pubDate).getTime() : 0,
        order: i,
    }));

    const mergedReferences: string[] = [];
    references.forEach((text, i) => {
        const ym = extractReferenceDate(text);
        if (ym?.month) {
            const tokens = eventTokens(text, excluded);
            // 같은 연월 + (겹치는 고유어 2개 이상, 또는 4자 이상 기관명 1개) → 같은 사건
            const duplicate = datedArticles.some(({ article, ym: aym }) => {
                if (!aym || aym.year !== ym.year || aym.month !== ym.month) return false;
                const title = article.title.replace(/\s+/g, '').toLowerCase();
                const shared = tokens.filter((t) => title.includes(t.toLowerCase()));
                return shared.length >= 2 || shared.some((t) => t.length >= 4);
            });
            if (duplicate) {
                mergedReferences.push(text);
                return;
            }
        }
        // 맨 앞 시기 표기("2026.08 ", "2024년 ")는 날짜 열과 중복이라 본문에서 뗀다 (기간 표기 "2023~2025"는 유지)
        const body = ym ? text.replace(/^(?:19|20)\d{2}(?:[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?|년(?:\s*\d{1,2}월)?)?\s+(?!~)/, '') : text;
        rows.push({
            item: { kind: 'reference', key: `r-${i}`, dateLabel: ym ? formatYearMonth(ym) : null, text: body || text },
            ym,
            time: 0,
            order: 1000 + i,
        });
    });

    const rank = (ym: YearMonth | null) => (ym ? ym.year * 100 + ym.month : -1);
    rows.sort((a, b) => {
        const diff = rank(b.ym) - rank(a.ym);
        if (diff !== 0) return diff;
        // 같은 연월: 기사(최신순) → 레퍼런스(입력 순)
        if (a.item.kind !== b.item.kind) return a.item.kind === 'article' ? -1 : 1;
        return a.item.kind === 'article' ? b.time - a.time : a.order - b.order;
    });

    return { items: rows.map((r) => r.item), mergedReferences };
}
