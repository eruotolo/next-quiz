import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

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
                        role: true,
                    },
                });

                if (!user || user.role !== Role.ADMIN || !user.password) return null;

                const valid = await bcrypt.compare(credentials.password as string, user.password);
                if (!valid) return null;

                return {
                    id: user.id,
                    name: `${user.name} ${user.lastname}`,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: Role }).role;
                token.id = user.id as string;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as Role;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
    },
    session: { strategy: 'jwt' },
});
