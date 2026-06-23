/**
 * Contrato uniforme de retorno para todas las Server Actions.
 * Nunca se lanzan excepciones al cliente: se retorna { data, error }.
 */
export interface ActionResult<T = null> {
    data: T | null;
    error: string | null;
}

/** Helper para construir un resultado exitoso. */
export function ok<T>(data: T): ActionResult<T> {
    return { data, error: null };
}

/** Helper para construir un resultado de error. */
export function fail<T = null>(error: string): ActionResult<T> {
    return { data: null, error };
}

/**
 * Convierte un error desconocido en un mensaje seguro para el cliente.
 * Reconoce el constraint único de Prisma para dar un mensaje claro.
 */
export function toActionError(
    err: unknown,
    fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
    if (err instanceof Error) {
        if (err.message.includes('Unique constraint') || err.message.includes('Unique')) {
            return 'Ya existe un registro con esos datos (email o RUT duplicado).';
        }
        // Mensajes propios del dominio (lanzados por los guards) son seguros de mostrar.
        if (
            err.message === 'No autorizado' ||
            err.message === 'Sin permisos' ||
            err.message === 'Institución no encontrada'
        ) {
            return err.message;
        }
    }
    return fallback;
}
