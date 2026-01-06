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

    private extractTechKeywords(text: string): string {
        const keywords = ['LED', 'OLED', 'MicroLED', 'UV', 'Smart Lighting', 'IoT', 'AI', 'Sensor', 'Display', 'Chip', 'Lighting', 'Driver', 'Lens'];
        const found = keywords.filter(k => text.includes(k) || text.toLowerCase().includes(k.toLowerCase()));
        return [...new Set(found)].join(', ');
    }

    // Phase 2: Exhibition Suitability Scoring
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

        // Extract Candidate String instead of strict Company Name
        const candidateName = this.extractCandidateString(cleanBoxTitle);
        const techKeywords = this.extractTechKeywords(cleanBoxTitle + " " + cleanBoxDesc);

        // Calculate Score
        const combinedText = cleanBoxTitle + " " + cleanBoxDesc;
        const exScore = this.calculateExhibitionScore(combinedText);

        const companyId = generateId();

        // Infre Tags
        const tags: string[] = [];
        if (techKeywords) tags.push(...techKeywords.split(', '));
        if (exScore > 5) tags.push("Exhibition_Potential");
        if (searchKeyword) tags.push(searchKeyword); // Add the search query as a tag context

        const company: Company = {
            id: companyId,
            name: candidateName,
            category_id: categoryId,
            company_size: "Unknown", // No longer inferring size strictly from keyword
            focus_area: techKeywords,
            description: cleanBoxDesc.substring(0, 100) + "...",
            exhibition_score: exScore,
            tags: tags,
            created_at: new Date()
        };

        const news: CompanyNews = {
            id: generateId(),
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
