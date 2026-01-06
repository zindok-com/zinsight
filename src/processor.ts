import { NaverNewsItem } from './collector';
import { Company, CompanyNews, Category } from './types';
// Removed unused uuid import

const generateId = () => Math.random().toString(36).substring(2, 9);

export class DataProcessor {

    // Basic text cleaning (HTML tags removal)
    private cleanText(text: string): string {
        return text.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }

    // Heuristic to extract company name from title
    // Example: "Samsung, new LED released" -> "Samsung"
    // Example: "[Exclusive] LG Display..." -> "LG Display"
    private extractCompanyName(title: string): string {
        let clean = this.cleanText(title);

        // Remove common prefixes like [News], [Photo], etc.
        clean = clean.replace(/^\[.*?\]\s*/, '');

        // Split by common separators used in news titles (comma, quote, colon, verbs)
        // This is a naive implementation for PoC
        const separators = [',', ':', '"', "'", ' '];
        // Heuristic: The first word or two before a verb or separator is often the company.
        // For this PoC, we will check known patterns or just take the first meaningful noun phrase.
        // Simplifying: Take the first word if it looks like a proper noun, or first 2 words if they look connected.

        // Let's try splitting by space and taking the first token, or first two if the second is not a verb.
        // A better approach for Korean news: Look for subject markers (은/는/이/가 - hard without NLP lib)
        // or just split by special chars.

        const parts = clean.split(/,|\s|:|’|“/);
        if (parts.length > 0) {
            // Very basic: just return the first token for now, or the first two tokens combined.
            // Refinement: if the first token is very short, take two.
            const first = parts[0];
            // Check if first exists and is a string (strict null check)
            if (first && first.length < 2 && parts.length > 1) {
                return first + ' ' + (parts[1] || '');
            }
            return first || "Unknown";
        }
        return "Unknown";
    }

    private extractTechKeywords(text: string): string {
        const keywords = ['LED', 'OLED', 'MicroLED', 'UV', 'Smart Lighting', 'IoT', 'AI', 'Sensor', 'Display', 'Chip'];
        const found = keywords.filter(k => text.includes(k) || text.toLowerCase().includes(k.toLowerCase()));
        return [...new Set(found)].join(', ');
    }

    // Convert raw news item to Company and CompanyNews entities
    public processItem(item: NaverNewsItem, categoryId: string, sizeKeyword: string): { company: Company, news: CompanyNews } {
        const rawTitle = item.title;
        const rawDesc = item.description;

        const cleanBoxTitle = this.cleanText(rawTitle);
        const cleanBoxDesc = this.cleanText(rawDesc);

        const companyName = this.extractCompanyName(cleanBoxTitle);
        const techKeywords = this.extractTechKeywords(cleanBoxTitle + " " + cleanBoxDesc);

        const companyId = generateId(); // In reality, we would check if company exists first.

        // Map size keyword to enum-like string
        let size = "기타";
        if (sizeKeyword.includes("중소기업")) size = "중소기업";
        else if (sizeKeyword.includes("강소기업")) size = "강소기업";
        else if (sizeKeyword.includes("벤처기업")) size = "벤처기업";

        const company: Company = {
            id: companyId,
            name: companyName, // This will be deduplicated in the Store or Orchestrator
            category_id: categoryId,
            company_size: size,
            focus_area: techKeywords,
            description: cleanBoxDesc.substring(0, 100) + "...", // Short summary
            created_at: new Date()
        };

        const news: CompanyNews = {
            id: generateId(),
            company_id: companyId, // Link to company
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
