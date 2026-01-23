import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin1234';

export async function POST(request: Request) {
    const body = await request.json();
    const { passcode } = body;

    if (passcode === ADMIN_PASSCODE) {
        (await cookies()).set('auth_token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
}
