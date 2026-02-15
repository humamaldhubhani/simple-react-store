import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const [rows]: any = await db.execute(`
            SELECT l.*, u.username, u.email 
            FROM logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT 500
        `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Logs GET error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
