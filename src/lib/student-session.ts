import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface StudentSessionPayload {
    studentId: string;
    examId: string;
    endsAt: number;
    attemptKey: string;
}

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
    cookieStore.set('student_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(payload.endsAt + 5 * 60 * 1000),
        path: '/',
    });
}

export async function getStudentSession(): Promise<StudentSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_session')?.value;
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
    cookieStore.delete('student_session');
}
