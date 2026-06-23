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

// Identidad liviana post-login, previa a elegir examen (página de selección).
export interface StudentAuthPayload {
    studentId: string;
    groupId: string;
}

const STUDENT_COOKIE = 'aulika-student-session';
const RESULT_COOKIE = 'aulika-result-session';
const STUDENT_AUTH_COOKIE = 'aulika-student-auth';
const STUDENT_COOKIE_LEGACY = 'student_session';
const RESULT_COOKIE_LEGACY = 'result_session';
const STUDENT_AUTH_TTL_SECONDS = 60 * 60 * 2;

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
        cookieStore.get(STUDENT_COOKIE)?.value ?? cookieStore.get(STUDENT_COOKIE_LEGACY)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as StudentSessionPayload;
    } catch {
        return null;
    }
}

export async function createStudentAuthSession(payload: StudentAuthPayload): Promise<void> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(Date.now() / 1000) + STUDENT_AUTH_TTL_SECONDS)
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(STUDENT_AUTH_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: STUDENT_AUTH_TTL_SECONDS,
        path: '/',
    });
}

export async function getStudentAuthSession(): Promise<StudentAuthPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_AUTH_COOKIE)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as StudentAuthPayload;
    } catch {
        return null;
    }
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
        cookieStore.get(RESULT_COOKIE)?.value ?? cookieStore.get(RESULT_COOKIE_LEGACY)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as ResultSessionPayload;
    } catch {
        return null;
    }
}
