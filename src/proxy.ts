import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import type { Session } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

type NextAuthRequest = NextRequest & { auth: Session | null };

const PUBLIC_PREFIXES = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/demo',
    '/login',
    '/paes',
    '/audiencias',
    '/empresa',
    '/recursos',
    '/registro',
    '/certificado',
];

export default auth((req: NextAuthRequest) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Propagate pathname to server components so layouts can detect exam routes
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set('x-pathname', pathname);

    function next(): NextResponse {
        return NextResponse.next({ request: { headers: reqHeaders } });
    }
    function redirect(url: string): NextResponse {
        return NextResponse.redirect(new URL(url, req.url));
    }

    if (pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return next();
    }

    // All protected routes must not be indexed by search engines
    const protectedResponse = next();
    protectedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');

    if (pathname.startsWith('/config')) {
        if (!session) return redirect('/login');
        if (session.user.userRoleName !== USER_ROLE.SUPER_ADMIN) {
            return redirect('/login');
        }
        return protectedResponse;
    }

    // Portal del estudiante (/students/*): sesión jose validada en el layout
    if (pathname.startsWith('/students')) {
        return protectedResponse;
    }

    if (!session) return redirect('/login');

    if (session.user.userRoleName === USER_ROLE.STUDENT) {
        return redirect('/examen/login');
    }

    if (pathname.startsWith('/perfil')) {
        return protectedResponse;
    }

    const slug = pathname.split('/')[1];

    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        return protectedResponse;
    }

    if (!session.user.institutionSlug || session.user.institutionSlug !== slug) {
        const target = session.user.institutionSlug ? `/${session.user.institutionSlug}` : '/login';
        return redirect(target);
    }

    return protectedResponse;
});

export const config = {
    matcher: [
        '/((?!_next|favicon\\.ico|sitemap.*\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
    ],
};
