import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isAdminPrivate = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

    if (isAdminPrivate && !req.auth) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/admin/:path*'],
};
