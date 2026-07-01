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
    '/audiencias',
    '/empresa',
    '/recursos',
    '/registro',
    '/certificado',
];

/**
 * Paths públicos por slug de institución:
 * - /[slug]/cursos      → catálogo B2C (Fase 4A)
 * - /[slug]/checkout    → checkout B2C (Fase 4B)
 *
 * /[slug]/aula es la sección admin del Aula Virtual y requiere lmsEnabled=true.
 */
const PUBLIC_SLUG_SEGMENTS = new Set(['cursos', 'checkout']);

/** Matchea paths públicos del tipo `/[slug]/<segment>` o `/[slug]/<segment>/...`. */
function isPublicBySlugPath(pathname: string): boolean {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length >= 2 && PUBLIC_SLUG_SEGMENTS.has(parts[1] ?? '');
}

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

    // Activación de cuenta B2C sin sesión previa (token en query).
    if (pathname === '/examen/activar' || pathname.startsWith('/examen/activar/')) {
        return next();
    }

    // Catálogo y checkout B2C por slug: público.
    if (isPublicBySlugPath(pathname)) {
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

    // Gating LMS (Fase 3.2): el Aula Virtual admin requiere lmsEnabled=true.
    // El SuperAdmin ya pasó arriba. El resto queda bloqueado con aviso.
    if (
        pathname === `/${slug}/aula` ||
        pathname.startsWith(`/${slug}/aula/`)
    ) {
        if (session.user.lmsEnabled !== true) {
            return redirect(`/${slug}/settings?notice=lms_disabled`);
        }
    }

    return protectedResponse;
});

export const config = {
    matcher: [
        '/((?!_next|favicon\\.ico|sitemap.*\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
    ],
};
