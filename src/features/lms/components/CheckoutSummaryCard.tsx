import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Tag } from '@/shared/components/ui/badge';

interface CheckoutSummaryCardProps {
    eyebrow: string;
    institutionName: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    courseTitles?: string[];
    metaLine?: string;
    priceClp: number;
    priceFootnote?: string;
}

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function CheckoutSummaryCard({
    eyebrow,
    institutionName,
    title,
    description,
    imageUrl,
    courseTitles,
    metaLine,
    priceClp,
    priceFootnote = 'Pago único · Sin renovaciones',
}: CheckoutSummaryCardProps) {
    return (
        <div className="w-full rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
            <Tag tone="lime" size="md" className="font-bold">
                {eyebrow}
            </Tag>

            {imageUrl && (
                <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-[14px]">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover"
                    />
                </div>
            )}

            <p className="mt-5 font-mono text-[11px] font-bold tracking-[0.1em] text-white/40 uppercase">
                {institutionName}
            </p>
            <h2 className="mt-1 font-display text-[32px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[38px]">
                {title}
            </h2>
            {description && (
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">{description}</p>
            )}

            {courseTitles && courseTitles.length > 0 ? (
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-white/10 pt-5">
                    {courseTitles.map((courseTitle) => (
                        <li
                            key={courseTitle}
                            className="flex items-center gap-2.5 text-[14px] text-white/70"
                        >
                            <BookOpen size={15} className="shrink-0 text-white/40" />
                            {courseTitle}
                        </li>
                    ))}
                </ul>
            ) : (
                metaLine && <p className="mt-4 text-[14px] text-white/60">{metaLine}</p>
            )}

            <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex items-baseline justify-between">
                    <span className="text-[16px] text-white/60">Total</span>
                    <span className="font-display text-[38px] leading-none font-bold text-white">
                        {formatCLP(priceClp)}
                    </span>
                </div>
                <p className="mt-2 text-[13px] text-white/40">{priceFootnote}</p>
            </div>
        </div>
    );
}
