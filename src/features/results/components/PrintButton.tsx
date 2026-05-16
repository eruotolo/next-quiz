'use client';

import { Button } from '@/shared/components/ui/button';
import { Download } from 'lucide-react';

export function PrintButton(): React.JSX.Element {
    return (
        <Button
            variant="outline"
            size="lg"
            className="rounded-full font-semibold print:hidden"
            onClick={() => window.print()}
        >
            <Download size={16} />
            Descargar PDF
        </Button>
    );
}
