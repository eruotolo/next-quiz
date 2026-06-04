'use client';

import { useState } from 'react';
import { beginExam } from '@/features/exam-session/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowRight } from 'lucide-react';

export function ExamIntroStart(): React.JSX.Element {
    const [accepted, setAccepted] = useState(false);

    return (
        <form
            action={beginExam}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex max-w-sm items-start gap-2.5">
                <Checkbox
                    id="accept-terms"
                    checked={accepted}
                    onCheckedChange={(value) => setAccepted(value === true)}
                    className="mt-0.5"
                />
                <label
                    htmlFor="accept-terms"
                    className="text-ink-dim cursor-pointer text-[13px] leading-snug"
                >
                    Entendí las instrucciones y acepto rendir esta prueba.
                </label>
            </div>
            <Button variant="primary" size="lg" type="submit" disabled={!accepted}>
                Comenzar examen
                <ArrowRight className="size-4" />
            </Button>
        </form>
    );
}
