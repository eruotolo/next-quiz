/**
 * Aulika Online — Actualizador IA mensual.
 *
 * Una vez al mes, recorre los cursos de la institución `aulika-online`,
 * consulta a Gemini 2.5 Flash por contenido pedagógico actualizado
 * (basado en el temario oficial DEMRE Chile), y agrega nuevas lecciones
 * al final de cada módulo sin tocar las existentes.
 *
 * Reglas operativas:
 * - NUNCA pisa lecciones existentes (preserva progreso del estudiante).
 * - Máximo 2 lecciones nuevas por curso por ciclo (controla costos).
 * - Solo agrega lecciones `TEXTO` (las de video/enlace las publica un humano).
 * - Marca las lecciones con `lastAiUpdateAt` y `aiUpdateSource`.
 * - Si el flag `AULIKA_ONLINE_AUTO_UPDATE_ENABLED` está en `false`, no hace nada.
 */
import { type PrismaClient } from '@prisma/client';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { AULIKA_ONLINE_INSTITUTION_SLUG } from './aulika-online-bundle';

const AI_MODEL = 'google:gemini-2.5-flash';
const MAX_NEW_LESSONS_PER_COURSE = 2;
const MIN_LESSON_CONTENT_CHARS = 400;

export interface UpdateReport {
    institutionSlug: string;
    enabled: boolean;
    coursesProcessed: number;
    newLessonsCreated: number;
    skippedCourses: string[];
    errors: string[];
    startedAt: string;
    finishedAt: string;
}

interface SuggestedLesson {
    title: string;
    moduleTitle: string;
    summary: string;
    bodyMarkdown: string;
}

const SUGGEST_LESSONS_PROMPT = (
    courseTitle: string,
    courseDescription: string,
    moduleTitle: string,
    moduleDescription: string,
    existingLessonTitles: string[],
): string =>
    `Sos un asistente pedagógico chileno especialista en la PAES (Prueba de Acceso a la Educación Superior) de Chile.

Estás ayudando a mantener actualizado un curso de Aulika Institution Online llamado "${courseTitle}" (${courseDescription}).

El módulo actual es "${moduleTitle}" (${moduleDescription}).

Las lecciones existentes en este módulo son:
${existingLessonTitles.length > 0 ? existingLessonTitles.map((t, i) => `  ${i + 1}. ${t}`).join('\n') : '  (ninguna)'}

Tu tarea: sugerir entre 1 y ${MAX_NEW_LESSONS_PER_COURSE} lecciones NUEVAS que cubran temas complementarios o actualizaciones del temario oficial DEMRE Chile que NO estén ya cubiertas.

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma:
{
  "lessons": [
    {
      "title": "Título claro y específico",
      "summary": "Resumen ejecutivo de 1-2 frases",
      "bodyMarkdown": "Contenido pedagógico en Markdown (300-600 palabras). Usa headings ##, listas con -, fórmulas en línea y bloques de código. Ejemplo PAES tipo al final con pregunta y resolución."
    }
  ]
}

Reglas estrictas:
- NO repitas temas ya cubiertos (revisá los títulos existentes).
- El contenido debe ser pedagógicamente útil para un estudiante que rendirá la PAES Chile.
- NO incluyas URLs externas, autores, ni referencias bibliográficas completas.
- Si no podés sugerir nada útil, devolvé {"lessons": []}.
- NO uses emojis decorativos.

Curso: ${courseTitle}
Módulo: ${moduleTitle}`;

interface RawLesson {
    title?: unknown;
    moduleTitle?: unknown;
    summary?: unknown;
    bodyMarkdown?: unknown;
}

interface RawResponse {
    lessons?: unknown;
}

function extractJson(raw: string): unknown {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // fall through
        }
    }
    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch?.[1]) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        } catch {
            // fall through
        }
    }
    const braceStart = trimmed.indexOf('{');
    const braceEnd = trimmed.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
        try {
            return JSON.parse(trimmed.slice(braceStart, braceEnd + 1));
        } catch {
            return null;
        }
    }
    return null;
}

// Declaraciones exportadas para tests y consumo interno:
export function validateSuggestions(parsed: unknown): SuggestedLesson[] {
    if (!parsed || typeof parsed !== 'object') return [];
    const obj = parsed as RawResponse;
    if (!Array.isArray(obj.lessons)) return [];

    const valid: SuggestedLesson[] = [];
    for (const entry of obj.lessons) {
        if (!entry || typeof entry !== 'object') continue;
        const item = entry as RawLesson;
        if (
            typeof item.title === 'string' &&
            typeof item.moduleTitle === 'string' &&
            typeof item.bodyMarkdown === 'string' &&
            typeof item.summary === 'string' &&
            item.title.trim().length > 0 &&
            item.moduleTitle.trim().length > 0 &&
            item.bodyMarkdown.trim().length >= MIN_LESSON_CONTENT_CHARS
        ) {
            valid.push({
                title: item.title.trim().slice(0, 200),
                moduleTitle: item.moduleTitle.trim().slice(0, 200),
                summary: item.summary.trim().slice(0, 500),
                bodyMarkdown: item.bodyMarkdown.trim().slice(0, 50_000),
            });
            if (valid.length >= MAX_NEW_LESSONS_PER_COURSE) break;
        }
    }
    return valid;
}



async function suggestLessonsForCourse(
    courseTitle: string,
    courseDescription: string,
    modules: Array<{ id: string; title: string; description: string | null; lessons: Array<{ title: string }> }>,
): Promise<SuggestedLesson[]> {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY no está configurada');
    }

    // Tomamos el último módulo como objetivo para la actualización.
    const targetModule = modules[modules.length - 1];
    if (!targetModule) return [];

    const existingTitles = targetModule.lessons.map((l) => l.title);

    const prompt = SUGGEST_LESSONS_PROMPT(
        courseTitle,
        courseDescription,
        targetModule.title,
        targetModule.description ?? '',
        existingTitles,
    );

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    const parsed = extractJson(text);
    return validateSuggestions(parsed);
}

export function markdownToTiptapJson(md: string): unknown {
    // Conversión minimalista: cada línea como párrafo, headings como headings,
    // listas como bulletList, bloques de código como codeBlock.
    const lines = md.split('\n');
    const blocks: unknown[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? '';
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
            // Bloque de código
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
                codeLines.push(lines[i] ?? '');
                i++;
            }
            i++;
            blocks.push({
                type: 'codeBlock',
                attrs: { language: '' },
                content: [{ type: 'text', text: codeLines.join('\n') }],
            });
            continue;
        }
        if (trimmed.startsWith('## ')) {
            blocks.push({
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: trimmed.slice(3) }],
            });
            i++;
            continue;
        }
        if (trimmed.startsWith('# ')) {
            blocks.push({
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: trimmed.slice(2) }],
            });
            i++;
            continue;
        }
        if (trimmed.startsWith('- ')) {
            const items: unknown[] = [];
            while (i < lines.length && (lines[i] ?? '').trim().startsWith('- ')) {
                const cur = lines[i] ?? '';
                items.push({
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: cur.trim().slice(2) }] }],
                });
                i++;
            }
            blocks.push({ type: 'bulletList', content: items });
            continue;
        }
        if (trimmed.length === 0) {
            i++;
            continue;
        }
        blocks.push({
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed }],
        });
        i++;
    }
    return { type: 'doc', content: blocks };
}

export async function isAutoUpdateEnabled(prisma: PrismaClient): Promise<boolean> {
    try {
        const row = await prisma.appConfig.findUnique({
            where: { key: 'AULIKA_ONLINE_AUTO_UPDATE_ENABLED' },
        });
        return row?.value === 'true';
    } catch {
        return false;
    }
}

export async function updateAulikaOnlineCourses(prisma: PrismaClient): Promise<UpdateReport> {
    const startedAt = new Date().toISOString();
    const report: UpdateReport = {
        institutionSlug: AULIKA_ONLINE_INSTITUTION_SLUG,
        enabled: false,
        coursesProcessed: 0,
        newLessonsCreated: 0,
        skippedCourses: [],
        errors: [],
        startedAt,
        finishedAt: '',
    };

    report.enabled = await isAutoUpdateEnabled(prisma);
    if (!report.enabled) {
        report.finishedAt = new Date().toISOString();
        return report;
    }

    const institution = await prisma.academicInstitution.findUnique({
        where: { slug: AULIKA_ONLINE_INSTITUTION_SLUG },
        include: {
            lmsCourses: {
                where: { isPublic: true, published: true },
                include: {
                    modules: {
                        orderBy: { order: 'asc' },
                        include: { lessons: { select: { title: true, order: true } } },
                    },
                },
            },
        },
    });

    if (!institution) {
        report.errors.push(`Institución ${AULIKA_ONLINE_INSTITUTION_SLUG} no encontrada`);
        report.finishedAt = new Date().toISOString();
        return report;
    }

    const aiNow = new Date();

    for (const course of institution.lmsCourses) {
        try {
            const suggestions = await suggestLessonsForCourse(
                course.title,
                course.description ?? '',
                course.modules,
            );

            if (suggestions.length === 0) {
                report.skippedCourses.push(course.title);
                continue;
            }

            // Resolver módulo destino: buscar por título o usar el último.
            const targetModule =
                course.modules.find((m) => m.title === suggestions[0]?.moduleTitle) ??
                course.modules[course.modules.length - 1];

            if (!targetModule) {
                report.skippedCourses.push(course.title);
                continue;
            }

            // Calcular order: después del último lesson existente.
            const maxOrder = targetModule.lessons.reduce(
                (acc, l) => Math.max(acc, l.order),
                -1,
            );

            for (const [idx, suggestion] of suggestions.entries()) {
                // Evitar duplicados por título.
                const exists = await prisma.lmsLesson.findFirst({
                    where: {
                        moduleId: targetModule.id,
                        title: suggestion.title,
                    },
                    select: { id: true },
                });
                if (exists) continue;

                await prisma.lmsLesson.create({
                    data: {
                        title: suggestion.title,
                        type: 'TEXTO',
                        order: maxOrder + 1 + idx,
                        contentJson: markdownToTiptapJson(suggestion.bodyMarkdown) as never,
                        moduleId: targetModule.id,
                        lastAiUpdateAt: aiNow,
                        aiUpdateSource: AI_MODEL,
                    },
                });
                report.newLessonsCreated += 1;
            }

            report.coursesProcessed += 1;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            report.errors.push(`${course.title}: ${message}`);
            report.skippedCourses.push(course.title);
        }
    }

    report.finishedAt = new Date().toISOString();
    return report;
}