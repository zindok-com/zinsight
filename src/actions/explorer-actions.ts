'use server';

import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR, RAW_DIR, PARSED_DIR, EXPORTS_DIR, LOGS_DIR } from '@/lib/file-system';

export type FileSystemItem = {
    name: string;
    path: string; // relative to DATA_DIR
    type: 'FILE' | 'DIRECTORY';
    size: number;
    modifiedAt: string;
};

const SAFE_DIRS = [
    DATA_DIR,
    RAW_DIR,
    PARSED_DIR,
    EXPORTS_DIR,
    LOGS_DIR
];

export async function listDataFiles(relativePath: string = ''): Promise<FileSystemItem[]> {
    try {
        const targetPath = path.join(DATA_DIR, relativePath);

        // Security check: ensure targetPath is within DATA_DIR
        const resolvedPath = path.resolve(targetPath);
        if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
            throw new Error("Access denied");
        }

        const entries = await fs.readdir(targetPath, { withFileTypes: true });

        const items: FileSystemItem[] = await Promise.all(entries.map(async (entry) => {
            const fullPath = path.join(targetPath, entry.name);
            const stats = await fs.stat(fullPath);

            return {
                name: entry.name,
                path: path.relative(DATA_DIR, fullPath).replace(/\\/g, '/'),
                type: entry.isDirectory() ? 'DIRECTORY' : 'FILE',
                size: stats.size,
                modifiedAt: stats.mtime.toISOString()
            };
        }));

        // Sort folders first
        items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'DIRECTORY' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return items;
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
}
