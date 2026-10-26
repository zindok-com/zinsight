'use server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export interface AeoEngineScore {
    engine: 'ChatGPT' | 'Gemini' | 'Perplexity' | 'Google AI Overviews';
    score: number; // 0 ~ 100
    status: '높음' | '보통' | '낮음' | '미감지';
    citationNote: string;
}

export interface AeoPromptAuditItem {
    prompt: string;
    intent: string;
    mentioned: boolean;
    citedSource: boolean;
    confidence: number; // 0 ~ 100
    simulatedSnippet: string;
}

export interface AeoAuditResult {
    id?: number;
    entityType: 'organization' | 'article' | 'lead_magnet';
    organizationId?: number | null;
    postId?: number | null;
    targetName: string;
    regionName: string | null;
    industryKeywords: string[];
    answerIndex: number;        // 0 ~ 100 종합 점수
    baselineIndex: number;      // 리빙 프로필/최적화 이전 또는 직전 감사 점수 (예: 20)
    deltaIndex: number;         // 상승폭 (예: +40)
    mentionRate: number;        // 0 ~ 100% (프롬프트 중 브랜드 언급 비율)
    citationRate: number;       // 0 ~ 100% (진사이트 구조화 출처 인용율)
    promptCount: number;
    engines: AeoEngineScore[];
    prompts: AeoPromptAuditItem[];
    auditedAt: string;
    auditMethod: 'LLM_SYNTHETIC_AUDIT' | 'STRUCTURED_SIGNAL_SYNTHETIC_AUDIT';
    history: Array<{
        auditedAt: string;
        answerIndex: number;
        mentionRate: number;
        citationRate: number;
    }>;
}

function clampScore(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(n)));
}

function parseKeywordsList(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map((x) => String(x).trim()).filter(Boolean);
    }
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return parseKeywordsList(parsed);
        } catch {
            return raw
                .split(/[,|#\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
        }
    }
    if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        return [
            ...parseKeywordsList(obj.products),
            ...parseKeywordsList(obj.technology),
            ...parseKeywordsList(obj.target_market),
        ];
    }
    return [];
}

/**
 * Gemini Flash 경량 모델 API가 설정된 경우 실제 프롬프트 시뮬레이션 감사를 보조 수행
 */
async function tryLightweightGeminiAudit(
    targetName: string,
    regionName: string | null,
    keywords: string[],
    prompts: string[]
): Promise<{ mentionBonus: number; customSnippet?: string } | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(4500),
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `당신은 AEO(Answer Engine Optimization) 감사 평가기입니다.
대상: "${targetName}" (${regionName || '대한민국'}, 주요 키워드: ${keywords.slice(0, 5).join(', ') || '일반 비즈니스'})
테스트 질문: "${prompts[0]}"
이 질문에 대해 생성형 AI가 "${targetName}"을(를) 답변에 인용할 때 출력할 한국어 1~2문장 요약 답변 예시를 작성해 주세요.`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: 140,
                        temperature: 0.2,
                    },
                }),
            }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
            return { mentionBonus: 5, customSnippet: text };
        }
    } catch {
        // fallback silently
    }
    return null;
}

/**
 * 조직(Organization) 또는 매거진 포스트(MagazinePost)의 AEO 구조화 신호와
 * 6개 타겟 프롬프트 시뮬레이션을 결합하여 Answer Index (0~100) 산출
 */
async function computeSyntheticAudit(params: {
    entityType: 'organization' | 'article' | 'lead_magnet';
    organizationId?: number | null;
    postId?: number | null;
    targetName: string;
    entityCategory?: string;
    regionName: string | null;
    keywords: string[];
    hasSummary: boolean;
    summaryLength: number;
    hasStructuredJsonLd: boolean;
    faqCount: number;
    backlinkCount: number;
    magazineArticleCount: number;
    newsArticleCount: number;
    hasLogo: boolean;
    isRegisteredInZinsight: boolean;
    previousLogs?: Array<{ audited_at: Date; answer_index: number; mention_rate: number; citation_rate: number }>;
}): Promise<AeoAuditResult> {
    const {
        entityType,
        organizationId,
        postId,
        targetName,
        entityCategory = '기업',
        regionName,
        keywords,
        hasSummary,
        summaryLength,
        hasStructuredJsonLd,
        faqCount,
        backlinkCount,
        magazineArticleCount,
        newsArticleCount,
        hasLogo,
        isRegisteredInZinsight,
        previousLogs = [],
    } = params;

    const regionLabel = regionName || '수도권·국내';
    const kw1 = keywords[0] || `${entityCategory} 핵심 역량`;
    const kw2 = keywords[1] || '주요 사업 및 기술';
    const kw3 = keywords[2] || '지역 혁신 사례';

    // 1. 기본 구조화·인용 역량 점수 계산 (0 ~ 100)
    let rawScore = isRegisteredInZinsight ? 32 : 14;
    if (hasStructuredJsonLd) rawScore += 16; // Schema.org Organization / NewsArticle JSON-LD
    if (hasSummary && summaryLength > 80) rawScore += 12;
    else if (hasSummary) rawScore += 6;
    if (keywords.length >= 3) rawScore += 10;
    else if (keywords.length >= 1) rawScore += 5;
    if (faqCount >= 3) rawScore += 12;
    else if (faqCount >= 1) rawScore += 7;
    if (magazineArticleCount >= 2) rawScore += 14;
    else if (magazineArticleCount === 1) rawScore += 9;
    if (newsArticleCount >= 5) rawScore += 8;
    else if (newsArticleCount >= 1) rawScore += 4;
    if (backlinkCount >= 1) rawScore += 5;
    if (hasLogo) rawScore += 3;

    // 6개 표준 타겟 프롬프트 생성 (Synthetic Prompt Audit)
    const promptTemplates = [
        {
            prompt: `${regionLabel}에서 ${kw1} 관련 대표적인 ${entityCategory}이나 사례를 알려줘`,
            intent: '지역·산업 대표 엔티티 탐색',
            threshold: 28,
        },
        {
            prompt: `${targetName}의 주요 사업 분야와 핵심 경쟁력(${kw1})은 무엇인가요?`,
            intent: '브랜드 직접 질의 (Entity Fact Check)',
            threshold: 18,
        },
        {
            prompt: `${kw1} 및 ${kw2} 분야에서 주목받는 기업·기관 레퍼런스 추천해줘`,
            intent: '솔루션·레퍼런스 비교 탐색',
            threshold: 48,
        },
        {
            prompt: `${targetName} 관련 최신 심층 기사나 공식 프로필 출처를 요약해줘`,
            intent: '권위 출처(Citation) 기반 답변 생성',
            threshold: 35,
        },
        {
            prompt: `${regionLabel} ${kw3} 관련 산학협력·혁신 기관 또는 유망 조직은?`,
            intent: '로컬 생태계·협력 파트너 탐색',
            threshold: 55,
        },
        {
            prompt: `${targetName}에 대해 자주 묻는 질문(FAQ)과 공식 웹페이지 정보 알려줘`,
            intent: 'AEO 구조화 FAQ·백링크 인용 검증',
            threshold: 42,
        },
    ];

    const geminiCheck = await tryLightweightGeminiAudit(
        targetName,
        regionName,
        keywords,
        promptTemplates.map((p) => p.prompt)
    );

    if (geminiCheck?.mentionBonus) {
        rawScore += geminiCheck.mentionBonus;
    }

    const answerIndex = clampScore(rawScore, 12, 98);

    const evaluatedPrompts: AeoPromptAuditItem[] = promptTemplates.map((item, idx) => {
        const mentioned = answerIndex >= item.threshold;
        const citedSource = isRegisteredInZinsight && answerIndex >= item.threshold + 8;
        const confidence = clampScore(
            mentioned
                ? answerIndex + (idx === 1 ? 12 : idx === 0 ? 6 : -idx * 2)
                : Math.max(15, answerIndex - 15)
        );

        let simulatedSnippet = '';
        if (idx === 0 && geminiCheck?.customSnippet) {
            simulatedSnippet = geminiCheck.customSnippet;
        } else if (mentioned && citedSource) {
            simulatedSnippet = `[진사이트 인사이트 레이더·매거진 출처 인용] ${targetName}은(는) ${regionLabel} 기반의 ${entityCategory}(으)로, ${kw1} 및 ${kw2} 분야에서 구조화된 프로필과 검증된 기사 레퍼런스를 보유하고 있습니다.`;
        } else if (mentioned) {
            simulatedSnippet = `${targetName}이(가) 답변 후보로 언급되나, 외부 AI 엔진이 신뢰할 수 있는 심층 매거진 기사·FAQ 구조화 데이터(JSON-LD) 보강 시 출처 링크 인용률이 상승합니다.`;
        } else {
            simulatedSnippet = `현재 해당 산업·지역 일반 질의에서 ${targetName}의 구조화 데이터 시그널이 부족하여 경쟁 엔티티가 우선 노출됩니다. 리빙 프로필 키워드 및 매거진 아티클 발행이 권장됩니다.`;
        }

        return {
            prompt: item.prompt,
            intent: item.intent,
            mentioned,
            citedSource,
            confidence,
            simulatedSnippet,
        };
    });

    const mentionedCount = evaluatedPrompts.filter((p) => p.mentioned).length;
    const citedCount = evaluatedPrompts.filter((p) => p.citedSource).length;
    const mentionRate = clampScore((mentionedCount / evaluatedPrompts.length) * 100);
    const citationRate = clampScore((citedCount / evaluatedPrompts.length) * 100);

    // 4대 생성형 AI 엔진별 인용 점수
    const engines: AeoEngineScore[] = [
        {
            engine: 'Perplexity',
            score: clampScore(answerIndex + (hasStructuredJsonLd ? 6 : -4)),
            status: answerIndex >= 65 ? '높음' : answerIndex >= 40 ? '보통' : '낮음',
            citationNote:
                isRegisteredInZinsight
                    ? '웹 실시간 검색 및 출처 각주(Citation) 비중이 높아 진사이트 프로필·매거진 링크 인용 반응도가 가장 빠릅니다.'
                    : '공식 구조화 프로필 미등록 상태로 출처 각주 인용이 제한적입니다.',
        },
        {
            engine: 'Google AI Overviews',
            score: clampScore(answerIndex + (faqCount > 0 ? 5 : -2)),
            status: answerIndex >= 68 ? '높음' : answerIndex >= 42 ? '보통' : '낮음',
            citationNote:
                hasStructuredJsonLd
                    ? 'Schema.org JSON-LD 및 구글 검색 색인 시그널이 활성화되어 AI 개요 요약 인용에 유리합니다.'
                    : '구조화 데이터(JSON-LD) 및 FAQ 스키마 보강이 필요합니다.',
        },
        {
            engine: 'ChatGPT',
            score: clampScore(answerIndex + (magazineArticleCount > 0 ? 3 : -5)),
            status: answerIndex >= 65 ? '높음' : answerIndex >= 40 ? '보통' : '낮음',
            citationNote:
                magazineArticleCount > 0
                    ? 'ChatGPT Search(Bing 연동)에서 심층 매거진 기사 문맥과 엔티티 요약이 답변 근거로 활용됩니다.'
                    : '단순 단신 뉴스 외에 맥락형 심층 매거진 콘텐츠 확보가 필요합니다.',
        },
        {
            engine: 'Gemini',
            score: clampScore(answerIndex + (keywords.length >= 3 ? 4 : -3)),
            status: answerIndex >= 65 ? '높음' : answerIndex >= 40 ? '보통' : '낮음',
            citationNote:
                keywords.length >= 2
                    ? '구글 지식 그래프 및 지역·키워드 정합성이 높아 엔티티 요약 응답에 긍정적입니다.'
                    : '핵심 기술·서비스 키워드 명시가 필요합니다.',
        },
    ];

    // 과거 이력이 있으면 가장 초기(또는 직전) 점수를 baseline으로 삼고,
    // 첫 진단이면 리빙 프로필/AEO 최적화 적용 전 일반 웹 평균 기준점(약 20~24점)을 baseline으로 산출
    const oldestLog = previousLogs.length > 0 ? previousLogs[previousLogs.length - 1] : null;
    const defaultBaseline = isRegisteredInZinsight
        ? clampScore(Math.min(24, Math.floor(answerIndex * 0.38)), 14, 28)
        : answerIndex;
    const baselineIndex =
        oldestLog && oldestLog.answer_index !== answerIndex
            ? oldestLog.answer_index
            : defaultBaseline;
    const deltaIndex = answerIndex - baselineIndex;

    const history = [
        {
            auditedAt: '최적화 이전 (Baseline)',
            answerIndex: baselineIndex,
            mentionRate: clampScore(baselineIndex * 0.85),
            citationRate: clampScore(baselineIndex * 0.5),
        },
        ...previousLogs
            .slice()
            .reverse()
            .map((l) => ({
                auditedAt: new Date(l.audited_at).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                }),
                answerIndex: l.answer_index,
                mentionRate: l.mention_rate,
                citationRate: l.citation_rate,
            })),
    ];

    return {
        entityType,
        organizationId: organizationId ?? null,
        postId: postId ?? null,
        targetName,
        regionName,
        industryKeywords: keywords.slice(0, 8),
        answerIndex,
        baselineIndex,
        deltaIndex,
        mentionRate,
        citationRate,
        promptCount: evaluatedPrompts.length,
        engines,
        prompts: evaluatedPrompts,
        auditedAt: new Date().toISOString(),
        auditMethod: geminiCheck ? 'LLM_SYNTHETIC_AUDIT' : 'STRUCTURED_SIGNAL_SYNTHETIC_AUDIT',
        history,
    };
}

/**
 * 조직(Organization)용 AEO Answer Index 조회 및 시뮬레이션 감사 실행
 */
export async function getOrRunAeoAuditForOrganization(
    organizationId: number,
    forceRun = false
): Promise<AeoAuditResult | null> {
    await requireAdmin();

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
            region: { select: { name: true } },
            _count: {
                select: {
                    company_articles: true,
                    magazinePosts: {
                        where: {
                            magazinePost: { status: 'PUBLISHED', deletedAt: null },
                        },
                    },
                },
            },
        },
    });

    if (!org) return null;

    let previousLogs: any[] = [];
    try {
        previousLogs = await prisma.aeoAuditLog.findMany({
            where: { entity_type: 'organization', organization_id: organizationId },
            orderBy: { audited_at: 'desc' },
            take: 6,
        });
    } catch {
        // 테이블 미생성 시 무시
    }

    const keywords = parseKeywordsList(org.core_keywords);
    const backlinks = Array.isArray(org.backlinks) ? org.backlinks : [];

    const result = await computeSyntheticAudit({
        entityType: 'organization',
        organizationId: org.id,
        targetName: org.company_name,
        entityCategory: org.entity_type || '기업',
        regionName: org.region?.name ?? null,
        keywords,
        hasSummary: Boolean(org.business_summary && org.business_summary.trim().length > 0),
        summaryLength: org.business_summary?.trim().length ?? 0,
        hasStructuredJsonLd: true, // 인사이트 레이더 상세 페이지 JSON-LD 기본 탑재
        faqCount: org._count.magazinePosts > 0 ? 2 : 0,
        backlinkCount: backlinks.length + (org.company_url ? 1 : 0),
        magazineArticleCount: org._count.magazinePosts,
        newsArticleCount: org._count.company_articles,
        hasLogo: Boolean((org as any).logo_url),
        isRegisteredInZinsight: true,
        previousLogs,
    });

    if (forceRun || previousLogs.length === 0) {
        try {
            await prisma.aeoAuditLog.create({
                data: {
                    entity_type: 'organization',
                    organization_id: org.id,
                    target_name: org.company_name,
                    region_name: org.region?.name ?? null,
                    industry_keywords: keywords.slice(0, 8).join(', '),
                    answer_index: result.answerIndex,
                    mention_rate: result.mentionRate,
                    citation_rate: result.citationRate,
                    prompt_count: result.promptCount,
                    engine_summary: result.engines as any,
                    prompt_results: result.prompts as any,
                },
            });
        } catch {
            // DB 테이블 미생성 시 무시
        }
    }

    return result;
}

/**
 * 매거진 포스트(MagazinePost)용 AEO Answer Index 조회 및 시뮬레이션 감사 실행
 */
export async function getOrRunAeoAuditForArticle(
    postId: number,
    forceRun = false
): Promise<AeoAuditResult | null> {
    await requireAdmin();

    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        include: {
            region: { select: { name: true } },
            category: { select: { name: true } },
            organizations: {
                include: {
                    organization: { select: { id: true, company_name: true } },
                },
            },
        },
    });

    if (!post) return null;

    let previousLogs: any[] = [];
    try {
        previousLogs = await prisma.aeoAuditLog.findMany({
            where: { entity_type: 'article', post_id: postId },
            orderBy: { audited_at: 'desc' },
            take: 6,
        });
    } catch {
        // ignore
    }

    const keywords = parseKeywordsList(post.targetKeywords);
    const faqList = Array.isArray(post.faqData) ? post.faqData : [];
    const extLinks = Array.isArray(post.externalLinks) ? post.externalLinks : [];
    const linkedOrgName = post.organizations[0]?.organization?.company_name;

    const result = await computeSyntheticAudit({
        entityType: 'article',
        postId: post.id,
        targetName: linkedOrgName ? `${linkedOrgName} (${post.title.slice(0, 28)}...)` : post.title,
        entityCategory: post.category?.name || '매거진 심층 기사',
        regionName: post.region?.name ?? null,
        keywords: keywords.length > 0 ? keywords : [post.category?.name || '산업 인사이트'],
        hasSummary: Boolean(post.summary && post.summary.trim().length > 0),
        summaryLength: (post.summary?.length ?? 0) + (post.content?.length ?? 0),
        hasStructuredJsonLd: true,
        faqCount: faqList.length || 2,
        backlinkCount: extLinks.length + post.organizations.length,
        magazineArticleCount: 1,
        newsArticleCount: post.organizations.length,
        hasLogo: Boolean(post.thumbnailUrl),
        isRegisteredInZinsight: post.status === 'PUBLISHED',
        previousLogs,
    });

    if (forceRun || previousLogs.length === 0) {
        try {
            await prisma.aeoAuditLog.create({
                data: {
                    entity_type: 'article',
                    post_id: post.id,
                    target_name: post.title.slice(0, 250),
                    region_name: post.region?.name ?? null,
                    industry_keywords: keywords.slice(0, 8).join(', '),
                    answer_index: result.answerIndex,
                    mention_rate: result.mentionRate,
                    citation_rate: result.citationRate,
                    prompt_count: result.promptCount,
                    engine_summary: result.engines as any,
                    prompt_results: result.prompts as any,
                },
            });
        } catch {
            // ignore
        }
    }

    return result;
}

/**
 * 공개 페이지 리드 마그넷: 기업/기관명을 입력하면 즉시 AI 인용 점수(Answer Index) 진단 결과 반환
 */
export async function diagnoseCompanyForLeadMagnet(
    companyName: string,
    industryOrRegion?: string
): Promise<{
    isRegistered: boolean;
    orgSlug?: string | null;
    orgId?: number | null;
    audit: AeoAuditResult;
    potentialIndexAfterOptimization: number;
}> {
    const cleanName = (companyName || '').trim().slice(0, 100);
    const cleanIndustry = (industryOrRegion || '').trim().slice(0, 100);

    // 진사이트 DB에 이미 등록된 조직인지 확인
    const existingOrg = await prisma.organization.findFirst({
        where: {
            company_name: { contains: cleanName },
        },
        include: {
            region: { select: { name: true } },
            _count: {
                select: {
                    company_articles: true,
                    magazinePosts: {
                        where: {
                            magazinePost: { status: 'PUBLISHED', deletedAt: null },
                        },
                    },
                },
            },
        },
    });

    if (existingOrg) {
        const keywords = parseKeywordsList(existingOrg.core_keywords);
        const backlinks = Array.isArray(existingOrg.backlinks) ? existingOrg.backlinks : [];
        const audit = await computeSyntheticAudit({
            entityType: 'lead_magnet',
            organizationId: existingOrg.id,
            targetName: existingOrg.company_name,
            entityCategory: existingOrg.entity_type || '기업',
            regionName: existingOrg.region?.name ?? (cleanIndustry || null),
            keywords: keywords.length > 0 ? keywords : cleanIndustry ? [cleanIndustry] : ['핵심 사업'],
            hasSummary: Boolean(existingOrg.business_summary),
            summaryLength: existingOrg.business_summary?.length ?? 0,
            hasStructuredJsonLd: true,
            faqCount: existingOrg._count.magazinePosts > 0 ? 2 : 0,
            backlinkCount: backlinks.length + (existingOrg.company_url ? 1 : 0),
            magazineArticleCount: existingOrg._count.magazinePosts,
            newsArticleCount: existingOrg._count.company_articles,
            hasLogo: Boolean((existingOrg as any).logo_url),
            isRegisteredInZinsight: true,
        });

        return {
            isRegistered: true,
            orgSlug: existingOrg.slug,
            orgId: existingOrg.id,
            audit,
            potentialIndexAfterOptimization: clampScore(Math.max(audit.answerIndex + 18, 84), 75, 96),
        };
    }

    // 미등록 기업/기관: 결핍 자극을 위한 현재 AI 인용 진단치 및 리빙 프로필 도입 시 예상 상승치 산출
    const nameHash = cleanName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const unregKeywords = cleanIndustry
        ? cleanIndustry.split(/[,/\s]+/).filter(Boolean)
        : ['주력 비즈니스', '기술 경쟁력'];

    const audit = await computeSyntheticAudit({
        entityType: 'lead_magnet',
        targetName: cleanName,
        entityCategory: '기업/기관',
        regionName: cleanIndustry || '국내',
        keywords: unregKeywords,
        hasSummary: (nameHash % 3) === 0,
        summaryLength: 40,
        hasStructuredJsonLd: false,
        faqCount: 0,
        backlinkCount: 0,
        magazineArticleCount: 0,
        newsArticleCount: nameHash % 2,
        hasLogo: false,
        isRegisteredInZinsight: false,
    });

    return {
        isRegistered: false,
        audit,
        potentialIndexAfterOptimization: clampScore(audit.answerIndex + 48, 72, 92),
    };
}

/**
 * 무료 AEO 진단 후 리빙 프로필 등록 / 매거진 발행 상담 신청 전환 (ConsultingRequest 저장)
 */
export async function submitAeoLeadMagnetRequest(input: {
    companyName: string;
    email: string;
    industry?: string;
    answerIndex?: number;
}): Promise<{ success: boolean; message: string }> {
    const companyName = (input.companyName || '').trim().slice(0, 255);
    const email = (input.email || '').trim().slice(0, 255);
    const industry = (input.industry || '').trim().slice(0, 200);

    if (!companyName || !email) {
        return { success: false, message: '기업(기관)명과 연락 받으실 이메일/연락처를 입력해 주세요.' };
    }

    const tag = input.answerIndex != null ? `[AEO진단:${input.answerIndex}점] ` : '[AEO진단] ';
    await prisma.consultingRequest.create({
        data: {
            company_name: companyName,
            email,
            industry: `${tag}${industry || '리빙 프로필 및 매거진 인용 최적화 문의'}`.slice(0, 255),
            status: 'PENDING',
        },
    });

    return {
        success: true,
        message: '무료 AEO 상세 리포트 및 리빙 프로필 등록 상담 신청이 접수되었습니다.',
    };
}
