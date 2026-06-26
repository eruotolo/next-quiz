'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    /** 'default' = h-11 para forms/modals · 'sm' = h-9 para barras de filtro */
    size?: 'default' | 'sm';
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Seleccioná una opción',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'Sin resultados',
    className,
    disabled,
    size = 'default',
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [pos, setPos] = useState<CSSProperties>({});
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selected = options.find((opt) => opt.value === value);

    const filtered = query.trim()
        ? options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    function handleToggle(): void {
        if (disabled) return;
        if (!open) {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) {
                setPos({
                    position: 'fixed',
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 9999,
                    pointerEvents: 'auto',
                });
            }
            setOpen(true);
            setQuery('');
        } else {
            setOpen(false);
        }
    }

    function handleSelect(optValue: string, optDisabled?: boolean): void {
        if (optDisabled) return;
        onChange(optValue);
        setOpen(false);
        setQuery('');
    }

    useEffect(() => {
        if (!open) return;
        function onOutside(e: MouseEvent): void {
            const t = e.target as Node;
            if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onEscape(e: KeyboardEvent): void {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', onEscape);
        return () => document.removeEventListener('keydown', onEscape);
    }, [open]);

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 10);
    }, [open]);

    const dropdown = (
        <div
            ref={dropdownRef}
            style={pos}
            data-searchable-select-dropdown=""
            className="border-border overflow-hidden rounded-[12px] border bg-white shadow-xl"
        >
            <div className="border-border relative border-b p-2">
                <Search
                    size={13}
                    className="text-mute pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                />
                <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="placeholder:text-mute text-ink bg-paper w-full rounded-[8px] py-1.5 pr-3 pl-7 text-[13px] outline-none"
                />
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                    <li className="text-mute px-3 py-6 text-center text-[13px]">{emptyMessage}</li>
                ) : (
                    filtered.map((opt) => (
                        <li key={opt.value}>
                            <button
                                type="button"
                                onClick={() => handleSelect(opt.value, opt.disabled)}
                                disabled={opt.disabled}
                                className={cn(
                                    'flex w-full items-center gap-2 px-3 py-2 text-[13px] transition-colors',
                                    'disabled:pointer-events-none disabled:opacity-40',
                                    value === opt.value
                                        ? 'text-primary font-semibold'
                                        : 'text-ink hover:bg-primary/5',
                                )}
                            >
                                <Check
                                    size={13}
                                    className={cn(
                                        'shrink-0',
                                        value === opt.value ? 'text-primary' : 'opacity-0',
                                    )}
                                />
                                <span className="min-w-0 flex-1 truncate text-left">
                                    {opt.label}
                                </span>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );

    return (
        <div className={cn('relative w-full', className)}>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    'border-border flex w-full items-center justify-between rounded-[10px] border bg-white px-3 text-sm transition-colors',
                    'focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    open && 'border-primary ring-primary/20 ring-2',
                    size === 'default' ? 'h-11' : 'h-9',
                )}
            >
                <span className={cn('truncate text-left', !selected && 'text-mute')}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={15}
                    className={cn(
                        'text-mute ml-2 shrink-0 transition-transform duration-150',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open && mounted && createPortal(dropdown, document.body)}
        </div>
    );
}
