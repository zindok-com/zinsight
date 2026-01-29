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
            const jsonData = JSON.parse(text);

            // Handle Golden Set Schema
            if (jsonData.schema === 'MICE_SCOUT_PARSED_ENTITY_V1') {
                data = jsonData.parsed_entities || [];
            } else if (Array.isArray(jsonData)) {
                data = jsonData;
            } else {
                data = [jsonData];
            }
        } else {
            return { success: false, error: 'Unsupported format' };
        }

        // Map to Company type
        const mappedEntities: Company[] = data.map((row: any, index) => {
            // Check if it's Golden Set format or generic
            const isGoldenSet = !!row.entity_id;

            const name = isGoldenSet ? row.entity_name : (row['Name'] || row['name'] || row['Company'] || `Unknown-${index}`);

            return {
                id: row.entity_id || row.id || `new-${Date.now()}-${index}`,
                name: name,
                entity_name_display: row.entity_name || name,
                review_status: isGoldenSet
                    ? (row.review_status === 'REJECTED' ? 'REJECTED' : 'GOLDENSET_CONFIRMED')
                    : (row.review_status || 'NEEDS_REVIEW'),
                entity_aliases: row.name_variants || [name],
                entity_type: 'COMPANY',
                market_target: 'BOTH',
                exhibition_participation_type: row.exhibition_participation_type || 'UNKNOWN',
                signals: isGoldenSet ? {
                    led: !!row.signals?.led,
                    certification: !!row.signals?.certification,
                    procurement: !!row.signals?.procurement,
                    product_launch: !!row.signals?.product_launch,
                    award: !!row.signals?.award,
                    exhibition: !!row.signals?.exhibition,
                    smart: !!row.signals?.smart
                } : {
                    led: false,
                    certification: false,
                    procurement: false,
                    product_launch: false,
                    award: false,
                    exhibition: false,
                    smart: false
                },
                fit_score: row.fitness_score || row.fit_score || 0,
                recommendation_reason: isGoldenSet ? 'Golden Set Import' : '',
                candidate_status: isGoldenSet ? 'CONFIRMED' : 'PENDING',
                category_tags: [],
                keyword_counts: {},
                keywords: [],
                source_articles: (row.evidence_articles || []).map((art: any) => ({
                    article_id: art.article_id,
                    title: art.title,
                    publication_date: art.publication_date,
                    source_url: art.source_url,
                    match_confidence: 100,
                    match_method: 'RULE'
                })),
                source_query: row.source_query || 'import',
                description: row.description || '',
                focus_area: '',
                exhibition_score: row.fitness_score || 0,
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
