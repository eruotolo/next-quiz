import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE, type UserRoleName } from '@/shared/lib/roles';

/**
 * Contexto resuelto de una institución para acciones scoped a /[slug]/*.
 * `institutionId` es el id efectivo: para el SuperAdmin se resuelve desde el
 * slug de la URL (llave maestra); para Admin/Profesor es el de su sesión.
 */
export interface InstitutionContext {
    slug: string;
    institutionId: string;
    userId: string;
    userEmail: string;
    userRole: UserRoleName;
    isSuperAdmin: boolean;
    isProfesor: boolean;
}

const INSTITUTION_ROLES: UserRoleName[] = [
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.ADMIN,
    USER_ROLE.PROFESOR,
];

/**
 * Resuelve y autoriza el acceso a una institución para una acción scoped a
 * `/[slug]/*`.
 *
 * - SuperAdmin (llave maestra): acepta el slug de la URL y resuelve el id real
 *   de la institución, pudiendo operar dentro de cualquiera.
 * - Admin/Profesor: su slug de sesión debe coincidir con el solicitado.
 *
 * Lanza Error cuando: no hay sesión, el rol no está permitido, la institución
 * no existe, o un Admin/Profesor apunta a otra institución. Las acciones
 * capturan estos errores y los convierten a `{ data, error }`.
 */
export async function requireInstitutionAccess(
    requestSlug: string,
    allowedRoles: UserRoleName[] = INSTITUTION_ROLES,
): Promise<InstitutionContext> {
    const session = await auth();
    if (!session?.user) throw new Error('No autorizado');

    const userRole = session.user.userRoleName as UserRoleName;
    if (!allowedRoles.includes(userRole)) throw new Error('Sin permisos');

    const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
    const isProfesor = userRole === USER_ROLE.PROFESOR;

    const base = {
        slug: requestSlug,
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole,
        isSuperAdmin,
        isProfesor,
    };

    if (isSuperAdmin) {
        const inst = await prisma.academicInstitution.findUnique({
            where: { slug: requestSlug },
            select: { id: true },
        });
        if (!inst) throw new Error('Institución no encontrada');
        return { ...base, institutionId: inst.id };
    }

    const sessionSlug = session.user.institutionSlug;
    const institutionId = session.user.academicInstitutionId;
    if (!sessionSlug || !institutionId || sessionSlug !== requestSlug) {
        throw new Error('No autorizado');
    }
    return { ...base, institutionId };
}

/** Guard exclusivo de SuperAdmin para acciones globales (sin scope de institución). */
export async function requireSuperAdmin(): Promise<{ userId: string; userEmail: string }> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) {
        throw new Error('No autorizado');
    }
    return { userId: session.user.id, userEmail: session.user.email ?? '' };
}
