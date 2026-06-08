import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Buffer.
 */
export function decodeBase32(base32: string): Buffer {
    const cleaned = base32.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
    let bits = '';
    for (let i = 0; i < cleaned.length; i++) {
        const val = ALPHABET.indexOf(cleaned[i]);
        if (val === -1) {
            throw new Error(`Invalid base32 character: ${cleaned[i]}`);
        }
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        if (i + 8 <= bits.length) {
            bytes.push(parseInt(bits.slice(i, i + 8), 2));
        }
    }
    return Buffer.from(bytes);
}

/**
 * Encodes a Buffer into a Base32 string.
 */
export function encodeBase32(buffer: Buffer): string {
    let bits = '';
    for (let i = 0; i < buffer.length; i++) {
        bits += buffer[i].toString(2).padStart(8, '0');
    }
    let encoded = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5);
        if (chunk.length < 5) {
            const padded = chunk.padEnd(5, '0');
            encoded += ALPHABET[parseInt(padded, 2)];
        } else {
            encoded += ALPHABET[parseInt(chunk, 2)];
        }
    }
    return encoded;
}

/**
 * Generates a 16-character base32 secret.
 */
export function generateSecret(length = 16): string {
    const randomBytes = crypto.randomBytes(length);
    const secretBuffer = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
        secretBuffer[i] = randomBytes[i] % 256;
    }
    // Return encoded base32 string (without padding)
    return encodeBase32(secretBuffer).replace(/=+$/, '');
}

/**
 * Generates HOTP token for a given counter value.
 */
export function generateHOTP(secretBuffer: Buffer, counter: number): string {
    const counterBuffer = Buffer.alloc(8);
    // Write 32-bit counter value into the last 4 bytes of the 8-byte buffer
    counterBuffer.writeUInt32BE(counter, 4);

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code = ((hmacResult[offset] & 0x7f) << 24) |
                 ((hmacResult[offset + 1] & 0xff) << 16) |
                 ((hmacResult[offset + 2] & 0xff) << 8) |
                 (hmacResult[offset + 3] & 0xff);

    const otp = code % 1000000;
    return otp.toString().padStart(6, '0');
}

/**
 * Verifies a TOTP token against a base32 secret, allowing clock drift (Window = 1).
 */
export function verifyTOTP(token: string, secret: string): boolean {
    try {
        const cleanToken = token.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(cleanToken)) {
            return false;
        }

        const secretBuffer = decodeBase32(secret);
        const timeStep = 30;
        const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

        // Clock Drift defense: Check T-1, T, T+1 (Window = 1)
        for (let i = -1; i <= 1; i++) {
            const calculated = generateHOTP(secretBuffer, currentCounter + i);
            if (calculated === cleanToken) {
                return true;
            }
        }
    } catch (err) {
        console.error('TOTP verification error:', err);
    }
    return false;
}

/**
 * Generates otpauth URI for QR Code scanning.
 */
export function getOtpauthUri(label: string, secret: string, issuer = 'Zinsight'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
