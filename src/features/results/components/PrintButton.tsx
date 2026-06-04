'use client';

import { Button, type buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { Download } from 'lucide-react';

type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
type ButtonSize = VariantProps<typeof buttonVariants>['size'];

interface PrintButtonProps {
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}

export function PrintButton({
    label = 'Descargar PDF',
    variant = 'outline',
    size = 'lg',
    className,
}: PrintButtonProps): React.JSX.Element {
    return (
        <Button
            variant={variant}
            size={size}
            className={cn('rounded-full font-semibold print:hidden', className)}
            onClick={() => window.print()}
        >
            <Download size={16} />
            {label}
        </Button>
    );
}
