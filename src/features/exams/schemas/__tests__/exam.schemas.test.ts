import { describe, expect, it } from 'vitest'
import { examSchema, optionSchema, questionSchema } from '../exam.schemas'

describe('optionSchema', () => {
    it('accepts a valid option', () => {
        const result = optionSchema.safeParse({ text: 'Opción A', isCorrect: true })
        expect(result.success).toBe(true)
    })

    it('rejects empty text', () => {
        const result = optionSchema.safeParse({ text: '', isCorrect: false })
        expect(result.success).toBe(false)
    })

    it('defaults isCorrect to false', () => {
        const result = optionSchema.safeParse({ text: 'Opción' })
        expect(result.success && result.data.isCorrect).toBe(false)
    })
})

describe('questionSchema — UNICA', () => {
    const baseOptions = [
        { text: 'Opción correcta', isCorrect: true },
        { text: 'Opción incorrecta', isCorrect: false },
    ]

    it('accepts a valid UNICA question with exactly 1 correct answer', () => {
        const result = questionSchema.safeParse({
            text: '¿Cuánto es 2+2?',
            questionType: 'UNICA',
            options: baseOptions,
        })
        expect(result.success).toBe(true)
    })

    it('rejects UNICA question with 0 correct answers', () => {
        const result = questionSchema.safeParse({
            text: '¿Pregunta?',
            questionType: 'UNICA',
            options: [
                { text: 'A', isCorrect: false },
                { text: 'B', isCorrect: false },
            ],
        })
        expect(result.success).toBe(false)
    })

    it('rejects UNICA question with 2 correct answers', () => {
        const result = questionSchema.safeParse({
            text: '¿Pregunta?',
            questionType: 'UNICA',
            options: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: true },
            ],
        })
        expect(result.success).toBe(false)
    })

    it('rejects question with less than 2 options', () => {
        const result = questionSchema.safeParse({
            text: '¿Pregunta?',
            questionType: 'UNICA',
            options: [{ text: 'Solo una', isCorrect: true }],
        })
        expect(result.success).toBe(false)
    })

    it('rejects empty question text', () => {
        const result = questionSchema.safeParse({
            text: '',
            questionType: 'UNICA',
            options: baseOptions,
        })
        expect(result.success).toBe(false)
    })
})

describe('questionSchema — MULTIPLE', () => {
    it('accepts MULTIPLE question with at least 2 correct answers', () => {
        const result = questionSchema.safeParse({
            text: '¿Cuáles son colores primarios?',
            questionType: 'MULTIPLE',
            options: [
                { text: 'Rojo', isCorrect: true },
                { text: 'Verde', isCorrect: false },
                { text: 'Azul', isCorrect: true },
            ],
        })
        expect(result.success).toBe(true)
    })

    it('rejects MULTIPLE question with only 1 correct answer', () => {
        const result = questionSchema.safeParse({
            text: '¿Cuáles?',
            questionType: 'MULTIPLE',
            options: [
                { text: 'Solo esta', isCorrect: true },
                { text: 'Incorrecta', isCorrect: false },
            ],
        })
        expect(result.success).toBe(false)
    })
})

describe('examSchema', () => {
    const validExam = {
        title: 'Examen de Matemáticas',
        timeLimit: 60,
        active: false,
        questionType: 'UNICA' as const,
        antiCheatEnabled: false,
        groupIds: ['550e8400-e29b-41d4-a716-446655440000'],
        maxGrade: 7,
        passingGrade: 4,
        passingPercentage: 60,
    }

    it('accepts a valid exam configuration', () => {
        expect(examSchema.safeParse(validExam).success).toBe(true)
    })

    it('rejects when passingGrade >= maxGrade', () => {
        const result = examSchema.safeParse({ ...validExam, passingGrade: 7, maxGrade: 7 })
        expect(result.success).toBe(false)
    })

    it('rejects empty title', () => {
        const result = examSchema.safeParse({ ...validExam, title: '' })
        expect(result.success).toBe(false)
    })

    it('rejects timeLimit of 0', () => {
        const result = examSchema.safeParse({ ...validExam, timeLimit: 0 })
        expect(result.success).toBe(false)
    })

    it('rejects timeLimit over 180 minutes', () => {
        const result = examSchema.safeParse({ ...validExam, timeLimit: 181 })
        expect(result.success).toBe(false)
    })

    it('rejects empty groupIds array', () => {
        const result = examSchema.safeParse({ ...validExam, groupIds: [] })
        expect(result.success).toBe(false)
    })
})
