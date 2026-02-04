import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { DATA_DIR, RAW_DIR, PARSED_DIR, EXPORTS_DIR, LOGS_DIR } from './constants';

export { DATA_DIR, RAW_DIR, PARSED_DIR, EXPORTS_DIR, LOGS_DIR };

// Ensure directories exist
export async function ensureDataDirs() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(RAW_DIR, { recursive: true });
        await fs.mkdir(PARSED_DIR, { recursive: true });
        await fs.mkdir(EXPORTS_DIR, { recursive: true });
        await fs.mkdir(LOGS_DIR, { recursive: true });
    } catch (error) {
        logger.error('Failed to create data directories:', error);
    }
}

export async function saveJsonFile(filePath: string, data: any) {
    try {
        await ensureDataDirs();
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        logger.debug(`Successfully saved JSON file: ${filePath}`);
    } catch (error) {
        logger.error(`Failed to save JSON file: ${filePath}`, error);
        throw error; // Re-throw to let caller handle if needed
    }
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content) as T;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            logger.warn(`File not found: ${filePath}`);
        } else {
            logger.error(`Error reading JSON file: ${filePath}`, error);
        }
        return null;
    }
}

export async function listFiles(dirPath: string): Promise<string[]> {
    try {
        return await fs.readdir(dirPath);
    } catch (error) {
        return [];
    }
}

export async function getFileStats(filePath: string) {
    try {
        return await fs.stat(filePath);
    } catch (error) {
        return null;
    }
}
