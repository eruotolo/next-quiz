'use client';

import { importQuestions } from '@/features/exams/actions/mutations';
import { parseExcelFile } from '@/features/exams/lib/import-excel';
import { parseMarkdownFile } from '@/features/exams/lib/import-markdown';
import { generateExcelTemplate, generateMarkdownTemplate } from '@/features/exams/lib/templates';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import {
    CheckCircle,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Upload,
    XCircle,
} from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ParseResult, QuestionDraft } from '@/features/exams/lib/import-excel';

interface Props {
    slug: string;
    examId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Tab = 'excel' | 'markdown';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
export function ImportQuestionsDialog({
    slug,
    examId,
    open,
    onOpenChange,
}: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('excel');
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = (): void => {
        setParseResult(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabChange = (tab: Tab): void => {
        setActiveTab(tab);
        reset();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setIsParsing(true);
        setParseResult(null);

        const reader = new FileReader();
        if (activeTab === 'excel') {
            reader.onload = (ev): void => {
                const result = parseExcelFile(ev.target?.result as ArrayBuffer);
                setParseResult(result);
                setIsParsing(false);
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (ev): void => {
                const result = parseMarkdownFile(ev.target?.result as string);
                setParseResult(result);
                setIsParsing(false);
            };
            reader.readAsText(file, 'utf-8');
        }
    };

    const handleImport = (): void => {
        if (!parseResult || parseResult.ok.length === 0) return;
        startTransition(async () => {
            try {
                const questionsToSend: QuestionDraft[] = parseResult.ok;
                const { count } = await importQuestions(slug, examId, questionsToSend);
                toast.success(
                    `${count} pregunta${count !== 1 ? 's' : ''} importada${count !== 1 ? 's' : ''} correctamente`,
                );
                onOpenChange(false);
                reset();
                router.refresh();
            } catch {
                toast.error('Error al importar', {
                    description: 'Revisa el formato del archivo e intenta de nuevo.',
                });
            }
        });
    };

    const handleClose = (): void => {
        onOpenChange(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importar preguntas</DialogTitle>
                    <DialogDescription className="sr-only">
                        Importar preguntas desde un archivo Excel o Markdown
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="border-border flex overflow-hidden rounded-lg border">
                    <button
                        type="button"
                        onClick={() => handleTabChange('excel')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                            activeTab === 'excel'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted/50',
                        )}
                    >
                        <FileSpreadsheet size={15} />
                        Excel (.xlsx)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('markdown')}
                        className={cn(
                            'border-border flex flex-1 items-center justify-center gap-2 border-l px-4 py-2.5 text-sm font-medium transition-colors',
                            activeTab === 'markdown'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted/50',
                        )}
                    >
                        <FileText size={15} />
                        Markdown (.md)
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* Format hint */}
                    <div className="bg-muted/50 text-muted-foreground rounded-lg px-4 py-3 text-[12.5px] leading-relaxed">
                        {activeTab === 'excel' ? (
                            <>
                                <strong className="text-foreground">Formato Excel:</strong> columnas{' '}
                                <code className="bg-muted rounded px-1">pregunta</code>,{' '}
                                <code className="bg-muted rounded px-1">tipo</code>{' '}
                                (unica/multiple),{' '}
                                <code className="bg-muted rounded px-1">puntos</code>,{' '}
                                <code className="bg-muted rounded px-1">opcion1</code>,{' '}
                                <code className="bg-muted rounded px-1">correcta1</code> … hasta
                                opcion6/correcta6. Marcá correctas con{' '}
                                <code className="bg-muted rounded px-1">x</code>.
                            </>
                        ) : (
                            <>
                                <strong className="text-foreground">Formato Markdown:</strong>{' '}
                                <code className="bg-muted rounded px-1">
                                    ## ¿Pregunta? [1 pts] [unica]
                                </code>{' '}
                                seguido de{' '}
                                <code className="bg-muted rounded px-1">- [x] correcta</code> y{' '}
                                <code className="bg-muted rounded px-1">- [ ] incorrecta</code>.
                                Tipos: <code className="bg-muted rounded px-1">unica</code> o{' '}
                                <code className="bg-muted rounded px-1">multiple</code>.
                            </>
                        )}
                    </div>

                    {/* Download template + Upload */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-lg"
                            onClick={() =>
                                activeTab === 'excel'
                                    ? generateExcelTemplate()
                                    : generateMarkdownTemplate()
                            }
                        >
                            <Download size={13} />
                            Descargar plantilla {activeTab === 'excel' ? 'Excel' : 'Markdown'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                        >
                            <Upload size={13} />
                            {fileName ? 'Cambiar archivo' : 'Seleccionar archivo'}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={activeTab === 'excel' ? '.xlsx,.xls' : '.md,.txt'}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {fileName && (
                        <p className="text-muted-foreground text-[12.5px]">
                            Archivo: <span className="text-foreground font-medium">{fileName}</span>
                        </p>
                    )}

                    {/* Parsing state */}
                    {isParsing && (
                        <div className="flex items-center gap-2 text-sm">
                            <Loader2 size={14} className="animate-spin" />
                            Procesando archivo…
                        </div>
                    )}

                    {/* Parse result */}
                    {parseResult && (
                        <div className="space-y-3">
                            {/* Summary */}
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className="text-success flex items-center gap-1 font-medium">
                                    <CheckCircle size={14} />
                                    {parseResult.ok.length} pregunta
                                    {parseResult.ok.length !== 1 ? 's' : ''} válida
                                    {parseResult.ok.length !== 1 ? 's' : ''}
                                </span>
                                {parseResult.errors.length > 0 && (
                                    <span className="text-destructive flex items-center gap-1 font-medium">
                                        <XCircle size={14} />
                                        {parseResult.errors.length} error
                                        {parseResult.errors.length !== 1 ? 'es' : ''}
                                    </span>
                                )}
                            </div>

                            {/* Errors */}
                            {parseResult.errors.length > 0 && (
                                <div className="bg-destructive/5 border-destructive/20 space-y-1 rounded-lg border px-3 py-2.5">
                                    {parseResult.errors.map((err) => (
                                        <p key={err.row} className="text-destructive text-[12.5px]">
                                            {err.message}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Questions preview */}
                            {parseResult.ok.length > 0 && (
                                <div className="border-border overflow-hidden rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-border border-b">
                                                <th className="px-3 py-2 text-left text-xs font-semibold">
                                                    #
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold">
                                                    Pregunta
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold">
                                                    Tipo
                                                </th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold">
                                                    Pts
                                                </th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold">
                                                    Ops
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parseResult.ok.map((q, i) => (
                                                <tr
                                                    key={q.text}
                                                    className="border-border border-b last:border-0"
                                                >
                                                    <td className="text-muted-foreground px-3 py-2 text-xs">
                                                        {i + 1}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span
                                                            className="line-clamp-2 text-[12.5px]"
                                                            title={q.text}
                                                        >
                                                            {q.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <TypeBadge type={q.questionType} />
                                                    </td>
                                                    <td className="text-muted-foreground px-3 py-2 text-center text-xs">
                                                        {q.points}
                                                    </td>
                                                    <td className="text-muted-foreground px-3 py-2 text-center text-xs">
                                                        {q.options.length}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="rounded-full"
                        disabled={!parseResult || parseResult.ok.length === 0 || isPending}
                        onClick={handleImport}
                    >
                        {isPending && <Loader2 className="animate-spin" />}
                        Importar{' '}
                        {parseResult && parseResult.ok.length > 0
                            ? `${parseResult.ok.length} pregunta${parseResult.ok.length !== 1 ? 's' : ''}`
                            : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TypeBadge({ type }: { type: 'UNICA' | 'MULTIPLE' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                type === 'MULTIPLE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700',
            )}
        >
            {type === 'MULTIPLE' ? 'Múltiple' : 'Única'}
        </span>
    );
}
