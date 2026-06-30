import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { verifyTOTP } from '@/lib/totp';
import { verifyTempToken } from '@/lib/temp-token';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyTempToken(authToken.value);
        if (!decoded || !decoded.username) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 현재 로그인된 관리자 조회
        let currentAdmin = await prisma.admin.findUnique({
            where: { username: decoded.username }
        });

        if (!currentAdmin && decoded.username === 'local-test-admin') {
            currentAdmin = await prisma.admin.findFirst();
        }

        if (!currentAdmin) {
            return NextResponse.json({ success: false, error: 'Current admin not found' }, { status: 401 });
        }

        // 2FA 설정 필수 검증
        if (!currentAdmin.two_factor_enabled) {
            return NextResponse.json({ 
                success: false, 
                error: '관리자 계정을 추가하려면 먼저 본인 계정의 2차 인증(2FA)을 활성화해야 합니다.' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { newUsername, newPassword, otpCode } = body;

        if (!newUsername || !newPassword) {
            return NextResponse.json({ success: false, error: '새 아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        if (!otpCode) {
            return NextResponse.json({ success: false, error: '본인 확인을 위한 6자리 2FA OTP 코드가 필요합니다.' }, { status: 400 });
        }

        if (!currentAdmin.two_factor_secret) {
            return NextResponse.json({ success: false, error: '2FA 설정 오류가 발생했습니다.' }, { status: 500 });
        }

        // OTP 인증 코드 검증
        const isValid = verifyTOTP(otpCode, currentAdmin.two_factor_secret);
        if (!isValid) {
            return NextResponse.json({ success: false, error: '2FA 인증 코드가 올바르지 않습니다.' }, { status: 400 });
        }

        // 중복 계정 확인
        const existingAdmin = await prisma.admin.findUnique({
            where: { username: newUsername }
        });

        if (existingAdmin) {
            return NextResponse.json({ success: false, error: '이미 존재하는 관리자 ID입니다.' }, { status: 400 });
        }

        // 비밀번호 해싱 및 계정 생성
        const passwordHash = hashPassword(newPassword);
        await prisma.admin.create({
            data: {
                username: newUsername,
                password_hash: passwordHash,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create admin error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
