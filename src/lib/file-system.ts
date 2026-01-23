import fs from 'fs/promises';
import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const PARSED_DIR = path.join(DATA_DIR, 'parsed');
export const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');

// Ensure directories exist
export async function ensureDataDirs() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(RAW_DIR, { recursive: true });
    await fs.mkdir(PARSED_DIR, { recursive: true });
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    await fs.mkdir(LOGS_DIR, { recursive: true });
}

export async function saveJsonFile(filePath: string, data: any) {
    await ensureDataDirs();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content) as T;
    } catch (error) {
        return null; // Return null if file not found or error
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
