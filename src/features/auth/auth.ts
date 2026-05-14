import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES } from '@/shared/lib/roles';
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

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
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

                if (!user || !user.userRole || !user.password) return null;
                if (!ADMIN_ROLES.includes(user.userRole.name as (typeof ADMIN_ROLES)[number]))
                    return null;

                const valid = await bcrypt.compare(credentials.password as string, user.password);
                if (!valid) return null;

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
    pages: {
        signIn: '/login',
    },
    session: { strategy: 'jwt' },
});
