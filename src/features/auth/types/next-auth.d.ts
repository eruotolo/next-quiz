export {};

declare module 'next-auth' {
    interface User {
        userRoleName: string;
        academicInstitutionId: string | null;
        institutionSlug: string | null;
    }
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            userRoleName: string;
            academicInstitutionId: string | null;
            institutionSlug: string | null;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        userRoleName: string;
        academicInstitutionId: string | null;
        institutionSlug: string | null;
    }
}
