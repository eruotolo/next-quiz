import { type NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { generationInputSchema } from '@/features/ai-question-gen/schemas/generation.schemas';
import { buildPrompt } from '@/features/ai-question-gen/lib/build-prompt';
import { parseGeminiResponse } from '@/features/ai-question-gen/lib/parse-response';
import { requireInstitutionAccess } from '@/shared/lib/auth-guard';

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return NextResponse.json(
            { error: 'Servicio de IA no configurado' },
            { status: 503 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const parsed = generationInputSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? 'Input inválido' },
            { status: 400 },
        );
    }

    try {
        await requireInstitutionAccess(parsed.data.slug);
    } catch {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const input = parsed.data;
    const questionType: 'UNICA' | 'MULTIPLE' =
        input.correctAnswers === 1 ? 'UNICA' : 'MULTIPLE';

    try {
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: buildPrompt(input),
        });

        const result = parseGeminiResponse(text, questionType, input.points);

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { error: 'Error al generar preguntas con IA' },
            { status: 500 },
        );
    }
}
