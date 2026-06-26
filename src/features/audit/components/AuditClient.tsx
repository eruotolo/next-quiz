'use client';

import { AUDIT_ACTION_LABEL } from '@/features/audit/lib/actions';
import type { AuditActionKey } from '@/features/audit/lib/actions';
import type { AuditQuery } from '@/features/audit/schemas/audit.schemas';
import type { AuditLogsResult, InstitutionOption } from '@/features/audit/types/audit.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { ScrollText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useTransition } from 'react';

interface Props {
    result: AuditLogsResult;
    distinctActions: AuditActionKey[];
    institutions: InstitutionOption[];
    currentFilters: AuditQuery;
}

const DATE_FMT = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
});

function formatDate(value: Date | string): string {
    return DATE_FMT.format(new Date(value));
}

function truncate(str: string | null, len: number): string {
    if (!str) return '—';
    return str.length > len ? `${str.slice(0, len)}…` : str;
}

export function AuditClient({ result, distinctActions, institutions, currentFilters }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: URL builder with optional filter params
    function buildUrl(overrides: Record<string, string | undefined>): string {
        const merged: Record<string, string> = {
            ...(currentFilters.q ? { q: currentFilters.q } : {}),
            ...(currentFilters.action ? { action: currentFilters.action } : {}),
            ...(currentFilters.institutionId
                ? { institutionId: currentFilters.institutionId }
                : {}),
            ...(currentFilters.status ? { status: currentFilters.status } : {}),
            ...(currentFilters.from ? { from: currentFilters.from } : {}),
            ...(currentFilters.to ? { to: currentFilters.to } : {}),
            page: String(currentFilters.page),
            ...overrides,
        };
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(merged)) {
            if (v) params.set(k, v);
        }
        return `/config/auditoria?${params.toString()}`;
    }

    function navigate(overrides: Record<string, string | undefined>): void {
        startTransition(() => router.push(buildUrl(overrides)));
    }

    function handleSearch(value: string): void {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            startTransition(() => router.replace(buildUrl({ q: value || undefined, page: '1' })));
        }, 300);
    }

    function handleSelect(key: string, value: string): void {
        navigate({ [key]: value === 'all' ? undefined : value, page: '1' });
    }

    function handleDate(key: string, value: string): void {
        navigate({ [key]: value || undefined, page: '1' });
    }

    function clearFilters(): void {
        startTransition(() => router.push('/config/auditoria'));
    }

    const hasFilters =
        !!currentFilters.q ||
        !!currentFilters.action ||
        !!currentFilters.institutionId ||
        !!currentFilters.status ||
        !!currentFilters.from ||
        !!currentFilters.to;

    return (
        <>
            {/* Filter bar */}
            <div className="border-border flex flex-wrap items-center gap-2 border-b bg-white px-8 py-3">
                <Input
                    placeholder="Buscar por email, IP…"
                    defaultValue={currentFilters.q ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border-border h-[38px] w-56 bg-white text-sm"
                />

                <Select
                    value={currentFilters.action ?? 'all'}
                    onValueChange={(v) => handleSelect('action', v)}
                >
                    <SelectTrigger className="border-border h-[38px] w-44 bg-white text-sm">
                        <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent className="border-border rounded-xl shadow-xl">
                        <SelectItem value="all">Todas las acciones</SelectItem>
                        {distinctActions.map((a) => (
                            <SelectItem key={a} value={a}>
                                {AUDIT_ACTION_LABEL[a] ?? a}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={currentFilters.institutionId ?? 'all'}
                    onValueChange={(v) => handleSelect('institutionId', v)}
                >
                    <SelectTrigger className="border-border h-[38px] w-52 bg-white text-sm">
                        <SelectValue placeholder="Institución" />
                    </SelectTrigger>
                    <SelectContent className="border-border rounded-xl shadow-xl">
                        <SelectItem value="all">Todas las instituciones</SelectItem>
                        {institutions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                                {i.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={currentFilters.status ?? 'all'}
                    onValueChange={(v) => handleSelect('status', v)}
                >
                    <SelectTrigger className="border-border h-[38px] w-36 bg-white text-sm">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="border-border rounded-xl shadow-xl">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="success">Exitoso</SelectItem>
                        <SelectItem value="failure">Fallido</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5">
                    <span className="text-mute text-[11px] whitespace-nowrap">Desde</span>
                    <Input
                        type="date"
                        defaultValue={currentFilters.from ?? ''}
                        onChange={(e) => handleDate('from', e.target.value)}
                        className="border-border h-[38px] w-36 bg-white text-sm"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-mute text-[11px] whitespace-nowrap">Hasta</span>
                    <Input
                        type="date"
                        defaultValue={currentFilters.to ?? ''}
                        onChange={(e) => handleDate('to', e.target.value)}
                        className="border-border h-[38px] w-36 bg-white text-sm"
                    />
                </div>

                <div className="flex-1" />

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-mute hover:text-ink gap-1.5"
                    >
                        <X size={13} />
                        Limpiar
                    </Button>
                )}

                <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                    {result.total.toLocaleString('es-CL')} eventos
                </span>
            </div>

            <main
                className={`flex-1 overflow-auto p-8 transition-opacity ${isPending ? 'opacity-60' : ''}`}
            >
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <ScrollText size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            {hasFilters
                                ? 'Sin eventos con los filtros aplicados'
                                : 'Aún no hay eventos registrados'}
                        </p>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-mute mt-4"
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </Card>
                ) : (
                    <Card className="border-border overflow-visible p-0 shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="border-border border-b hover:bg-transparent">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Institución</TableHead>
                                    <TableHead>Entidad</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>User-Agent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.items.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="text-mute text-[12px] whitespace-nowrap">
                                            {formatDate(row.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="text-[11px] font-medium whitespace-nowrap"
                                            >
                                                {AUDIT_ACTION_LABEL[row.action as AuditActionKey] ??
                                                    row.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {row.status === 'success' ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    Exitoso
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                                    Fallido
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-ink text-[13px] font-medium">
                                                {row.actor
                                                    ? `${row.actor.name} ${row.actor.lastname}`
                                                    : truncate(row.actorEmail, 28)}
                                            </div>
                                            {row.actorRole && (
                                                <div className="text-mute text-[11px]">
                                                    {row.actorRole}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-mute text-[12px]">
                                            {row.institution?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.entity ? (
                                                <span className="text-ink text-[12px] font-medium">
                                                    {row.entity}
                                                </span>
                                            ) : (
                                                <span className="text-mute text-[12px]">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {row.ip ?? '—'}
                                        </TableCell>
                                        <TableCell
                                            className="text-mute max-w-[180px] truncate text-[11px]"
                                            title={row.userAgent ?? undefined}
                                        >
                                            {truncate(row.userAgent, 40)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <TablePaginator
                            page={result.page}
                            perPage={result.perPage}
                            total={result.total}
                            onPageChange={(p) => navigate({ page: String(p) })}
                        />
                    </Card>
                )}
            </main>
        </>
    );
}
