export const USER_ROLE = {
    SUPER_ADMIN: 'SuperAdministrador',
    ADMIN: 'Administrador',
    PROFESOR: 'Profesor',
    STUDENT: 'Estudiante',
} as const;

export type UserRoleName = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const ADMIN_ROLES: UserRoleName[] = [
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.ADMIN,
    USER_ROLE.PROFESOR,
];
