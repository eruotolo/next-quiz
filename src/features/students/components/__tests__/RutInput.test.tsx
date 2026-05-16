import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RutInput } from '../RutInput'

// react-imask renders an <input> in jsdom; IMaskInput passes the inputRef and props through.
vi.mock('react-imask', () => ({
    IMaskInput: ({
        value,
        disabled,
        placeholder,
        name,
        inputRef,
        onAccept,
        ...rest
    }: {
        value?: string
        disabled?: boolean
        placeholder?: string
        name?: string
        inputRef?: React.Ref<HTMLInputElement>
        onAccept?: (val: string) => void
        [key: string]: unknown
    }) => (
        <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value ?? ''}
            onChange={(e) => onAccept?.(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            name={name}
            data-testid="rut-input"
            readOnly={!onAccept}
            {...rest}
        />
    ),
}))

describe('RutInput', () => {
    it('renders the input element', () => {
        render(<RutInput />)
        expect(screen.getByTestId('rut-input')).toBeInTheDocument()
    })

    it('shows default placeholder', () => {
        render(<RutInput />)
        expect(screen.getByPlaceholderText('12.345.678-9')).toBeInTheDocument()
    })

    it('shows custom placeholder', () => {
        render(<RutInput placeholder="Ingresá tu RUT" />)
        expect(screen.getByPlaceholderText('Ingresá tu RUT')).toBeInTheDocument()
    })

    it('renders outside label when labelPlacement is outside', () => {
        render(<RutInput label="RUT del estudiante" labelPlacement="outside" />)
        expect(screen.getByText('RUT del estudiante')).toBeInTheDocument()
    })

    it('does not render label element when labelPlacement is inside', () => {
        render(<RutInput label="RUT" labelPlacement="inside" />)
        expect(screen.queryByRole('label')).not.toBeInTheDocument()
    })

    it('shows error message when error prop is provided', () => {
        render(<RutInput error="RUT inválido" />)
        expect(screen.getByText('RUT inválido')).toBeInTheDocument()
    })

    it('does not show error element when no error', () => {
        render(<RutInput />)
        expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    })

    it('disables the input when isDisabled is true', () => {
        render(<RutInput isDisabled />)
        expect(screen.getByTestId('rut-input')).toBeDisabled()
    })

    it('renders with a given name attribute', () => {
        render(<RutInput name="student-rut" />)
        expect(screen.getByTestId('rut-input')).toHaveAttribute('name', 'student-rut')
    })

    it('reflects the current value', () => {
        render(<RutInput value="12.345.678-5" onChange={vi.fn()} />)
        expect(screen.getByTestId('rut-input')).toHaveValue('12.345.678-5')
    })
})
