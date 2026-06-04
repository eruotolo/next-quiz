import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import type { Session } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

type NextAuthRequest = NextRequest & { auth: Session | null };

const PUBLIC_PREFIXES = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/examen',
    '/demo',
    '/login',
    '/paes',
    '/audiencias',
    '/empresa',
    '/recursos',
    '/registro',
];

export default auth((req: NextAuthRequest) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    if (pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    if (pathname.startsWith('/config')) {
        if (!session) return NextResponse.redirect(new URL('/login', req.url));
        if (session.user.userRoleName !== USER_ROLE.SUPER_ADMIN) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
        return NextResponse.next();
    }

    if (!session) return NextResponse.redirect(new URL('/login', req.url));

    if (session.user.userRoleName === USER_ROLE.STUDENT) {
        return NextResponse.redirect(new URL('/examen/login', req.url));
    }

    if (pathname.startsWith('/perfil')) {
        return NextResponse.next();
    }

    const slug = pathname.split('/')[1];

    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        return NextResponse.next();
    }

    if (!session.user.institutionSlug || session.user.institutionSlug !== slug) {
        const target = session.user.institutionSlug ? `/${session.user.institutionSlug}` : '/login';
        return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|favicon\\.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
    ],
};
