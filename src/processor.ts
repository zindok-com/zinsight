import { NaverNewsItem } from './collector';
import {
    Company, CompanyNews,
    EntityType, CompanyScale, MarketTarget, ExhibitionParticipationType, PrimaryCategory, CandidateStatus, Signals
} from './types';
import { CONFIG } from './config';

const generateId = () => Math.random().toString(36).substring(2, 9);

export class DataProcessor {

    private cleanText(text: string): string {
        return text.replace(/<[^>]*>?/gm, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    // 2.2 Candidate Name Extraction
    private extractCandidateName(text: string): string {
        let clean = this.cleanText(text);
        clean = clean.replace(/^\[.*?\]\s*/, '');

        // Identifiers from spec: ㈜, 주식회사, 공사, 공단, 협회, 테크노파크 + generic (사, 기업, 업체)
        // Regex to capture noun phrase before these markers
        const pattern = /([가-힣a-zA-Z0-9\s&]{2,15})(?:은|는|이|가|사|업체|기업|㈜|주식회사|공사|공단|협회|테크노파크)\s/;

        const match = clean.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback: Comma split
        const commaSplit = clean.split(',');
        if (commaSplit.length > 1 && commaSplit[0] && commaSplit[0].length < 15) {
            return commaSplit[0].trim();
        }

        return "Unknown";
    }

    // 2.3 Entity Type & Scale
    private determineEntityProfile(name: string, text: string, searchKeyword: string): { type: EntityType, scale: CompanyScale } {
        let type: EntityType = 'COMPANY';
        let scale: CompanyScale = 'OTHER';

        // 1. Keyword based (Search Query)
        if (searchKeyword.includes('중소기업')) scale = 'SME';
        if (searchKeyword.includes('공공기관')) { type = 'INSTITUTION'; scale = 'PUBLIC'; }

        // 2. Content based
        if (name.includes('협회') || name.includes('조합') || text.includes('협회')) type = 'ASSOCIATION';
        if (name.includes('연구원') || name.includes('진흥원') || name.includes('센터') || name.includes('테크노파크')) { type = 'INSTITUTION'; scale = 'PUBLIC'; }

        if (text.includes('대기업') || text.includes('계열사')) scale = 'LARGE';
        if (text.includes('스타트업') || text.includes('벤처')) scale = 'SME';

        return { type, scale };
    }

    // 2.4 Primary Category
    private determineCategory(text: string): { primary: PrimaryCategory, tags: string[] } {
        const t = text.toLowerCase();
        let primary: PrimaryCategory = 'OTHER';
        const tags: string[] = [];

        // Rules
        // LED + 조명 -> LIGHTING
        // 스마트, 제어, 센서 -> SMART_LIGHTING / IOT
        // OLED -> OLED
        // LED + 웨어러블/디바이스 -> CONVERGENCE

        if (t.includes('oled') || t.includes('마이크로led') || t.includes('유기발광')) {
            primary = 'OLED';
        } else if ((t.includes('led') && t.includes('조명'))) {
            if (t.includes('스마트') || t.includes('제어') || t.includes('센서') || t.includes('플랫폼')) {
                primary = 'SMART_LIGHTING';
            } else {
                primary = 'LIGHTING';
            }
        } else if (t.includes('iot') || t.includes('사물인터넷')) {
            primary = 'IOT';
        } else if (t.includes('융합') || t.includes('복합') || (t.includes('led') && (t.includes('웨어러블') || t.includes('디바이스')))) {
            primary = 'CONVERGENCE';
        }

        return { primary, tags };
    }

    // Signals Analysis
    private analyzeSignals(text: string): Signals {
        const t = text.toLowerCase();
        return {
            product_launch: /출시|신제품|공개|첫 선|론칭|선보여|상용화|개발 완료/.test(t),
            manufacturing: /led 등기구|양산|생산라인|제조|안전 인증|전자파 인증|kc|고효율 인증/.test(t),
            certification: /인증|kc|규격/.test(t),
            government_support: /제조혁신 바우처|스마트공장|정부 바우처|지원사업/.test(t),
            procurement_ready: /조달|납품|공공|실증|규격 대응/.test(t)
        };
    }

    // Keyword Extraction
    private extractKeywords(text: string): string[] {
        const targetWords = ['LED', 'OLED', 'IoT', 'AI', '센서', '드라이버', '렌즈', '모듈', '디스플레이', '사이니지', '플랫폼', '관제', '시스템', '검사', '장비']; // From Spec 2.5
        // Penalize/Remove: Policy, Person, Event names (Not implemented strictly, but purely tech keywords are kept)

        return targetWords.filter(word => text.toLowerCase().includes(word.toLowerCase()));
    }

    public processItem(item: NaverNewsItem, categoryId: string, searchKeyword: string): { company: Company, news: CompanyNews } {
        const cleanTitle = this.cleanText(item.title);
        const cleanDesc = this.cleanText(item.description);
        const combinedText = cleanTitle + " " + cleanDesc;

        const candidateName = this.extractCandidateName(cleanTitle);

        const { type: entityType, scale: companyScale } = this.determineEntityProfile(candidateName, combinedText, searchKeyword);
        const { primary, tags } = this.determineCategory(combinedText);
        const signals = this.analyzeSignals(combinedText);
        const keywords = this.extractKeywords(combinedText);

        // Determine Market Target
        let marketTarget: MarketTarget = 'PRIVATE';
        if (signals.procurement_ready || companyScale === 'PUBLIC') marketTarget = 'PUBLIC';
        // Note: 'BOTH' logic would require more context, defaulting to PRIVATE or PUBLIC based on signal

        // Determine Exhibition Participation Type
        let participationType: ExhibitionParticipationType = 'UNKNOWN';
        if (signals.product_launch) participationType = 'PRODUCT_LAUNCH';
        else if (signals.manufacturing) participationType = 'MANUFACTURING_READY';
        else if (signals.procurement_ready) entityType === 'COMPANY' ? participationType = 'SOLUTION_PARTNER' : null;

        if (participationType === 'UNKNOWN' && (signals.product_launch || signals.manufacturing)) {
            participationType = 'MIXED'; // Simplification
        }

        // Determine Status & Recommendation Reason
        let status: CandidateStatus = 'EXCLUDED';
        let reason = '';
        let score = 0;

        if (entityType === 'COMPANY') {
            if (participationType === 'PRODUCT_LAUNCH') {
                status = 'CONFIRMED';
                reason = '신제품/기술 출시 정황(Product Launch) 포착';
                score = 80;
            } else if (participationType === 'MANUFACTURING_READY') {
                status = 'CONFIRMED';
                reason = '제조/양산 인프라 및 인증(Manufacturing) 보유';
                score = 70;
            } else if (participationType === 'SOLUTION_PARTNER') {
                status = 'PENDING'; // Spec doesn't explicitly confirm partner, but maybe pending
                reason = '조달/솔루션 파트너 가능성';
                score = 50;
            } else {
                status = 'PENDING';
                reason = '전시 참가 시그널 미약, 지속 관찰 필요';
                score = 30;
            }
        } else {
            status = 'EXCLUDED';
            reason = '비기업(단순 홍보/기관/협회)';
        }

        // Spec: "Exhibition Participation Type" -> mandatory in output
        if (participationType === 'UNKNOWN') participationType = 'MIXED'; // Default for safety if pending

        const companyId = generateId();
        const newsId = generateId();

        const keywordCounts: Record<string, number> = {};
        keywords.forEach(k => keywordCounts[k] = 1);

        const company: Company = {
            id: companyId,
            name: candidateName,
            entity_type: entityType,
            company_scale: companyScale,
            market_target: marketTarget,
            exhibition_participation_type: participationType,
            primary_category: primary,
            signals: signals,
            fit_score: score,
            recommendation_reason: reason,
            candidate_status: status,
            category_tags: [...tags, ...keywords],
            keyword_counts: keywordCounts,
            keywords: keywords,
            description: cleanDesc,
            source_query: searchKeyword,
            source_articles: [newsId],
            focus_area: keywords.join(', '),
            exhibition_score: score,
            tags: tags,
            created_at: new Date()
        };

        const news: CompanyNews = {
            id: newsId,
            company_id: companyId,
            title: cleanTitle,
            summary: cleanDesc,
            publication_date: item.pubDate,
            source_url: item.originallink || item.link,
            raw_json: item,
            created_at: new Date()
        };

        return { company, news };
    }
}
