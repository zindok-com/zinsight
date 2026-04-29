import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authToken = request.cookies.get('auth_token');

    // ── 인증이 필요한 경로: /admin 하위 전체 ──
    const isAdminPath = pathname.startsWith('/admin');

    // ── 인증 관련 예외 경로 ──
    const isLoginPage = pathname === '/login';
    const isApiAuth = pathname.startsWith('/api/auth');

    // /admin 경로에 비인증 상태로 접근하면 /login으로 리다이렉트
    if (isAdminPath && !authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 이미 로그인한 상태에서 /login 접근 시 /admin으로 리다이렉트
    if (isLoginPage && authToken) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // public 정적 파일은 미들웨어 제외
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
