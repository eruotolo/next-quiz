'use client';

import { createStudent, deleteStudent, importStudents, updateStudent } from '@/actions/students';
import type { ImportStudentsResult } from '@/actions/students';
import { RutInput } from '@/components/inputs/RutInput';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatRut, isValidRut, normalizeRut } from '@/lib/rut';
import type { Group, User } from '@prisma/client';
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    Edit2,
    FileSpreadsheet,
    GraduationCap,
    Info,
    Loader2,
    Plus,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

interface StudentWithGroup extends User {
    group: Group | null;
}

interface Props {
    students: StudentWithGroup[];
    groups: Group[];
}

interface FormState {
    name: string;
    lastname: string;
    email: string;
    rut: string;
    groupId: string;
}

interface ParsedRow {
    name: string;
    lastname: string;
    email: string;
    rut: string;
    groupId: string;
    rowNum: number;
}

const emptyForm: FormState = { name: '', lastname: '', email: '', rut: '', groupId: '' };

export function StudentsClient({ students, groups }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editing, setEditing] = useState<StudentWithGroup | null>(null);
    const [toDelete, setToDelete] = useState<StudentWithGroup | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Import state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [importResult, setImportResult] = useState<ImportStudentsResult | null>(null);

    const setField = (field: keyof FormState, value: string): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const openCreate = (): void => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setIsOpen(true);
    };

    const openEdit = (s: StudentWithGroup): void => {
        setEditing(s);
        setForm({
            name: s.name,
            lastname: s.lastname,
            email: s.email,
            rut: formatRut(s.rut),
            groupId: s.groupId ?? '',
        });
        setErrors({});
        setIsOpen(true);
    };

    const openDelete = (s: StudentWithGroup): void => {
        setToDelete(s);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof FormState, string>> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.name.trim()) next.name = 'Nombre requerido';
        if (!form.lastname.trim()) next.lastname = 'Apellido requerido';
        if (!emailRegex.test(form.email)) next.email = 'Email inválido';
        if (!form.rut.trim()) {
            next.rut = 'RUT requerido';
        } else if (!isValidRut(normalizeRut(form.rut))) {
            next.rut = 'RUT inválido';
        }
        if (!form.groupId) next.groupId = 'Seleccioná un grupo';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = (): void => {
        if (!validate()) return;
        startTransition(async () => {
            try {
                if (editing) await updateStudent(editing.id, form);
                else await createStudent(form);
                setIsOpen(false);
                router.refresh();
            } catch (err: unknown) {
                const msg =
                    err instanceof Error && err.message.includes('Unique constraint')
                        ? 'Ya existe un alumno con ese email o RUT.'
                        : 'Ocurrió un error. Intentá de nuevo.';
                setErrors({ general: msg });
            }
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            try {
                await deleteStudent(toDelete.id);
                setIsDelOpen(false);
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    // ── Import handlers ──────────────────────────────────────────────────────

    const resetImport = (): void => {
        setImportFile(null);
        setParsedRows(null);
        setParseErrors([]);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImportOpenChange = (open: boolean): void => {
        if (!open) resetImport();
        setImportOpen(open);
    };

    const downloadTemplate = async (): Promise<void> => {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        const wsData = [
            ['Nombre', 'Apellido', 'Email', 'RUT', 'Grupo'],
            [
                'Juan',
                'Pérez',
                'juan.perez@ejemplo.cl',
                '12.345.678-9',
                groups[0]?.name ?? '4to Año A',
            ],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
            { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

        if (groups.length > 0) {
            const wsGroups = XLSX.utils.aoa_to_sheet([
                ['Grupos disponibles (copiar exactamente)'],
                ...groups.map((g) => [g.name]),
            ]);
            wsGroups['!cols'] = [{ wch: 40 }];
            XLSX.utils.book_append_sheet(wb, wsGroups, 'Grupos');
        }

        XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setImportResult(null);
        setParsedRows(null);
        setParseErrors([]);

        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const wb = XLSX.read(new Uint8Array(data));

            const sheetName = wb.SheetNames.includes('Alumnos') ? 'Alumnos' : wb.SheetNames[0];
            if (!sheetName) {
                setParseErrors(['El archivo no contiene hojas válidas.']);
                setParsedRows([]);
                return;
            }
            const ws = wb.Sheets[sheetName];

            if (!ws) {
                setParseErrors(['El archivo no contiene hojas válidas.']);
                setParsedRows([]);
                return;
            }

            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
                defval: '',
            });

            if (rawRows.length === 0) {
                setParseErrors(['El archivo no tiene datos.']);
                setParsedRows([]);
                return;
            }

            const headers = Object.keys(rawRows[0] ?? {});
            const required = ['Nombre', 'Apellido', 'Email', 'RUT', 'Grupo'];
            const missing = required.filter((h) => !headers.includes(h));
            if (missing.length > 0) {
                setParseErrors([
                    `Columnas faltantes: ${missing.join(', ')}. Usá la plantilla oficial.`,
                ]);
                setParsedRows([]);
                return;
            }

            const groupMap = new Map(groups.map((g) => [g.name.toLowerCase().trim(), g.id]));
            const errs: string[] = [];
            const rows: ParsedRow[] = rawRows.map((row, i) => {
                const rowNum = i + 2;
                const groupName = String(row['Grupo'] ?? '').trim();
                const groupId = groupMap.get(groupName.toLowerCase()) ?? '';

                if (!groupId) {
                    errs.push(
                        `Fila ${rowNum}: grupo "${groupName || '(vacío)'}" no encontrado`,
                    );
                }

                return {
                    name: String(row['Nombre'] ?? '').trim(),
                    lastname: String(row['Apellido'] ?? '').trim(),
                    email: String(row['Email'] ?? '').trim(),
                    rut: normalizeRut(String(row['RUT'] ?? '').trim()),
                    groupId,
                    rowNum,
                };
            });

            setParsedRows(rows);
            setParseErrors(errs);
        } catch {
            setParseErrors(['No se pudo leer el archivo. Verificá que sea un Excel válido.']);
            setParsedRows([]);
        }
    };

    const validRows = parsedRows?.filter((r) => r.groupId) ?? [];

    const handleImport = (): void => {
        if (validRows.length === 0) return;
        startTransition(async () => {
            try {
                const result = await importStudents(validRows);
                setImportResult(result);
                router.refresh();
            } catch {
                setImportResult({
                    created: 0,
                    skipped: 0,
                    errors: [{ row: 0, message: 'Error inesperado. Intentá de nuevo.' }],
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Alumnos</h1>
                    <p className="text-sm text-muted-foreground">
                        {students.length} alumnos registrados
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => void downloadTemplate()}
                    >
                        <Download size={15} />
                        Plantilla
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setImportOpen(true)}
                    >
                        <Upload size={15} />
                        Importar
                    </Button>
                    <Button className="rounded-full" onClick={openCreate}>
                        <Plus size={16} />
                        Nuevo alumno
                    </Button>
                </div>
            </div>

            {/* Students table / empty state */}
            {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20">
                    <GraduationCap size={40} className="mb-3 text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">Todavía no hay alumnos</p>
                    <p className="mt-1 text-sm text-muted-foreground/70">
                        Creá el primero o importá desde Excel.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            size="sm"
                            onClick={() => setImportOpen(true)}
                        >
                            <Upload size={14} />
                            Importar
                        </Button>
                        <Button className="rounded-full" size="sm" onClick={openCreate}>
                            <Plus size={14} />
                            Agregar alumno
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Alumno
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    RUT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Grupo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {students.map((s) => (
                                <tr key={s.id} className="transition-colors hover:bg-muted/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                {s.name[0]}
                                                {s.lastname[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {s.name} {s.lastname}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {s.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                        {formatRut(s.rut)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.group ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                <Users size={12} />
                                                {s.group.name}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                Sin grupo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => openEdit(s)}
                                            >
                                                <Edit2 size={13} />
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => openDelete(s)}
                                            >
                                                <Trash2 size={13} />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar alumno' : 'Nuevo alumno'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        {errors.general && (
                            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {errors.general}
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Nombre</label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className={errors.name ? 'border-destructive' : ''}
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Apellido</label>
                                <Input
                                    value={form.lastname}
                                    onChange={(e) => setField('lastname', e.target.value)}
                                    className={errors.lastname ? 'border-destructive' : ''}
                                />
                                {errors.lastname && (
                                    <p className="text-xs text-destructive">{errors.lastname}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>
                        <RutInput
                            label="RUT"
                            value={form.rut}
                            onChange={(v) => setField('rut', v)}
                            error={errors.rut}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Grupo</label>
                            <Select
                                value={form.groupId}
                                onValueChange={(v) => setField('groupId', v)}
                            >
                                <SelectTrigger
                                    className={errors.groupId ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Seleccioná un grupo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((g) => (
                                        <SelectItem key={g.id} value={g.id}>
                                            {g.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.groupId && (
                                <p className="text-xs text-destructive">{errors.groupId}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleSave}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            {editing ? 'Guardar cambios' : 'Crear alumno'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar alumno</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de eliminar a{' '}
                        <strong className="text-foreground">
                            {toDelete?.name} {toDelete?.lastname}
                        </strong>
                        ? Esta acción no se puede deshacer.
                    </p>
                    {deleteError && (
                        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsDelOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import dialog */}
            <Dialog open={importOpen} onOpenChange={handleImportOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Importar alumnos</DialogTitle>
                    </DialogHeader>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => void handleFileChange(e)}
                    />

                    {importResult ? (
                        /* Step 3: results */
                        <div className="flex flex-col gap-3 py-2">
                            {importResult.created > 0 && (
                                <div className="flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3">
                                    <CheckCircle2 size={18} className="shrink-0 text-success" />
                                    <p className="text-sm font-medium text-success">
                                        {importResult.created} alumno
                                        {importResult.created !== 1 ? 's' : ''} importado
                                        {importResult.created !== 1 ? 's' : ''} exitosamente
                                    </p>
                                </div>
                            )}
                            {importResult.skipped > 0 && (
                                <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                                    <Info size={18} className="shrink-0 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {importResult.skipped} omitido
                                        {importResult.skipped !== 1 ? 's' : ''} (ya existían)
                                    </p>
                                </div>
                            )}
                            {importResult.errors.length > 0 && (
                                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                                    <p className="mb-1.5 text-sm font-medium text-destructive">
                                        {importResult.errors.length} fila
                                        {importResult.errors.length !== 1 ? 's' : ''} con errores:
                                    </p>
                                    <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs text-destructive/80">
                                        {importResult.errors.map((e, i) => (
                                            <li key={i}>
                                                •{' '}
                                                {e.row > 0 ? `Fila ${e.row}: ` : ''}
                                                {e.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {importResult.created === 0 &&
                                importResult.skipped === 0 &&
                                importResult.errors.length === 0 && (
                                    <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                                        <Info size={18} className="shrink-0 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            No se procesó ningún alumno.
                                        </p>
                                    </div>
                                )}
                        </div>
                    ) : parsedRows !== null ? (
                        /* Step 2: file parsed, show summary */
                        <div className="flex flex-col gap-3 py-2">
                            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                                <FileSpreadsheet size={18} className="shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {importFile?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {parsedRows.length} fila
                                        {parsedRows.length !== 1 ? 's' : ''} encontradas
                                        {validRows.length < parsedRows.length && (
                                            <span className="text-warning">
                                                {' '}
                                                · {validRows.length} válidas
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetImport}
                                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {parseErrors.length > 0 && (
                                <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <AlertTriangle size={15} className="shrink-0 text-warning" />
                                        <p className="text-sm font-medium text-warning">
                                            {parseErrors.length} fila
                                            {parseErrors.length !== 1 ? 's' : ''} se omitirán:
                                        </p>
                                    </div>
                                    <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs text-warning/80">
                                        {parseErrors.map((e, i) => (
                                            <li key={i}>• {e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {validRows.length === 0 && (
                                <p className="text-center text-sm text-destructive">
                                    No hay filas válidas para importar.
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Step 1: file selector */
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Upload size={30} className="text-muted-foreground" />
                            <div className="text-center">
                                <p className="font-medium text-foreground">
                                    Seleccioná el archivo Excel
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Formato .xlsx con las columnas de la plantilla
                                </p>
                            </div>
                            <span className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
                                Buscar archivo
                            </span>
                        </button>
                    )}

                    <DialogFooter>
                        {importResult ? (
                            <Button
                                className="rounded-full"
                                onClick={() => handleImportOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => handleImportOpenChange(false)}
                                    disabled={isPending}
                                >
                                    Cancelar
                                </Button>
                                {validRows.length > 0 && (
                                    <Button
                                        className="rounded-full"
                                        disabled={isPending}
                                        onClick={handleImport}
                                    >
                                        {isPending && <Loader2 className="animate-spin" />}
                                        Importar {validRows.length} alumno
                                        {validRows.length !== 1 ? 's' : ''}
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
