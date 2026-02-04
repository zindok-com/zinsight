import fs from 'fs';
import path from 'path';
import { LOGS_DIR } from './constants';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private static instance: Logger;
    private logFilePath: string | null = null;

    private constructor() {
        // Initialize log file path with today's date
        this.updateLogFile();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private updateLogFile() {
        try {
            if (!fs.existsSync(LOGS_DIR)) {
                fs.mkdirSync(LOGS_DIR, { recursive: true });
            }
            const date = new Date().toISOString().split('T')[0];
            this.logFilePath = path.join(LOGS_DIR, `system-${date}.log`);
        } catch (error) {
            console.error('Failed to initialize logger directory:', error);
            this.logFilePath = null;
        }
    }

    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const extra = args.length > 0 ? '\n' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join('\n') : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${extra}\n`;
    }

    private writeToFile(formattedMessage: string) {
        if (!this.logFilePath) return;

        try {
            fs.appendFileSync(this.logFilePath, formattedMessage, 'utf-8');
        } catch (error) {
            // If file writing fails, we just fall back to console to avoid crashing
            console.error('Failed to write to log file:', error);
        }
    }

    public info(message: string, ...args: any[]) {
        const formatted = this.formatMessage('info', message, ...args);
        console.log(`\x1b[32m[INFO]\x1b[0m ${message}`, ...args);
        this.writeToFile(formatted);
    }

    public warn(message: string, ...args: any[]) {
        const formatted = this.formatMessage('warn', message, ...args);
        console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, ...args);
        this.writeToFile(formatted);
    }

    public error(message: string, ...args: any[]) {
        const formatted = this.formatMessage('error', message, ...args);
        console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
        this.writeToFile(formatted);
    }

    public debug(message: string, ...args: any[]) {
        if (process.env.NODE_ENV !== 'production') {
            const formatted = this.formatMessage('debug', message, ...args);
            console.debug(`\x1b[36m[DEBUG]\x1b[0m ${message}`, ...args);
            this.writeToFile(formatted);
        }
    }
}

export const logger = Logger.getInstance();
