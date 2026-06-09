import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function createPrismaClient() {
    let host = process.env.DB_HOST ?? 'localhost';
    let port = Number(process.env.DB_PORT ?? 3306);
    let user = process.env.DB_USER ?? 'root';
    let password = process.env.DB_PASSWORD ?? '';
    let database = process.env.DB_NAME ?? 'zinsight';

    if (process.env.DATABASE_URL) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            host = url.hostname || host;
            port = url.port ? Number(url.port) : port;
            user = url.username ? decodeURIComponent(url.username) : user;
            password = url.password ? decodeURIComponent(url.password) : password;
            database = url.pathname ? url.pathname.replace(/^\//, '') : database;
        } catch (error) {
            console.error('Failed to parse DATABASE_URL in db.ts:', error);
        }
    }

    const adapter = new PrismaMariaDb({
        host,
        port,
        user,
        password,
        database,
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
