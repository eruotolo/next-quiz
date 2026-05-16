import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuestionCard } from '../QuestionCard'
import type { SafeQuestion } from '@/features/exam-session/types/exam.types'

const mockQuestion: SafeQuestion = {
    id: 'q-001',
    text: '¿Cuánto es 2 + 2?',
    points: 1,
    order: 0,
    questionType: 'UNICA',
    options: [
        { id: 'opt-a', text: 'Tres' },
        { id: 'opt-b', text: 'Cuatro' },
        { id: 'opt-c', text: 'Cinco' },
    ],
}

describe('QuestionCard', () => {
    it('renders the question text', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={5}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('¿Cuánto es 2 + 2?')).toBeInTheDocument()
    })

    it('renders the question counter', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={2}
                totalQuestions={10}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('Pregunta 2 de 10')).toBeInTheDocument()
    })

    it('renders all option labels', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('Tres')).toBeInTheDocument()
        expect(screen.getByText('Cuatro')).toBeInTheDocument()
        expect(screen.getByText('Cinco')).toBeInTheDocument()
    })

    it('shows alphabetical badges A, B, C for options', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('A')).toBeInTheDocument()
        expect(screen.getByText('B')).toBeInTheDocument()
        expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('calls onSelect with option id when a button is clicked', async () => {
        const onSelect = vi.fn()
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={onSelect}
            />,
        )
        await userEvent.click(screen.getByText('Cuatro'))
        expect(onSelect).toHaveBeenCalledWith('opt-b')
    })

    it('marks selected option with aria-pressed=true', () => {
        const { getAllByRole } = render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={['opt-b']}
                onSelect={vi.fn()}
            />,
        )
        const buttons = getAllByRole('button')
        const selected = buttons.find((b) => b.getAttribute('aria-pressed') === 'true')
        expect(selected).toBeDefined()
    })

    it('shows the checkmark SVG only on selected option', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={['opt-a']}
                onSelect={vi.fn()}
            />,
        )
        // The SVG checkmark is only rendered when isSelected=true
        const svgs = document.querySelectorAll('button svg')
        // Only the selected option button has the checkmark
        expect(svgs.length).toBe(1)
    })

    it('disables all buttons when disabled prop is true', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
                disabled
            />,
        )
        const buttons = screen.getAllByRole('button')
        for (const btn of buttons) expect(btn).toBeDisabled()
    })

    it('shows "Respuesta múltiple" for MULTIPLE question type', () => {
        const multipleQuestion = { ...mockQuestion, questionType: 'MULTIPLE' as const }
        render(
            <QuestionCard
                question={multipleQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('Respuesta múltiple')).toBeInTheDocument()
    })

    it('shows "Respuesta simple" for UNICA question type', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                questionNumber={1}
                totalQuestions={3}
                selectedOptionIds={[]}
                onSelect={vi.fn()}
            />,
        )
        expect(screen.getByText('Respuesta simple')).toBeInTheDocument()
    })
})
