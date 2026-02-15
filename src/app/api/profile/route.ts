import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/logger';
import { getSession, UpdateProfileSchema, UpdatePasswordSchema } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const [rows]: any = await db.execute(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [session.userId]
        );

        if (rows.length === 0) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validation = UpdateProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid input',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { username, email } = validation.data;

        // Check if email/username already taken by someone else
        const [existing]: any = await db.execute(
            'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
            [email, username, session.userId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
        }

        const [oldData]: any = await db.execute('SELECT username, email FROM users WHERE id = ?', [session.userId]);
        const old = oldData[0];

        await db.execute(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, session.userId]
        );

        const changes = [];
        if (old.username !== username) changes.push(`username: "${old.username}" -> "${username}"`);
        if (old.email !== email) changes.push(`email: "${old.email}" -> "${email}"`);

        if (changes.length > 0) {
            await logActivity(session.userId, 'UPDATE_PROFILE', `Profile updated. Changes: ${changes.join(', ')}`, request);
        }

        return NextResponse.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile PATCH error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validation = UpdatePasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid input',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { currentPassword, newPassword } = validation.data;

        const [rows]: any = await db.execute('SELECT password_hash FROM users WHERE id = ?', [session.userId]);
        if (rows.length === 0) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const passwordMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!passwordMatch) {
            return NextResponse.json({ message: 'Incorrect current password' }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, session.userId]);

        await logActivity(session.userId, 'CHANGE_PASSWORD', 'User successfully changed their password', request);

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
