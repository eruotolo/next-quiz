'use client';

import type * as React from 'react';
import Image from 'next/image';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

// ── Aulika-native Avatar ───────────────────────────────────────────────────
const AVATAR_PALETTE = [
    '#1f2eff', // primary
    '#7c5cff', // iris
    '#ff5a4d', // coral
    '#0f7c4a', // success
    '#b7791f', // warning
    '#0b0b11', // ink
] as const;

function hashName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

interface AvatarProps {
    name?: string;
    src?: string;
    size?: number;
    color?: string;
    className?: string;
}

function Avatar({ name = '', src, size = 36, color, className }: AvatarProps) {
    const idx = hashName(name) % AVATAR_PALETTE.length;
    const bg = color ?? AVATAR_PALETTE[idx];
    const initials = getInitials(name) || '?';
    const fontSize = Math.round(size * 0.36);

    if (src) {
        return (
            <Image
                src={src}
                alt={name}
                width={size}
                height={size}
                className={cn('shrink-0 rounded-full object-cover', className)}
            />
        );
    }

    return (
        <div
            data-slot="avatar"
            role="img"
            aria-label={name}
            className={cn(
                'inline-flex [height:var(--av-size)] [width:var(--av-size)] shrink-0 items-center justify-center rounded-full font-mono [font-size:var(--av-fs)] font-semibold text-white select-none [background:var(--av-bg)]',
                className,
            )}
            style={
                {
                    '--av-size': `${size}px`,
                    '--av-bg': bg,
                    '--av-fs': `${fontSize}px`,
                } as React.CSSProperties
            }
        >
            {initials}
        </div>
    );
}

// ── Backward-compat sub-components (radix pattern) ────────────────────────
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full', className)}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'bg-paper-warm text-ink-dim flex size-full items-center justify-center rounded-full font-mono text-sm font-medium',
                className,
            )}
            {...props}
        />
    );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="avatar-badge"
            className={cn(
                'ring-background bg-primary absolute right-0 bottom-0 z-10 inline-flex size-2.5 items-center justify-center rounded-full ring-2 select-none',
                className,
            )}
            {...props}
        />
    );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="avatar-group" className={cn('flex -space-x-2', className)} {...props} />;
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="avatar-group-count"
            className={cn(
                'ring-background bg-paper-warm text-ink-dim relative flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium ring-2',
                className,
            )}
            {...props}
        />
    );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
