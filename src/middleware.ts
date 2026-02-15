import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    const session = token ? await verifyJWT(token) : null;

    // Protect routes
    if (!session) {
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/shop')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else {
        // Logged in logic
        if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
            return NextResponse.redirect(new URL(session.role === 'admin' ? '/dashboard' : '/shop', request.url));
        }

        // Prevent users from accessing admin dashboard
        if (pathname.startsWith('/dashboard') && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/shop', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/shop/:path*', '/login', '/signup', '/'],
};
