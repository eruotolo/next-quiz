import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import bcrypt from 'bcryptjs';
import NextAuth, { type Session, type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const emailStr = credentials.email as string;

                const user = await prisma.user.findUnique({
                    where: { email: emailStr },
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                        password: true,
                        userRole: { select: { name: true } },
                        academicInstitution: { select: { id: true, slug: true } },
                    },
                });

                if (!user || !user.userRole || !user.password) {
                    await logAudit({
                        action: AUDIT_ACTION.AUTH_LOGIN_FAILURE,
                        actorEmail: emailStr,
                        status: 'failure',
                        metadata: { reason: 'user_not_found_or_invalid' },
                    });
                    return null;
                }

                if (!ADMIN_ROLES.includes(user.userRole.name as (typeof ADMIN_ROLES)[number])) {
                    await logAudit({
                        action: AUDIT_ACTION.AUTH_LOGIN_FAILURE,
                        actorId: user.id,
                        actorEmail: user.email,
                        actorRole: user.userRole.name,
                        status: 'failure',
                        metadata: { reason: 'insufficient_role' },
                    });
                    return null;
                }

                const valid = await bcrypt.compare(credentials.password as string, user.password);
                if (!valid) {
                    await logAudit({
                        action: AUDIT_ACTION.AUTH_LOGIN_FAILURE,
                        actorId: user.id,
                        actorEmail: user.email,
                        actorRole: user.userRole.name,
                        status: 'failure',
                        metadata: { reason: 'invalid_password' },
                    });
                    return null;
                }

                await logAudit({
                    action: AUDIT_ACTION.AUTH_LOGIN_SUCCESS,
                    actorId: user.id,
                    actorEmail: user.email,
                    actorRole: user.userRole.name,
                    academicInstitutionId: user.academicInstitution?.id ?? null,
                    status: 'success',
                });

                return {
                    id: user.id,
                    name: `${user.name} ${user.lastname}`,
                    email: user.email,
                    userRoleName: user.userRole.name,
                    academicInstitutionId: user.academicInstitution?.id ?? null,
                    institutionSlug: user.academicInstitution?.slug ?? null,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }: { token: JWT; user?: User }): JWT {
            if (user) {
                token.id = user.id as string;
                token.userRoleName = user.userRoleName;
                token.academicInstitutionId = user.academicInstitutionId;
                token.institutionSlug = user.institutionSlug;
            }
            return token;
        },
        session({ session, token }: { session: Session; token: JWT }): Session {
            if (session.user) {
                session.user.id = token.id;
                session.user.userRoleName = token.userRoleName;
                session.user.academicInstitutionId = token.academicInstitutionId;
                session.user.institutionSlug = token.institutionSlug;
            }
            return session;
        },
    },
    events: {
        async signOut(message) {
            const token = 'token' in message ? message.token : null;
            if (!token) return;
            await logAudit({
                action: AUDIT_ACTION.AUTH_LOGOUT,
                actorId: (token.id as string) ?? null,
                actorEmail: (token.email as string) ?? null,
                actorRole: (token.userRoleName as string) ?? null,
                status: 'success',
            });
        },
    },
    pages: {
        signIn: '/login',
    },
    session: { strategy: 'jwt' },
});
