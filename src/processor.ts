import { NaverNewsItem } from './collector';
import { Company, CompanyNews, Category } from './types';
import { CONFIG } from './config';

const generateId = () => Math.random().toString(36).substring(2, 9);

export class DataProcessor {

    private cleanText(text: string): string {
        return text.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }

    // Phase 2: "Candidate String" Extraction (Loose Matching)
    // Capture subject markers: 은, 는, 이, 가, 사, 기업, 업체
    // Strategy: Look for the noun phrase immediately preceding a subject marker at the start of the title or description.
    private extractCandidateString(text: string): string {
        let clean = this.cleanText(text);
        clean = clean.replace(/^\[.*?\]\s*/, ''); // Remove header tags like [News]

        // Regex to find potential company names ending with subject markers
        // Match: (Word)+(Subject Marker)
        // Markers: 은/는/이/가/사/업체/기업 등
        // Limit the candidate length to avoid capturing long sentences (e.g., 2-15 chars)
        const subjectRegex = /([가-힣a-zA-Z0-9\s&]{2,15})(?:은|는|이|가|사|업체|기업)\s/;

        const match = clean.match(subjectRegex);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback: If title starts with "OOO, ..."
        const commaSplit = clean.split(',');
        if (commaSplit.length > 1 && commaSplit[0] && commaSplit[0].length < 15) {
            return commaSplit[0].trim();
        }

        return "Unknown";
    }

    private determineEntityType(text: string, searchKeyword: string): string {
        // 1. Default based on Search Query
        let type = 'Other';
        if (searchKeyword.includes('중소기업')) type = 'SME';
        else if (searchKeyword.includes('공공기관')) type = 'Public';

        // 2. Refine based on Article Content
        if (text.includes('협회') || text.includes('조합')) return 'Association';
        if (text.includes('연구원') || text.includes('진흥원') || text.includes('센터')) return 'Public';
        if (text.includes('대기업') || text.includes('계열사')) return 'Large';
        if (text.includes('스타트업') || text.includes('벤처')) return 'SME';

        return type;
    }

    private determinePrimaryCategory(text: string): string {
        const t = text.toLowerCase();
        if (t.includes('oled') || t.includes('유기발광')) return 'OLED';
        if (t.includes('smart') || t.includes('스마트') || t.includes('제어')) return 'Smart Lighting';
        if (t.includes('iot') || t.includes('사물인터넷') || t.includes('통신')) return 'IoT';
        if (t.includes('융합') || t.includes('복합')) return 'Convergence';

        return 'Other';
    }

    private extractKeywords(text: string): string[] {
        // Extract tech keywords + business keywords
        const targetWords = ['LED', 'OLED', 'IoT', 'AI', '센서', '드라이버', '렌즈', '모듈', '디스플레이', '사이니지', '플랫폼', '관제', '시스템', '검사', '장비'];
        const found = targetWords.filter(word => text.includes(word) || text.toLowerCase().includes(word.toLowerCase()));
        return [...new Set(found)];
    }

    // Phase 2: Exhibition Suitability Scoring (Kept for compatibility)
    private calculateExhibitionScore(text: string): number {
        let score = 0;
        const lowerText = text.toLowerCase();

        // Check for validation keywords (Exhibition related)
        CONFIG.VALIDATION_KEYWORDS.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                score += 10; // High value for direct exhibition intent
            }
        });

        // Check for role clarity keywords (development, supply, launch)
        const roleKeywords = ['개발', '출시', '공급', '공개', '선보여', '개최'];
        roleKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                score += 2;
            }
        });

        return score;
    }

    public processItem(item: NaverNewsItem, categoryId: string, searchKeyword: string): { company: Company, news: CompanyNews } {
        const rawTitle = item.title;
        const rawDesc = item.description;

        const cleanBoxTitle = this.cleanText(rawTitle);
        const cleanBoxDesc = this.cleanText(rawDesc);
        const combinedText = cleanBoxTitle + " " + cleanBoxDesc;

        // Extract Candidate String instead of strict Company Name
        const candidateName = this.extractCandidateString(cleanBoxTitle);

        // New Entity Logic
        const entityType = this.determineEntityType(combinedText, searchKeyword);
        const primaryCategory = this.determinePrimaryCategory(combinedText);
        const keywords = this.extractKeywords(combinedText);

        // Calculate Score
        const exScore = this.calculateExhibitionScore(combinedText);

        const companyId = generateId();
        const newsId = generateId();

        // Infer Tags
        const tags: string[] = [];
        tags.push(...keywords);
        if (exScore > 5) tags.push("Exhibition_Potential");
        tags.push(primaryCategory);
        tags.push(entityType);

        // Dedup tags
        const uniqueTags = [...new Set(tags)];

        const company: Company = {
            id: companyId,
            name: candidateName,

            // New Fields
            entity_type: entityType,
            primary_category: primaryCategory,
            category_tags: uniqueTags,
            keywords: keywords,
            source_query: searchKeyword,
            source_articles: [newsId],

            // Legacy
            category_id: categoryId,
            company_size: entityType, // Map type to size slot for legacy
            focus_area: keywords.join(', '),
            description: cleanBoxDesc.substring(0, 100) + "...",
            exhibition_score: exScore,
            tags: uniqueTags,

            created_at: new Date()
        };

        const news: CompanyNews = {
            id: newsId,
            company_id: companyId,
            title: cleanBoxTitle,
            summary: cleanBoxDesc,
            publication_date: item.pubDate,
            source_url: item.originallink || item.link,
            raw_json: item,
            created_at: new Date()
        };

        return { company, news };
    }
}
