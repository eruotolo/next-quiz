'use client';

import {
    createStudent,
    deleteStudent,
    importStudents,
    toggleStudentActive,
    updateStudent,
} from '@/features/students/actions/mutations';
import type { ImportStudentsResult } from '@/features/students/actions/mutations';
import { getStudentAcademicHistory } from '@/features/students/actions/academic-history';
import type { AcademicResultRow } from '@/features/students/actions/academic-history';
import { toast } from 'sonner';
import { RutField } from '@/shared/components/ui/rut-field';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { Avatar } from '@/shared/components/ui/avatar';
import { Tag } from '@/shared/components/ui/badge';
import { formatRut, normalizeRut } from '@/shared/lib/rut';
import { calcGrade } from '@/shared/lib/grade';
import { studentSchema } from '@/features/students/schemas/student.schemas';
import type { Group, User } from '@prisma/client';
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    Download,
    Edit2,
    FileSpreadsheet,
    GraduationCap,
    Info,
    Loader2,
    MoreHorizontal,
    Plus,
    Power,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useRef, useState, useTransition } from 'react';
import { cn } from '@/shared/lib/utils';

interface ResultWithExam {
    id: string;
    score: number;
    maxScore: number;
    completedAt: Date;
    exam: {
        title: string;
        maxGrade: number;
        passingGrade: number;
        passingPercentage: number;
    };
}

interface StudentWithGroup extends User {
    group: (Group & { program: { id: string; name: string } | null }) | null;
    results: ResultWithExam[];
}

interface Props {
    slug: string;
    students: StudentWithGroup[];
    groups: Group[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canToggleActive: boolean;
    isProfesor: boolean;
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: componente CRUD con tabla, modal, importación y filtros
export function StudentsClient({
    slug,
    students,
    groups,
    canCreate,
    canEdit: _canEdit,
    canDelete: _canDelete,
    canToggleActive,
    isProfesor,
}: Props) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [academicOpen, setAcademicOpen] = useState(false);
    const [editing, setEditing] = useState<StudentWithGroup | null>(null);
    const [toDelete, setToDelete] = useState<StudentWithGroup | null>(null);
    const [academicStudent, setAcademicStudent] = useState<StudentWithGroup | null>(null);
    const [academicHistory, setAcademicHistory] = useState<AcademicResultRow[] | null>(null);
    const [academicError, setAcademicError] = useState<string | null>(null);
    const [academicYearFilter, setAcademicYearFilter] = useState('all');
    const [academicMateriaFilter, setAcademicMateriaFilter] = useState('all');
    const [academicGroupFilter, setAcademicGroupFilter] = useState('all');
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isPendingAcademic, startAcademicTransition] = useTransition();

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

    const openAcademic = (s: StudentWithGroup): void => {
        setAcademicStudent(s);
        setAcademicHistory(null);
        setAcademicError(null);
        setAcademicYearFilter('all');
        setAcademicMateriaFilter('all');
        setAcademicGroupFilter('all');
        setAcademicOpen(true);
        startAcademicTransition(async () => {
            const result = await getStudentAcademicHistory(slug, s.id);
            if ('error' in result) {
                setAcademicError(result.error);
            } else {
                setAcademicHistory(result.data);
            }
        });
    };

    const validate = (): boolean => {
        // Misma fuente de verdad que el servidor: validar con el schema Zod.
        const parsed = studentSchema.safeParse(form);
        if (parsed.success) {
            setErrors({});
            return true;
        }
        const next: Partial<Record<keyof FormState, string>> = {};
        for (const issue of parsed.error.issues) {
            const key = issue.path[0] as keyof FormState | undefined;
            if (key && !next[key]) next[key] = issue.message;
        }
        setErrors(next);
        return false;
    };

    const handleSave = (): void => {
        if (!validate()) return;
        startTransition(async () => {
            const result = editing
                ? await updateStudent(slug, editing.id, form)
                : await createStudent(slug, form);
            if (result.error) {
                setErrors({ general: result.error });
                return;
            }
            setIsOpen(false);
            toast.success(editing ? 'Estudiante actualizado' : 'Estudiante creado');
            router.refresh();
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteStudent(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            toast.success('Estudiante eliminado');
            router.refresh();
        });
    };

    const handleToggleActive = (s: StudentWithGroup): void => {
        startTransition(async () => {
            const result = await toggleStudentActive(slug, s.id, !s.active);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(s.active ? 'Estudiante desactivado' : 'Estudiante activado');
            router.refresh();
        });
    };

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
        ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

        if (groups.length > 0) {
            const wsGroups = XLSX.utils.aoa_to_sheet([
                ['Grupos disponibles (copiar exactamente)'],
                ...groups.map((g) => [g.name]),
            ]);
            wsGroups['!cols'] = [{ wch: 40 }];
            XLSX.utils.book_append_sheet(wb, wsGroups, 'Grupos');
        }

        XLSX.writeFile(wb, 'plantilla_estudiantes.xlsx');
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
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
                const groupName = String(row.Grupo ?? '').trim();
                const groupId = groupMap.get(groupName.toLowerCase()) ?? '';

                if (!groupId) {
                    errs.push(`Fila ${rowNum}: grupo "${groupName || '(vacío)'}" no encontrado`);
                }

                return {
                    name: String(row.Nombre ?? '').trim(),
                    lastname: String(row.Apellido ?? '').trim(),
                    email: String(row.Email ?? '').trim(),
                    rut: normalizeRut(String(row.RUT ?? '').trim()),
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

    const filteredStudents = students.filter((s) => {
        const q = search.trim().toLowerCase();
        if (q) {
            const haystack =
                `${s.name} ${s.lastname} ${s.email} ${formatRut(s.rut)} ${s.rut}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        if (groupFilter !== 'all' && s.groupId !== groupFilter) return false;
        if (statusFilter === 'active' && !s.active) return false;
        if (statusFilter === 'inactive' && s.active) return false;
        return true;
    });
    const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageStudents = filteredStudents.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const handleImport = (): void => {
        if (validRows.length === 0) return;
        startTransition(async () => {
            const result = await importStudents(slug, validRows);
            if (result.error || !result.data) {
                setImportResult({
                    created: 0,
                    skipped: 0,
                    errors: [
                        { row: 0, message: result.error ?? 'Error inesperado. Intenta de nuevo.' },
                    ],
                });
                return;
            }
            setImportResult(result.data);
            router.refresh();
        });
    };

    const renderAcademicRow = (r: AcademicResultRow) => (
        <TableRow key={r.id} className="border-border h-12 border-b last:border-0">
            <TableCell>
                <span className="text-ink text-[13px] leading-tight font-medium">
                    {r.exam.title}
                </span>
            </TableCell>
            <TableCell>
                {r.exam.courseSectionName ? (
                    <Tag tone="outline" className="border-border h-5 text-[10.5px]">
                        {r.exam.courseSectionName}
                    </Tag>
                ) : (
                    <span className="text-mute text-[12px]">—</span>
                )}
            </TableCell>
            <TableCell className="text-ink-dim text-[12px]">
                {r.exam.periodName ??
                    (r.exam.periodYear
                        ? String(r.exam.periodYear)
                        : String(new Date(r.completedAt).getFullYear()))}
            </TableCell>
            <TableCell className="text-ink-dim text-[12px]">{r.exam.groupName ?? '—'}</TableCell>
            <TableCell className="text-mute text-[12px]">
                {new Date(r.completedAt).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                })}
            </TableCell>
            <TableCell className="text-right">
                <span
                    className={cn(
                        'font-mono text-[14px] font-bold',
                        r.passed ? 'text-[#0f7c4a]' : 'text-[#d5301f]',
                    )}
                >
                    {r.grade.toFixed(1)}
                </span>
            </TableCell>
        </TableRow>
    );

    // ── Academic history derived state ────────────────────────────────────────
    const academicYears = academicHistory
        ? [
              ...new Set(
                  academicHistory.map(
                      (r) => r.exam.periodYear ?? new Date(r.completedAt).getFullYear(),
                  ),
              ),
          ].sort((a, b) => b - a)
        : [];
    const academicMaterias = academicHistory
        ? [
              ...new Set(
                  academicHistory
                      .map((r) => r.exam.courseSectionName)
                      .filter((m): m is string => m !== null),
              ),
          ].sort()
        : [];
    const academicGroups = academicHistory
        ? [
              ...new Set(
                  academicHistory
                      .map((r) => r.exam.groupName)
                      .filter((g): g is string => g !== null),
              ),
          ].sort()
        : [];
    const academicFiltered = academicHistory
        ? academicHistory.filter((r) => {
              const year = r.exam.periodYear ?? new Date(r.completedAt).getFullYear();
              if (academicYearFilter !== 'all' && String(year) !== academicYearFilter) return false;
              if (
                  academicMateriaFilter !== 'all' &&
                  r.exam.courseSectionName !== academicMateriaFilter
              )
                  return false;
              if (academicGroupFilter !== 'all' && r.exam.groupName !== academicGroupFilter)
                  return false;
              return true;
          })
        : [];
    const academicAvgGrade =
        academicFiltered.length > 0
            ? academicFiltered.reduce((sum, r) => sum + r.grade, 0) / academicFiltered.length
            : null;
    const academicPassRate =
        academicFiltered.length > 0
            ? Math.round(
                  (academicFiltered.filter((r) => r.passed).length / academicFiltered.length) * 100,
              )
            : null;

    return (
        <>
            {/* Filter bar + actions */}
            <div className="border-border flex items-center gap-2 border-b bg-white px-8 py-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-mute absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        placeholder="Buscar por nombre, email o RUT…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="border-border focus-visible:ring-primary/20 h-[38px] bg-white pl-9"
                    />
                </div>
                <SearchableSelect
                    size="sm"
                    value={groupFilter}
                    onChange={(v) => {
                        setGroupFilter(v);
                        setPage(1);
                    }}
                    className="w-[170px]"
                    options={[
                        { value: 'all', label: 'Curso · Todos' },
                        ...groups.map((g) => ({ value: g.id, label: g.name })),
                    ]}
                />
                <SearchableSelect
                    size="sm"
                    value={statusFilter}
                    onChange={(v) => {
                        setStatusFilter(v as 'all' | 'active' | 'inactive');
                        setPage(1);
                    }}
                    className="w-[160px]"
                    options={[
                        { value: 'all', label: 'Estado · Todos' },
                        { value: 'active', label: 'Activos' },
                        { value: 'inactive', label: 'Inactivos' },
                    ]}
                />
                <div className="flex-1" />
                <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                    {filteredStudents.length} visibles · {students.length} totales
                </span>
                {canCreate && (
                    <>
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => void downloadTemplate()}
                            className="gap-2"
                        >
                            <Download size={15} />
                            Plantilla
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setImportOpen(true)}
                            className="gap-2"
                        >
                            <Upload size={15} />
                            Importar Excel
                        </Button>
                        <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                            <Plus size={16} />
                            Agregar estudiante
                        </Button>
                    </>
                )}
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-8">
                {students.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <GraduationCap size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">Todavía no hay estudiantes</p>
                        <p className="text-mute mt-1 text-sm">
                            {canCreate
                                ? 'Crea el primero o importa desde Excel.'
                                : 'No tienes estudiantes asignados en tus grupos.'}
                        </p>
                        {canCreate && (
                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => setImportOpen(true)}
                                >
                                    <Upload size={16} />
                                    Importar Excel
                                </Button>
                                <Button variant="primary" size="md" onClick={openCreate}>
                                    <Plus size={16} />
                                    Agregar estudiante
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="border-border overflow-visible p-0 shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="border-border border-b hover:bg-transparent">
                                    <TableHead className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="border-border size-4 cursor-pointer rounded"
                                        />
                                    </TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[100px]">Curso</TableHead>
                                    <TableHead className="w-[120px]">Estado</TableHead>
                                    <TableHead className="w-[180px] text-right">
                                        Último Examen
                                    </TableHead>
                                    <TableHead className="w-[100px] text-right">Promedio</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageStudents.length === 0 && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={8}
                                            className="text-mute py-12 text-center text-sm"
                                        >
                                            No hay estudiantes que coincidan con los filtros.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {pageStudents.map((s) => (
                                    <TableRow
                                        key={s.id}
                                        className="group border-border h-16 border-b last:border-0"
                                    >
                                        <TableCell className="text-center">
                                            <input
                                                type="checkbox"
                                                className="border-border size-4 cursor-pointer rounded"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${s.name} ${s.lastname}`}
                                                    size={32}
                                                    className="ring-border shadow-sm ring-1"
                                                />
                                                <div className="flex flex-col">
                                                    <span
                                                        className={cn(
                                                            'text-ink text-[13.5px] font-bold',
                                                            !s.active && 'text-mute opacity-50',
                                                        )}
                                                    >
                                                        {s.name} {s.lastname}
                                                    </span>
                                                    <span className="text-mute text-[11.5px]">
                                                        {s.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-ink-dim font-mono text-[12px]">
                                            {formatRut(s.rut)}
                                        </TableCell>
                                        <TableCell>
                                            {s.group ? (
                                                <div className="flex flex-col gap-1">
                                                    <Tag
                                                        tone="outline"
                                                        className="border-border bg-paper-warm/50 h-6 w-fit font-mono text-[11px]"
                                                    >
                                                        {s.group.name}
                                                    </Tag>
                                                    {s.group.program && (
                                                        <span className="text-mute text-[10.5px] font-medium">
                                                            {s.group.program.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-mute text-[11.5px]">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Tag
                                                tone={s.active ? 'success' : 'default'}
                                                className="h-6 px-2.5 text-[10.5px] font-bold"
                                            >
                                                {s.active ? 'Activa' : 'Inactiva'}
                                            </Tag>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(() => {
                                                const r = s.results[0];
                                                if (!r)
                                                    return (
                                                        <span className="text-mute font-mono text-[12.5px]">
                                                            —
                                                        </span>
                                                    );
                                                const g = calcGrade(
                                                    r.score,
                                                    r.maxScore,
                                                    r.exam.maxGrade,
                                                    r.exam.passingGrade,
                                                    r.exam.passingPercentage,
                                                );
                                                return (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="text-mute max-w-[160px] truncate text-right text-[10.5px]">
                                                            {r.exam.title}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'font-mono text-[13px] font-bold',
                                                                g >= r.exam.passingGrade
                                                                    ? 'text-[#0f7c4a]'
                                                                    : 'text-[#d5301f]',
                                                            )}
                                                        >
                                                            {g.toFixed(1)}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(() => {
                                                if (s.results.length === 0)
                                                    return <span className="text-mute">—</span>;
                                                const avg =
                                                    s.results.reduce(
                                                        (sum, r) =>
                                                            sum +
                                                            calcGrade(
                                                                r.score,
                                                                r.maxScore,
                                                                r.exam.maxGrade,
                                                                r.exam.passingGrade,
                                                                r.exam.passingPercentage,
                                                            ),
                                                        0,
                                                    ) / s.results.length;
                                                return (
                                                    <span
                                                        className={cn(
                                                            'font-mono text-[13.5px] font-bold',
                                                            avg >= 4.0
                                                                ? 'text-[#0f7c4a]'
                                                                : 'text-[#d5301f]',
                                                        )}
                                                    >
                                                        {avg.toFixed(1)}
                                                    </span>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreHorizontal
                                                            size={16}
                                                            className="text-mute"
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="border-border w-44 rounded-xl shadow-xl"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => openAcademic(s)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <BookOpen size={14} /> Académico
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openEdit(s)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <Edit2 size={14} /> Editar
                                                    </DropdownMenuItem>
                                                    {canToggleActive && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleActive(s)}
                                                            className="cursor-pointer gap-2 py-2"
                                                        >
                                                            <Power size={14} />{' '}
                                                            {s.active ? 'Desactivar' : 'Activar'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => openDelete(s)}
                                                        className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePaginator
                            page={currentPage}
                            perPage={PAGE_SIZE}
                            total={filteredStudents.length}
                            onPageChange={setPage}
                        />
                    </Card>
                )}
            </main>

            {/* Dialogs */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing ? 'Editar estudiante' : 'Nuevo estudiante'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o editar un estudiante.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        {errors.general && (
                            <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                                {errors.general}
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="stu-name"
                                    className="text-ink text-[12.5px] font-bold"
                                >
                                    Nombre
                                </label>
                                <Input
                                    id="stu-name"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.name && 'border-destructive',
                                    )}
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="stu-lastname"
                                    className="text-ink text-[12.5px] font-bold"
                                >
                                    Apellido
                                </label>
                                <Input
                                    id="stu-lastname"
                                    value={form.lastname}
                                    onChange={(e) => setField('lastname', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.lastname && 'border-destructive',
                                    )}
                                />
                                {errors.lastname && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.lastname}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="stu-email" className="text-ink text-[12.5px] font-bold">
                                Email
                            </label>
                            <Input
                                id="stu-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    errors.email && 'border-destructive',
                                )}
                            />
                            {errors.email && (
                                <p className="text-destructive text-xs font-medium">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[12.5px] font-bold">RUT</span>
                            <RutField
                                value={form.rut}
                                onChange={(v) => setField('rut', v)}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                            {errors.rut && (
                                <p className="text-destructive text-[12px]">{errors.rut}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[12.5px] font-bold">Grupo</span>
                            <SearchableSelect
                                value={form.groupId}
                                onChange={(v) => setField('groupId', v)}
                                placeholder="Seleccioná un grupo"
                                options={groups.map((g) => ({ value: g.id, label: g.name }))}
                                className={errors.groupId ? 'ring-destructive ring-1' : undefined}
                            />
                            {errors.groupId && (
                                <p className="text-destructive text-xs font-medium">
                                    {errors.groupId}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="ink" size="md" disabled={isPending} onClick={handleSave}>
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            {editing ? 'Guardar cambios' : 'Crear estudiante'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar estudiante
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar a{' '}
                            <strong className="text-ink">
                                {toDelete?.name} {toDelete?.lastname}
                            </strong>
                            ? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Import dialog */}
            <Dialog open={importOpen} onOpenChange={handleImportOpenChange}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            Importar estudiantes
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Importá estudiantes de forma masiva desde un archivo.
                        </DialogDescription>
                    </DialogHeader>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => void handleFileChange(e)}
                    />

                    {importResult ? (
                        <div className="flex flex-col gap-3 py-2">
                            {importResult.created > 0 && (
                                <div className="bg-success-wash border-success/20 flex items-center gap-3 rounded-[14px] border px-4 py-3">
                                    <CheckCircle2 size={18} className="text-success shrink-0" />
                                    <p className="text-success text-[13px] font-bold">
                                        {importResult.created} estudiante
                                        {importResult.created !== 1 ? 's' : ''} importado
                                        {importResult.created !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                            {importResult.skipped > 0 && (
                                <div className="bg-paper-warm border-border flex items-center gap-3 rounded-[14px] border px-4 py-3">
                                    <Info size={18} className="text-mute shrink-0" />
                                    <p className="text-mute text-[13px] font-medium">
                                        {importResult.skipped} omitido
                                        {importResult.skipped !== 1 ? 's' : ''} (ya existían)
                                    </p>
                                </div>
                            )}
                            {importResult.errors.length > 0 && (
                                <div className="bg-danger-wash border-destructive/20 rounded-[14px] border px-4 py-3">
                                    <p className="text-destructive mb-1 text-[13px] font-bold">
                                        {importResult.errors.length} fila
                                        {importResult.errors.length !== 1 ? 's' : ''} con errores:
                                    </p>
                                    <ul className="text-destructive/80 max-h-28 space-y-0.5 overflow-y-auto font-mono text-[10.5px]">
                                        {importResult.errors.map((e) => (
                                            <li key={`${e.row}-${e.message}`}>
                                                • Fila {e.row}: {e.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : parsedRows !== null ? (
                        <div className="flex flex-col gap-3 py-2">
                            <div className="bg-paper-warm border-border flex items-center gap-3 rounded-[14px] border px-4 py-3">
                                <FileSpreadsheet size={18} className="text-mute shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink truncate text-[13px] font-bold">
                                        {importFile?.name}
                                    </p>
                                    <p className="text-mute font-mono text-[11px]">
                                        {parsedRows.length} FILAS ENCONTRADAS
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetImport}
                                    className="text-mute hover:text-ink transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {parseErrors.length > 0 && (
                                <div className="bg-warning-wash border-warning/20 rounded-[14px] border px-4 py-3">
                                    <div className="text-warning mb-1.5 flex items-center gap-2">
                                        <AlertTriangle size={15} />
                                        <p className="text-[13px] font-bold">
                                            Errores de validación:
                                        </p>
                                    </div>
                                    <ul className="text-warning-foreground/80 max-h-28 space-y-0.5 overflow-y-auto font-mono text-[10.5px]">
                                        {parseErrors.map((e) => (
                                            <li key={e}>• {e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-border bg-paper-warm/30 hover:bg-paper-warm/50 group flex flex-col items-center gap-4 rounded-[22px] border-2 border-dashed py-12 transition-colors"
                        >
                            <div className="ring-border rounded-full bg-white p-4 shadow-sm ring-1 transition-transform group-hover:scale-110">
                                <Upload size={28} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-ink text-[16px] font-bold">
                                    Seleccioná el archivo Excel
                                </p>
                                <p className="text-mute mt-1 text-[13px]">
                                    Formato .xlsx con las columnas de la plantilla
                                </p>
                            </div>
                        </button>
                    )}

                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        {importResult ? (
                            <Button
                                variant="ink"
                                size="md"
                                onClick={() => handleImportOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => handleImportOpenChange(false)}
                                    disabled={isPending}
                                >
                                    Cancelar
                                </Button>
                                {validRows.length > 0 && (
                                    <Button
                                        variant="primary"
                                        size="md"
                                        disabled={isPending}
                                        onClick={handleImport}
                                    >
                                        {isPending && <Loader2 className="mr-2 animate-spin" />}
                                        Importar {validRows.length} estudiantes
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal — Información Académica */}
            <Dialog open={academicOpen} onOpenChange={setAcademicOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            Información Académica
                            {academicStudent && (
                                <span className="text-mute ml-2 text-lg font-normal">
                                    — {academicStudent.name} {academicStudent.lastname}
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Historial de exámenes del estudiante.
                        </DialogDescription>
                    </DialogHeader>

                    {isPendingAcademic ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="text-mute size-6 animate-spin" />
                        </div>
                    ) : academicError ? (
                        <p className="text-destructive py-12 text-center text-sm">
                            {academicError}
                        </p>
                    ) : academicHistory !== null ? (
                        <div className="flex flex-col gap-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-paper rounded-[12px] px-4 py-3">
                                    <p className="text-mute text-[11px] font-bold tracking-wider uppercase">
                                        {isProfesor ? 'Exámenes (tu materia)' : 'Exámenes totales'}
                                    </p>
                                    <p className="text-ink font-display text-2xl font-bold">
                                        {academicFiltered.length}
                                    </p>
                                </div>
                                <div className="bg-paper rounded-[12px] px-4 py-3">
                                    <p className="text-mute text-[11px] font-bold tracking-wider uppercase">
                                        Promedio
                                    </p>
                                    <p
                                        className={cn(
                                            'font-display text-2xl font-bold',
                                            academicAvgGrade === null
                                                ? 'text-mute'
                                                : academicAvgGrade >= 4
                                                  ? 'text-[#0f7c4a]'
                                                  : 'text-[#d5301f]',
                                        )}
                                    >
                                        {academicAvgGrade !== null
                                            ? academicAvgGrade.toFixed(1)
                                            : '—'}
                                    </p>
                                </div>
                                <div className="bg-paper rounded-[12px] px-4 py-3">
                                    <p className="text-mute text-[11px] font-bold tracking-wider uppercase">
                                        Tasa aprobación
                                    </p>
                                    <p
                                        className={cn(
                                            'font-display text-2xl font-bold',
                                            academicPassRate === null
                                                ? 'text-mute'
                                                : academicPassRate >= 60
                                                  ? 'text-[#0f7c4a]'
                                                  : 'text-[#d5301f]',
                                        )}
                                    >
                                        {academicPassRate !== null ? `${academicPassRate}%` : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <SearchableSelect
                                    size="sm"
                                    value={academicYearFilter}
                                    onChange={setAcademicYearFilter}
                                    className="w-[150px]"
                                    options={[
                                        { value: 'all', label: 'Año · Todos' },
                                        ...academicYears.map((y) => ({
                                            value: String(y),
                                            label: String(y),
                                        })),
                                    ]}
                                />
                                <SearchableSelect
                                    size="sm"
                                    value={academicMateriaFilter}
                                    onChange={setAcademicMateriaFilter}
                                    className="w-[210px]"
                                    options={[
                                        { value: 'all', label: 'Materia · Todas' },
                                        ...academicMaterias.map((m) => ({ value: m, label: m })),
                                    ]}
                                />
                                <SearchableSelect
                                    size="sm"
                                    value={academicGroupFilter}
                                    onChange={setAcademicGroupFilter}
                                    className="w-[185px]"
                                    options={[
                                        { value: 'all', label: 'Grupo · Todos' },
                                        ...academicGroups.map((g) => ({ value: g, label: g })),
                                    ]}
                                />
                                <span className="text-mute ml-auto font-mono text-[11px]">
                                    {academicFiltered.length} resultado
                                    {academicFiltered.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Table */}
                            <div className="border-border overflow-hidden rounded-[14px] border">
                                <Table>
                                    <TableHeader className="bg-paper">
                                        <TableRow className="border-border border-b hover:bg-transparent">
                                            <TableHead>Examen</TableHead>
                                            <TableHead className="w-[160px]">Materia</TableHead>
                                            <TableHead className="w-[110px]">Período</TableHead>
                                            <TableHead className="w-[130px]">Grupo</TableHead>
                                            <TableHead className="w-[100px]">Fecha</TableHead>
                                            <TableHead className="w-[70px] text-right">
                                                Nota
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {academicFiltered.length === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-mute py-12 text-center text-sm"
                                                >
                                                    No hay resultados para los filtros
                                                    seleccionados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            academicFiltered.map(renderAcademicRow)
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
