'use server';

import { DataService } from '@/services/data-service';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { EXPORTS_DIR } from '@/lib/file-system';
import { Company } from '@/types';

interface ExportOptions {
    format: 'xlsx' | 'csv' | 'json';
    statusFilter?: string[];
    minScore?: number;
}

export async function generateExport(options: ExportOptions) {
    const service = DataService.getInstance();
    let entities = await service.getEntities();

    // Filter
    if (options.statusFilter && options.statusFilter.length > 0) {
        entities = entities.filter(e => options.statusFilter?.includes(e.review_status));
    }
    if (options.minScore) {
        entities = entities.filter(e => e.fit_score >= (options.minScore || 0));
    }

    // Flatten for export
    const exportData = entities.map(e => ({
        ID: e.id,
        Name: e.entity_name_display,
        NormalizedName: e.normalized_name,
        Status: e.review_status,
        Score: e.fit_score,
        Category: e.primary_category,
        ParticipationType: e.exhibition_participation_type,
        Signals: Object.entries(e.signals).filter(([k, v]) => v).map(([k]) => k).join(', '),
        Keywords: e.keywords.slice(0, 5).join(', '),
        ReviewNotes: e.review_notes || '',
    }));

    // Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Entities");

    // File name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export_${timestamp}.${options.format}`;
    const filePath = path.join(EXPORTS_DIR, filename);

    // Write file
    if (options.format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        await fs.writeFile(filePath, csv);
    } else if (options.format === 'json') {
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    } else {
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        await fs.writeFile(filePath, buffer);
    }

    return { success: true, filename, filePath }; // filePath shouldn't be exposed usually but strictly internal tool
}
