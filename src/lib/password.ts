import crypto from 'crypto';

// OWASP 권장 PBKDF2-SHA512 반복 횟수. 저장 형식에 반복 횟수를 함께 기록해 이후 상향도 가능.
const PBKDF2_ITERATIONS = 210_000;
const PREFIX = 'pbkdf2_sha512';
// 초기 버전 형식("salt:hash", 1000회)과의 호환용
const LEGACY_ITERATIONS = 1000;

function derive(password: string, salt: string, iterations: number): string {
    return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function safeEqualHex(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    return ab.length === bb.length && ab.length > 0 && crypto.timingSafeEqual(ab, bb);
}

/**
 * Hashes a password using Node's native PBKDF2 algorithm.
 * Returns a string formatted as "pbkdf2_sha512$iterations$salt$hash".
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    return `${PREFIX}$${PBKDF2_ITERATIONS}$${salt}$${derive(password, salt, PBKDF2_ITERATIONS)}`;
}

/**
 * Verifies a password against a stored hash (current or legacy "salt:hash" format).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
    if (storedHash.startsWith(`${PREFIX}$`)) {
        const [, iter, salt, hash] = storedHash.split('$');
        const iterations = Number(iter);
        if (!salt || !hash || !Number.isInteger(iterations) || iterations <= 0) return false;
        return safeEqualHex(derive(password, salt, iterations), hash);
    }
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    return safeEqualHex(derive(password, salt, LEGACY_ITERATIONS), hash);
}

/**
 * 저장된 해시가 현재 기준보다 약하면 true. 로그인 성공 직후 재해시해 점진적으로 강화.
 */
export function needsRehash(storedHash: string): boolean {
    if (!storedHash.startsWith(`${PREFIX}$`)) return true;
    return Number(storedHash.split('$')[1]) < PBKDF2_ITERATIONS;
}
