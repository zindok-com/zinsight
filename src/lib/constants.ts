import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const PARSED_DIR = path.join(DATA_DIR, 'parsed');
export const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');
