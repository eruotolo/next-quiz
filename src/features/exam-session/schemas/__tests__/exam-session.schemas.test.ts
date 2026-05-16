import { describe, expect, it } from 'vitest'
import { submitAnswerSchema } from '../exam-session.schemas'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const UUID2 = '550e8400-e29b-41d4-a716-446655440001'

describe('submitAnswerSchema', () => {
    it('accepts a valid single-option answer', () => {
        const result = submitAnswerSchema.safeParse({ questionId: UUID, optionIds: [UUID2] })
        expect(result.success).toBe(true)
    })

    it('accepts multiple option IDs', () => {
        const result = submitAnswerSchema.safeParse({
            questionId: UUID,
            optionIds: [UUID, UUID2],
        })
        expect(result.success).toBe(true)
    })

    it('rejects empty optionIds array', () => {
        const result = submitAnswerSchema.safeParse({ questionId: UUID, optionIds: [] })
        expect(result.success).toBe(false)
    })

    it('rejects non-UUID questionId', () => {
        const result = submitAnswerSchema.safeParse({ questionId: 'not-a-uuid', optionIds: [UUID] })
        expect(result.success).toBe(false)
    })

    it('rejects non-UUID inside optionIds', () => {
        const result = submitAnswerSchema.safeParse({
            questionId: UUID,
            optionIds: ['not-a-uuid'],
        })
        expect(result.success).toBe(false)
    })

    it('rejects more than 6 options', () => {
        const ids = Array.from(
            { length: 7 },
            (_, i) => `550e8400-e29b-41d4-a716-44665544000${i}`,
        )
        const result = submitAnswerSchema.safeParse({ questionId: UUID, optionIds: ids })
        expect(result.success).toBe(false)
    })
})
