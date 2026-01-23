'use server';

import { DataService } from '@/services/data-service';
import { Company, ReviewStatus } from '@/types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { revalidatePath } from 'next/cache';

export async function parseAndImportFile(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    try {
        const buffer = await file.arrayBuffer();
        let data: any[] = [];

        if (file.name.endsWith('.csv')) {
            const text = new TextDecoder().decode(buffer);
            const result = Papa.parse(text, { header: true, skipEmptyLines: true });
            data = result.data;
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const wb = XLSX.read(buffer, { type: 'buffer' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            data = XLSX.utils.sheet_to_json(ws);
        } else if (file.name.endsWith('.json')) {
            const text = new TextDecoder().decode(buffer);
            data = JSON.parse(text);
        } else {
            return { success: false, error: 'Unsupported format' };
        }

        // Map to Company type (Simple mapping for MVP)
        // In a real app, we would have a mapping step in UI passing the mapping config
        const mappedEntities: Company[] = data.map((row: any, index) => {
            // Basic auto-mapping
            const name = row['Name'] || row['name'] || row['Company'] || `Unknown-${index}`;
            const normalized = row['NormalizedName'] || row['normalized_name'] || name;

            return {
                id: row['ID'] || row['id'] || `new-${Date.now()}-${index}`,
                name: name,
                entity_name_display: row['EntityNameDisplay'] || name,
                normalized_name: normalized,
                review_status: (row['Status'] as ReviewStatus) || 'NEEDS_REVIEW',

                // Defaults
                entity_aliases: [name],
                entity_type: 'COMPANY',
                company_scale: 'SME',
                market_target: 'BOTH',
                exhibition_participation_type: 'UNKNOWN',
                primary_category: 'OTHER',
                signals: {
                    product_launch: false,
                    manufacturing: false,
                    certification: false,
                    government_support: false,
                    procurement_ready: false
                },
                fit_score: 0,
                recommendation_reason: '',
                candidate_status: 'PENDING',
                category_tags: [],
                keyword_counts: {},
                keywords: [],
                source_articles: [],
                source_query: 'import',
                description: '',
                focus_area: '',
                exhibition_score: 0,
                tags: [],
                created_at: new Date().toISOString()
            } as Company;
        });

        // Upsert logic
        const service = DataService.getInstance();
        const currentEntities = await service.getEntities();

        let updatedEntities = [...currentEntities];
        for (const entity of mappedEntities) {
            updatedEntities = await service.upsertCompany(entity, updatedEntities);
        }

        await service.saveEntities(updatedEntities);

        revalidatePath('/entities');
        revalidatePath('/');

        return { success: true, count: mappedEntities.length };
    } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: 'Failed to process file' };
    }
}
