import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { getSession } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const [users]: any = await db.execute('SELECT id, username, email, role, status, created_at FROM users');
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ message: 'User ID and status required' }, { status: 400 });

        await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

        const action = status === 'deactivated' ? 'DEACTIVATE_USER' : 'ACTIVATE_USER';
        await logActivity(session.userId, action, `Admin ${status} user ID: ${id}`, request);

        return NextResponse.json({ message: `User ${status}` });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    return NextResponse.json({ message: 'Use PATCH /api/users to deactivate users instead of deleting' }, { status: 405 });
}
