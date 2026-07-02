'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { File as FileIcon, FileImage, FileSpreadsheet, FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
};

function iconForFileName(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') return FileText;
    if (ext === 'xls' || ext === 'xlsx') return FileSpreadsheet;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return FileImage;
    return FileIcon;
}

interface Props {
    value: File | null;
    onChange: (file: File | null) => void;
    existingFileUrl?: string | null;
    disabled?: boolean;
}

export function Dropzone({ value, onChange, existingFileUrl, disabled = false }: Props) {
    const onDrop = useCallback(
        (accepted: File[]) => {
            const file = accepted[0];
            if (file) onChange(file);
        },
        [onChange],
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: ACCEPTED_MIME_TYPES,
        maxSize: MAX_SIZE_BYTES,
        multiple: false,
        disabled,
    });

    const Icon = value ? iconForFileName(value.name) : UploadCloud;
    const rejectionCode = fileRejections[0]?.errors[0]?.code;

    return (
        <div className="flex flex-col gap-2">
            <div
                {...getRootProps()}
                className={cn(
                    'border-border focus-visible:ring-ring flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    isDragActive && 'border-primary bg-primary-wash',
                    disabled && 'pointer-events-none opacity-60',
                )}
            >
                <input {...getInputProps()} />
                <Icon size={28} className={value ? 'text-primary' : 'text-mute'} />
                {value ? (
                    <div className="flex items-center gap-2">
                        <p className="text-ink text-sm font-medium">{value.name}</p>
                        <button
                            type="button"
                            aria-label="Quitar archivo"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="text-mute hover:text-destructive"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-ink text-sm font-medium">
                            Arrastrá un archivo o hacé clic para elegir
                        </p>
                        <p className="text-mute text-xs">PDF, Word, Excel o imagen — máx. 25 MB</p>
                    </>
                )}
            </div>

            {existingFileUrl && !value && (
                <p className="text-mute flex items-center gap-1.5 text-xs">
                    <UploadCloud size={12} /> Ya hay un archivo cargado. Subí uno nuevo para
                    reemplazarlo.
                </p>
            )}

            {rejectionCode && (
                <p className="text-destructive text-xs">
                    {rejectionCode === 'file-too-large'
                        ? 'El archivo supera los 25 MB permitidos.'
                        : 'Tipo de archivo no permitido.'}
                </p>
            )}
        </div>
    );
}
