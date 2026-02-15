import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getSession } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        const { action, details } = await request.json();

        if (!action || !details) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        await logActivity(session?.userId || null, action, details, request);

        return NextResponse.json({ message: 'Logged' });
    } catch (error) {
        console.error('Client Log error:', error);
        return NextResponse.json({ message: 'Logging failed' }, { status: 500 });
    }
}
