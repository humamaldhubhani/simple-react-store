import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const [rows]: any = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [session.userId]);
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Auth-Me error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
