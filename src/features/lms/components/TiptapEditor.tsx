'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
    EditorContent,
    generateHTML,
    useEditor,
    type Extensions,
    type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Redo,
    Undo,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

const LINK_PROTOCOLS = ['http', 'https', 'mailto'];

/** Extensiones compartidas entre el editor (escritura) y el renderer (lectura). */
export const LESSON_EDITOR_EXTENSIONS: Extensions = [
    StarterKit.configure({
        link: {
            openOnClick: false,
            autolink: true,
            protocols: LINK_PROTOCOLS,
        },
    }),
];

/** Convierte un doc Tiptap a HTML seguro (schema cerrado, sin scripts). */
export function renderLessonHtml(json: unknown): string {
    if (!json || typeof json !== 'object') return '';
    try {
        return generateHTML(json as JSONContent, LESSON_EDITOR_EXTENSIONS);
    } catch {
        return '';
    }
}

interface ToolbarButtonProps {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    label: string;
    children: ReactNode;
}

function ToolbarButton({ active, disabled, onClick, label, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={cn(
                'flex size-7 items-center justify-center rounded-[6px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                active
                    ? 'bg-primary-wash text-primary'
                    : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
            )}
        >
            {children}
        </button>
    );
}

interface Props {
    value: JSONContent | null;
    onChange: (value: JSONContent) => void;
    disabled?: boolean;
    placeholder?: string;
    minHeightClassName?: string;
}

export function TiptapEditor({
    value,
    onChange,
    disabled = false,
    placeholder = 'Escribí el contenido…',
    minHeightClassName = 'min-h-[160px]',
}: Props) {
    const [linkInputOpen, setLinkInputOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
        extensions: LESSON_EDITOR_EXTENSIONS,
        content: value ?? undefined,
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor: e }) => onChange(e.getJSON()),
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm max-w-none px-3 py-2 focus:outline-none',
                    minHeightClassName,
                ),
                'data-placeholder': placeholder,
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!disabled);
    }, [editor, disabled]);

    if (!editor) return null;

    function openLinkInput() {
        const previousUrl = editor?.getAttributes('link').href as string | undefined;
        setLinkUrl(previousUrl ?? '');
        setLinkInputOpen(true);
    }

    function applyLink() {
        const url = linkUrl.trim();
        if (!url) {
            editor?.chain().focus().unsetLink().run();
        } else {
            editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        setLinkInputOpen(false);
    }

    return (
        <div className={cn('border-border rounded-[10px] border bg-white', disabled && 'opacity-60')}>
            <div className="border-border flex flex-wrap items-center gap-0.5 border-b p-1.5">
                <ToolbarButton
                    label="Negrita"
                    active={editor.isActive('bold')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Cursiva"
                    active={editor.isActive('italic')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Encabezado 2"
                    active={editor.isActive('heading', { level: 2 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Encabezado 3"
                    active={editor.isActive('heading', { level: 3 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Lista"
                    active={editor.isActive('bulletList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Lista numerada"
                    active={editor.isActive('orderedList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Enlace"
                    active={editor.isActive('link')}
                    disabled={disabled}
                    onClick={openLinkInput}
                >
                    <LinkIcon size={14} />
                </ToolbarButton>
                <div className="bg-border mx-1 h-5 w-px" />
                <ToolbarButton
                    label="Deshacer"
                    disabled={disabled || !editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo size={14} />
                </ToolbarButton>
                <ToolbarButton
                    label="Rehacer"
                    disabled={disabled || !editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo size={14} />
                </ToolbarButton>
            </div>

            {linkInputOpen && (
                <div className="border-border flex items-center gap-2 border-b p-2">
                    <Input
                        autoFocus
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                applyLink();
                            }
                            if (e.key === 'Escape') setLinkInputOpen(false);
                        }}
                        placeholder="https://…"
                        className="h-8 flex-1 text-xs"
                    />
                    <Button type="button" size="sm" variant="primary" onClick={applyLink}>
                        Aplicar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setLinkInputOpen(false)}
                    >
                        Cancelar
                    </Button>
                </div>
            )}

            <EditorContent editor={editor} />
        </div>
    );
}
