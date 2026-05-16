'use client';

import { AUDIT_ACTION_LABEL } from '@/features/audit/lib/actions';
import type { AuditActionKey } from '@/features/audit/lib/actions';
import type { AuditQuery } from '@/features/audit/schemas/audit.schemas';
import type { AuditLogsResult, InstitutionOption } from '@/features/audit/types/audit.types';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { ScrollText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
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

export function AuditClient({ result, distinctActions, institutions, currentFilters }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: URL builder with optional filter params
    function buildUrl(overrides: Record<string, string | undefined>): string {
        const merged: Record<string, string> = {
            ...(currentFilters.q ? { q: currentFilters.q } : {}),
            ...(currentFilters.action ? { action: currentFilters.action } : {}),
            ...(currentFilters.institutionId ? { institutionId: currentFilters.institutionId } : {}),
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
            startTransition(() =>
                router.replace(buildUrl({ q: value || undefined, page: '1' }))
            );
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
        <div className={`flex flex-col min-h-screen bg-paper transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            <AdminTopBar
                breadcrumb={['Sistema', 'Auditoría']}
                title="Auditoría"
                subtitle={`${result.total.toLocaleString('es-CL')} eventos registrados`}
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-8 py-3">
                <Input
                    placeholder="Buscar por email, IP…"
                    defaultValue={currentFilters.q ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="h-[38px] w-56 border-border bg-white text-sm"
                />

                <Select
                    value={currentFilters.action ?? 'all'}
                    onValueChange={(v) => handleSelect('action', v)}
                >
                    <SelectTrigger className="h-[38px] w-44 border-border bg-white text-sm">
                        <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
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
                    <SelectTrigger className="h-[38px] w-52 border-border bg-white text-sm">
                        <SelectValue placeholder="Institución" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
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
                    <SelectTrigger className="h-[38px] w-36 border-border bg-white text-sm">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="success">Exitoso</SelectItem>
                        <SelectItem value="failure">Fallido</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-mute whitespace-nowrap">Desde</span>
                    <Input
                        type="date"
                        defaultValue={currentFilters.from ?? ''}
                        onChange={(e) => handleDate('from', e.target.value)}
                        className="h-[38px] w-36 border-border bg-white text-sm"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-mute whitespace-nowrap">Hasta</span>
                    <Input
                        type="date"
                        defaultValue={currentFilters.to ?? ''}
                        onChange={(e) => handleDate('to', e.target.value)}
                        className="h-[38px] w-36 border-border bg-white text-sm"
                    />
                </div>

                <div className="flex-1" />

                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-mute hover:text-ink">
                        <X size={13} />
                        Limpiar
                    </Button>
                )}

                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {result.total.toLocaleString('es-CL')} eventos
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <ScrollText size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">
                            {hasFilters ? 'Sin eventos con los filtros aplicados' : 'Aún no hay eventos registrados'}
                        </p>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4 text-mute">
                                Limpiar filtros
                            </Button>
                        )}
                    </Card>
                ) : (
                    <Card className="p-0 overflow-visible border-border shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
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
                                                {AUDIT_ACTION_LABEL[row.action as AuditActionKey] ?? row.action}
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
                                            <div className="text-[13px] font-medium text-ink">
                                                {row.actor
                                                    ? `${row.actor.name} ${row.actor.lastname}`
                                                    : truncate(row.actorEmail, 28)}
                                            </div>
                                            {row.actorRole && (
                                                <div className="text-[11px] text-mute">
                                                    {row.actorRole}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-[12px] text-mute">
                                            {row.institution?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.entity ? (
                                                <span className="text-[12px] font-medium text-ink">
                                                    {row.entity}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-mute">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-[12px] text-mute">
                                            {row.ip ?? '—'}
                                        </TableCell>
                                        <TableCell
                                            className="max-w-[180px] truncate text-[11px] text-mute"
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
        </div>
    );
}
