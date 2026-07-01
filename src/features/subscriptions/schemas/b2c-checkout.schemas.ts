import { z } from 'zod';
import { isValidRut } from '@/shared/lib/rut';

/**
 * Schemas Zod del flujo B2C (checkout, polling, activación).
 * Reutilizables en client + server. Validación de RUT via
 * `isValidRut` (acepta RUTs con K y 0 como dígito verificador).
 */

const rutField = z
    .string()
    .min(1, 'El RUT es requerido')
    .refine(isValidRut, 'RUT inválido');

/**
 * Schema del checkout B2C. El comprador elige un producto:
 *  - `kind: 'COURSE'` + `courseId` → compra de un curso individual.
 *  - `kind: 'CATEGORY_BUNDLE'` + `categoryId` → compra del Pack Completo de
 *    una categoría (inscripción automática a todos los cursos asociados).
 */
export const b2cCheckoutSchema = z
    .object({
        kind: z.enum(['COURSE', 'CATEGORY_BUNDLE']),
        courseId: z.string().uuid('Curso inválido').optional(),
        categoryId: z.string().uuid('Categoría inválida').optional(),
        studentRut: rutField,
        studentName: z.string().min(2, 'Nombre requerido').max(100),
        studentLastname: z.string().min(2, 'Apellido requerido').max(100),
        studentEmail: z.string().email('Email inválido'),
        acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos de uso'),
    })
    .refine(
        (data) =>
            (data.kind === 'COURSE' && !!data.courseId) ||
            (data.kind === 'CATEGORY_BUNDLE' && !!data.categoryId),
        {
            message: 'Falta el identificador del producto.',
            path: ['courseId'],
        },
    );

export type B2cCheckoutInput = z.infer<typeof b2cCheckoutSchema>;

/**
 * Schema del form de activación. El token viene por query string y se valida
 * en la server action (existencia + expiración); acá validamos solo formato.
 */
export const b2cActivatePasswordSchema = z
    .object({
        token: z.string().min(1, 'Token inválido'),
        password: z
            .string()
            .min(8, 'Mínimo 8 caracteres')
            .max(100, 'Máximo 100 caracteres')
            .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
            .regex(/[0-9]/, 'Debe incluir al menos un número'),
        confirmPassword: z.string().min(1, 'Confirma la contraseña'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

export type B2cActivatePasswordInput = z.infer<typeof b2cActivatePasswordSchema>;
