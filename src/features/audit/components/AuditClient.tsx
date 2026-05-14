'use client';

import { AUDIT_ACTION_LABEL } from '@/features/audit/lib/actions';
import type { AuditActionKey } from '@/features/audit/lib/actions';
import type { AuditQuery } from '@/features/audit/schemas/audit.schemas';
import type { AuditLogsResult, InstitutionOption } from '@/features/audit/types/audit.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    ScrollText,
    X,
} from 'lucide-react';
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: filter+table+pagination inherently complex
export function AuditClient({ result, distinctActions, institutions, currentFilters }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const totalPages = Math.ceil(result.total / result.perPage);

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
        <div className={`flex flex-col gap-6 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-foreground text-[24px] font-extrabold tracking-tight">
                        Auditoría
                    </h1>
                    <p className="text-muted-foreground mt-1 text-[14px]">
                        {result.total.toLocaleString('es-CL')} eventos registrados
                    </p>
                </div>
                {hasFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                        <X size={14} />
                        Limpiar filtros
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="border-border rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="mb-3 flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground text-[13px] font-semibold uppercase tracking-wide">
                        Filtros
                    </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Input
                        placeholder="Buscar por email, IP…"
                        defaultValue={currentFilters.q ?? ''}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="h-9 text-sm"
                    />

                    <Select
                        value={currentFilters.action ?? 'all'}
                        onValueChange={(v) => handleSelect('action', v)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Acción" />
                        </SelectTrigger>
                        <SelectContent>
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
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Institución" />
                        </SelectTrigger>
                        <SelectContent>
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
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="success">Exitoso</SelectItem>
                            <SelectItem value="failure">Fallido</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[12px] whitespace-nowrap">
                            Desde
                        </span>
                        <Input
                            type="date"
                            defaultValue={currentFilters.from ?? ''}
                            onChange={(e) => handleDate('from', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[12px] whitespace-nowrap">
                            Hasta
                        </span>
                        <Input
                            type="date"
                            defaultValue={currentFilters.to ?? ''}
                            onChange={(e) => handleDate('to', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            {result.items.length === 0 ? (
                <div className="border-border flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white py-16">
                    <ScrollText size={36} className="text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground text-[14px] font-medium">
                        {hasFilters ? 'Sin eventos con los filtros aplicados' : 'Aún no hay eventos registrados'}
                    </p>
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border-border overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="border-border border-b">
                                <tr>
                                    {['Fecha', 'Acción', 'Estado', 'Usuario', 'Institución', 'Entidad', 'IP', 'User-Agent'].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className="text-muted-foreground px-4 py-3 text-left text-[11px] font-semibold tracking-wide uppercase"
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {result.items.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="text-muted-foreground px-4 py-3 text-[12px] whitespace-nowrap">
                                            {formatDate(row.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className="text-[11px] font-medium whitespace-nowrap"
                                            >
                                                {AUDIT_ACTION_LABEL[row.action as AuditActionKey] ?? row.action}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.status === 'success' ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    Exitoso
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                                    Fallido
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-foreground text-[12px] font-medium">
                                                {row.actor
                                                    ? `${row.actor.name} ${row.actor.lastname}`
                                                    : truncate(row.actorEmail, 28)}
                                            </div>
                                            {row.actorRole && (
                                                <div className="text-muted-foreground text-[11px]">
                                                    {row.actorRole}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 text-[12px]">
                                            {row.institution?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.entity ? (
                                                <div className="text-foreground text-[12px] font-medium">
                                                    {row.entity}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-[12px]">—</span>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 text-[12px] font-mono">
                                            {row.ip ?? '—'}
                                        </td>
                                        <td
                                            className="text-muted-foreground max-w-[180px] truncate px-4 py-3 text-[11px]"
                                            title={row.userAgent ?? undefined}
                                        >
                                            {truncate(row.userAgent, 40)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-border flex items-center justify-between border-t px-4 py-3">
                            <p className="text-muted-foreground text-[13px]">
                                Página{' '}
                                <span className="text-foreground font-semibold">
                                    {result.page}
                                </span>{' '}
                                de{' '}
                                <span className="text-foreground font-semibold">
                                    {totalPages}
                                </span>{' '}
                                · {result.total.toLocaleString('es-CL')} eventos
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={result.page <= 1 || isPending}
                                    onClick={() => navigate({ page: String(result.page - 1) })}
                                    className="gap-1"
                                >
                                    <ChevronLeft size={14} />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={result.page >= totalPages || isPending}
                                    onClick={() => navigate({ page: String(result.page + 1) })}
                                    className="gap-1"
                                >
                                    Siguiente
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
