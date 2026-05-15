import { describe, expect, it } from 'vitest'
import { adminLoginSchema } from '../auth.schemas'

describe('adminLoginSchema', () => {
    it('accepts valid credentials', () => {
        const result = adminLoginSchema.safeParse({
            email: 'admin@edunext.cl',
            password: 'Admin2026!',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid email format', () => {
        const result = adminLoginSchema.safeParse({
            email: 'not-an-email',
            password: 'Admin2026!',
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('Email inválido')
    })

    it('rejects empty email', () => {
        const result = adminLoginSchema.safeParse({ email: '', password: 'Admin2026!' })
        expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
        const result = adminLoginSchema.safeParse({ email: 'admin@edunext.cl', password: '' })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('Contraseña requerida')
    })

    it('rejects missing fields', () => {
        expect(adminLoginSchema.safeParse({}).success).toBe(false)
    })
})
