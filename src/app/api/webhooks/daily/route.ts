import { NextResponse, type NextRequest } from 'next/server';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import {
    parseDailyWebhookPayload,
    verifyDailyWebhookSignature,
} from '@/shared/lib/daily';
import { uploadDailyRecordingToMux } from '@/features/lms/lib/mux-recording';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Participant {
    user_id?: string;
    user_name?: string;
    session_id?: string;
    joined_at?: string;
    left_at?: string | null;
}

interface WebhookPayloadShape {
    room?: { name?: string; id?: string };
    meeting_ended?: { started_at?: string; ended_at?: string };
    participants?: Participant[];
    recording?: { id?: string; download_url?: string; duration_seconds?: number };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('daily-webhook-signature');

    const verification = await verifyDailyWebhookSignature(rawBody, signatureHeader);
    if (!verification.ok) {
        console.warn('[Daily webhook] signature verification failed', verification.reason);
        return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }

    const parsed = parseDailyWebhookPayload(rawBody);
    if (!parsed) {
        return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const payload = parsed.payload as WebhookPayloadShape | undefined;
    const roomName = payload?.room?.name ?? payload?.room?.id ?? null;
    if (!roomName) {
        return NextResponse.json({ ok: true, ignored: true });
    }

    const session = await prisma.lmsLiveSession.findUnique({
        where: { dailyRoomName: roomName },
        select: {
            id: true,
            status: true,
            course: { select: { academicInstitutionId: true } },
        },
    });
    if (!session) {
        // Evento huérfano: ya cerramos o nunca creamos la sesión. 200 para
        // evitar reintentos infinitos por parte de Daily.
        return NextResponse.json({ ok: true, ignored: true });
    }

    switch (parsed.type) {
        case 'meeting.ended':
            await onMeetingEnded(session.id);
            break;
        case 'participant.joined':
            await onParticipantJoined(session.id, payload?.participants);
            break;
        case 'participant.left':
            await onParticipantLeft(session.id, payload?.participants);
            break;
        case 'recording.ready-to-download':
            await onRecordingReady(session.id, payload?.recording);
            break;
        case 'recording.failed':
            await onRecordingFailed(session.id);
            break;
        default:
            // Eventos que no nos interesan (participant.updated, etc.) — OK.
            break;
    }

    return NextResponse.json({ ok: true });
}

async function onMeetingEnded(sessionId: string): Promise<void> {
    const endedAt = new Date();
    await prisma.$transaction(async (tx) => {
        await tx.lmsLiveSession.update({
            where: { id: sessionId },
            data: { status: 'ENDED', endedAt },
        });
        await tx.lmsLiveAttendance.updateMany({
            where: { sessionId, leftAt: null },
            data: { leftAt: endedAt },
        });
    });
}

async function onParticipantJoined(
    sessionId: string,
    participants: Participant[] | undefined,
): Promise<void> {
    const items = Array.isArray(participants) ? participants : [];
    for (const participant of items) {
        if (!participant.user_id) continue;
        const joinedAt = participant.joined_at ? new Date(participant.joined_at) : new Date();
        await prisma.lmsLiveAttendance.upsert({
            where: { id: `${sessionId}-${participant.user_id}-${joinedAt.getTime()}` },
            create: {
                sessionId,
                userId: participant.user_id,
                role: 'STUDENT',
                displayName: participant.user_name ?? 'Participante',
                joinedAt,
                dailyParticipantId: participant.user_id,
            },
            update: { leftAt: null },
        });
    }
}

async function onParticipantLeft(
    sessionId: string,
    participants: Participant[] | undefined,
): Promise<void> {
    const items = Array.isArray(participants) ? participants : [];
    for (const participant of items) {
        if (!participant.user_id) continue;
        const leftAt = participant.left_at ? new Date(participant.left_at) : new Date();
        const latest = await prisma.lmsLiveAttendance.findFirst({
            where: { sessionId, userId: participant.user_id, leftAt: null },
            orderBy: { joinedAt: 'desc' },
            select: { id: true, joinedAt: true },
        });
        if (!latest) continue;
        const durationSec = Math.max(
            0,
            Math.floor((leftAt.getTime() - latest.joinedAt.getTime()) / 1000),
        );
        await prisma.lmsLiveAttendance.update({
            where: { id: latest.id },
            data: { leftAt, durationSec },
        });
    }
}

async function onRecordingReady(
    sessionId: string,
    recording: WebhookPayloadShape['recording'] | undefined,
): Promise<void> {
    if (!recording?.download_url) return;
    await prisma.lmsLiveSession.update({
        where: { id: sessionId },
        data: {
            recordingStatus: 'READY',
            recordingUrl: recording.download_url,
            recordingDurationSec: recording.duration_seconds ?? null,
        },
    });
    await logAudit({
        action: AUDIT_ACTION.LMS_LIVE_SESSION_RECORDING_READY,
        entity: 'LmsLiveSession',
        entityId: sessionId,
        metadata: { recordingId: recording.id },
    });

    void uploadRecordingToMuxBackground(sessionId, recording.download_url);
}

async function uploadRecordingToMuxBackground(
    sessionId: string,
    downloadUrl: string,
): Promise<void> {
    try {
        const result = await uploadDailyRecordingToMux(downloadUrl);
        if (!result.ok || !result.assetId) return;

        const updateData: { recordingMuxAssetId: string; recordingUrl?: string } = {
            recordingMuxAssetId: result.assetId,
        };
        if (result.playbackId) {
            updateData.recordingUrl = `https://stream.mux.com/${result.playbackId}.m3u8`;
        }
        await prisma.lmsLiveSession.update({
            where: { id: sessionId },
            data: updateData,
        });
        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_RECORDING_READY,
            entity: 'LmsLiveSession',
            entityId: sessionId,
            metadata: { muxAssetId: result.assetId, muxPlaybackId: result.playbackId },
        });
    } catch (err) {
        console.error('[Daily webhook] Mux upload background failed:', err);
    }
}

async function onRecordingFailed(sessionId: string): Promise<void> {
    await prisma.lmsLiveSession.update({
        where: { id: sessionId },
        data: { recordingStatus: 'FAILED' },
    });
}
