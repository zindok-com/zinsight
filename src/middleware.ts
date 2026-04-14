import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth_token');
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
    const isApiSnapshot = request.nextUrl.pathname.startsWith('/api/snapshots');
    const isApiCompanies = request.nextUrl.pathname.startsWith('/api/companies');

    if (!authToken && !isLoginPage && !isApiAuth && !isApiSnapshot && !isApiCompanies) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (authToken && isLoginPage) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
