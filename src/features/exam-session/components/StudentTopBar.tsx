import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { logoutStudent } from '@/features/exam-session/actions/mutations';

interface StudentTopBarProps {
    topbarLabel: string;
    fullName: string;
    groupName?: string | null;
    institutionName?: string | null;
    showLogout?: boolean;
    className?: string;
}

export function StudentTopBar({
    topbarLabel,
    fullName,
    groupName,
    institutionName,
    showLogout = true,
    className,
}: StudentTopBarProps) {
    return (
        <header
            className={`border-border flex items-center justify-between border-b bg-white px-8 py-4 ${className ?? ''}`}
        >
            <div className="flex items-center gap-3">
                <LogoMark size={28} />
                <LogoWordmark size={16} color="#0b0b11" />
                <div className="bg-border ml-1 h-4 w-px" />
                <span className="text-mute max-w-[420px] truncate font-mono text-[11px] tracking-[0.08em] uppercase">
                    {topbarLabel}
                </span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Avatar name={fullName} size={36} />
                    <div className="hidden leading-tight sm:block">
                        <p className="text-ink text-[13px] font-semibold">{fullName}</p>
                        {groupName && <p className="text-mute text-[11px]">{groupName}</p>}
                        {institutionName && (
                            <p className="text-mute text-[11px]">{institutionName}</p>
                        )}
                    </div>
                </div>
                {showLogout && (
                    <form action={logoutStudent}>
                        <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-mute hover:text-ink -ml-2"
                        >
                            Cerrar sesión
                        </Button>
                    </form>
                )}
            </div>
        </header>
    );
}
