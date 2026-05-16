import { describe, expect, it } from 'vitest'
import { studentLoginSchema, studentSchema } from '../student.schemas'

describe('studentLoginSchema', () => {
    it('accepts a valid formatted RUT', () => {
        const result = studentLoginSchema.safeParse({ rut: '12.345.678-5' })
        expect(result.success).toBe(true)
    })

    it('normalizes the RUT on parse (removes dots and dash)', () => {
        const result = studentLoginSchema.safeParse({ rut: '12.345.678-5' })
        expect(result.success && result.data.rut).toBe('123456785')
    })

    it('rejects an invalid verifier digit', () => {
        const result = studentLoginSchema.safeParse({ rut: '12.345.678-0' })
        expect(result.success).toBe(false)
    })

    it('rejects empty RUT', () => {
        const result = studentLoginSchema.safeParse({ rut: '' })
        expect(result.success).toBe(false)
    })

    it('rejects a RUT with wrong verifier (12345678-0, correct is -5)', () => {
        const result = studentLoginSchema.safeParse({ rut: '12.345.678-0' })
        expect(result.success).toBe(false)
    })
})

describe('studentSchema', () => {
    const validStudent = {
        name: 'Juan',
        lastname: 'Pérez',
        email: 'juan@example.com',
        rut: '12.345.678-5',
        groupId: '550e8400-e29b-41d4-a716-446655440000',
    }

    it('accepts a valid student', () => {
        expect(studentSchema.safeParse(validStudent).success).toBe(true)
    })

    it('rejects invalid email', () => {
        const result = studentSchema.safeParse({ ...validStudent, email: 'not-an-email' })
        expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
        const result = studentSchema.safeParse({ ...validStudent, name: '' })
        expect(result.success).toBe(false)
    })

    it('rejects empty lastname', () => {
        const result = studentSchema.safeParse({ ...validStudent, lastname: '' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid groupId (not a UUID)', () => {
        const result = studentSchema.safeParse({ ...validStudent, groupId: 'not-a-uuid' })
        expect(result.success).toBe(false)
    })

    it('rejects RUT with wrong verifier (12345678-0, correct is -5)', () => {
        const result = studentSchema.safeParse({ ...validStudent, rut: '12.345.678-0' })
        expect(result.success).toBe(false)
    })
})
