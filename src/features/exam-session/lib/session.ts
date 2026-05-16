import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface StudentSessionPayload {
    studentId: string;
    examId: string;
    endsAt: number;
    attemptKey: string;
}

export interface ResultSessionPayload {
    resultId: string;
    studentId: string;
}

const STUDENT_COOKIE = 'aulika-student-session';
const RESULT_COOKIE = 'aulika-result-session';
const STUDENT_COOKIE_LEGACY = 'student_session';
const RESULT_COOKIE_LEGACY = 'result_session';

function getSecret(): Uint8Array {
    const secret = process.env.STUDENT_SESSION_SECRET;
    if (!secret) throw new Error('STUDENT_SESSION_SECRET is not set');
    return new TextEncoder().encode(secret);
}

export async function createStudentSession(payload: StudentSessionPayload): Promise<void> {
    const expiresAt = Math.floor(payload.endsAt / 1000) + 5 * 60;
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(expiresAt)
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(STUDENT_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(payload.endsAt + 5 * 60 * 1000),
        path: '/',
    });
}

export async function getStudentSession(): Promise<StudentSessionPayload | null> {
    const cookieStore = await cookies();
    const token =
        cookieStore.get(STUDENT_COOKIE)?.value ??
        cookieStore.get(STUDENT_COOKIE_LEGACY)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as StudentSessionPayload;
    } catch {
        return null;
    }
}

export async function deleteStudentSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(STUDENT_COOKIE);
    cookieStore.delete(STUDENT_COOKIE_LEGACY);
}

// Replaces the exam session with a short-lived result session so the student
// can view their own result page after the exam session is gone.
export async function createResultSession(resultId: string, studentId: string): Promise<void> {
    const token = await new SignJWT({ resultId, studentId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.delete(STUDENT_COOKIE);
    cookieStore.delete(STUDENT_COOKIE_LEGACY);
    cookieStore.set(RESULT_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        path: '/',
    });
}

export async function getResultSession(): Promise<ResultSessionPayload | null> {
    const cookieStore = await cookies();
    const token =
        cookieStore.get(RESULT_COOKIE)?.value ??
        cookieStore.get(RESULT_COOKIE_LEGACY)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as ResultSessionPayload;
    } catch {
        return null;
    }
}
