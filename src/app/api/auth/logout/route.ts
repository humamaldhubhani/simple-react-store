import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/logger';
import { getSession } from '@/lib/security';

export async function POST(request: Request) {
    const session = await getSession();

    if (session) {
        await logActivity(session.userId, 'LOGOUT', 'User logged out', request);
    }

    const cookieStore = await cookies();
    cookieStore.set('auth_token', '', { expires: new Date(0), path: '/' });

    // Legacy cleanup
    cookieStore.delete('userId');
    cookieStore.delete('userRole');

    return NextResponse.json({ message: 'Logged out' });
}
