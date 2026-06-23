'use client';

import { requestInstitutionalQuote } from '@/features/subscriptions/actions/quote';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface QuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: {
        name?: string;
        email?: string;
        institution?: string;
    };
}

interface FormState {
    name: string;
    email: string;
    institution: string;
    phone: string;
    message: string;
}

export function QuoteDialog({ open, onOpenChange, defaultValues }: QuoteDialogProps) {
    const [form, setForm] = useState<FormState>({
        name: defaultValues?.name ?? '',
        email: defaultValues?.email ?? '',
        institution: defaultValues?.institution ?? '',
        phone: '',
        message: '',
    });
    const [isPending, startTransition] = useTransition();

    function setField<K extends keyof FormState>(field: K, value: string): void {
        setForm((f) => ({ ...f, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault();
        startTransition(async () => {
            const result = await requestInstitutionalQuote(form);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('¡Solicitud enviada! Te vamos a contactar a la brevedad.');
            onOpenChange(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-ink text-2xl">
                        Solicitar cotización
                    </DialogTitle>
                    <DialogDescription>
                        Plan Institucional. Dejanos tus datos y te contactamos con una propuesta a
                        medida.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="quote-name" className="text-ink text-[13px] font-bold">
                                Nombre
                            </label>
                            <Input
                                id="quote-name"
                                value={form.name}
                                onChange={(e) => setField('name', e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="quote-phone" className="text-ink text-[13px] font-bold">
                                Teléfono
                            </label>
                            <Input
                                id="quote-phone"
                                value={form.phone}
                                onChange={(e) => setField('phone', e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="quote-email" className="text-ink text-[13px] font-bold">
                            Email
                        </label>
                        <Input
                            id="quote-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setField('email', e.target.value)}
                            className="border-border h-11 rounded-[10px] bg-white"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="quote-institution"
                            className="text-ink text-[13px] font-bold"
                        >
                            Institución
                        </label>
                        <Input
                            id="quote-institution"
                            value={form.institution}
                            onChange={(e) => setField('institution', e.target.value)}
                            className="border-border h-11 rounded-[10px] bg-white"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="quote-message" className="text-ink text-[13px] font-bold">
                            Mensaje (opcional)
                        </label>
                        <Textarea
                            id="quote-message"
                            value={form.message}
                            onChange={(e) => setField('message', e.target.value)}
                            placeholder="Contanos cuántas aulas, estudiantes o sedes necesitás cubrir."
                            className="border-border min-h-[88px] rounded-[10px] bg-white"
                        />
                    </div>

                    <Button type="submit" variant="ink" size="lg" disabled={isPending}>
                        {isPending ? 'Enviando…' : 'Enviar solicitud'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
