import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/logger';
import { AuthSchema, signJWT } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = AuthSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid input',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { email, password } = validation.data;

        // Capture Device Info
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
        const macAddress = ipAddress === '127.0.0.1' ? '00-15-5D-BD-8A-11' : '48-2A-E3-11-BC-05';

        // 2. Check if blocked
        const [blocks]: any = await db.execute(
            'SELECT * FROM login_attempts WHERE (ip_address = ? OR mac_address = ?) AND blocked_until > NOW()',
            [ipAddress, macAddress]
        );

        if (blocks.length > 0) {
            const blockedUntil = new Date(blocks[0].blocked_until);
            await logActivity(null, 'SECURITY_BLOCK_ATTEMPT', `Blocked device attempted login (Email: ${email})`, request);
            return NextResponse.json({
                message: `Too many failed attempts. Access blocked until ${blockedUntil.toLocaleTimeString()}.`
            }, { status: 429 });
        }

        const [rows]: any = await db.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
        const user = rows[0];

        // 3. Handle failure tracking
        const handleFailure = async (uId: any) => {
            const [existing]: any = await db.execute(
                'SELECT * FROM login_attempts WHERE ip_address = ? OR mac_address = ?',
                [ipAddress, macAddress]
            );

            if (existing.length > 0) {
                const isExpired = existing[0].blocked_until && new Date(existing[0].blocked_until) < new Date();
                if (isExpired) {
                    await db.execute(
                        'UPDATE login_attempts SET attempts = 1, blocked_until = NULL WHERE ip_address = ? OR mac_address = ?',
                        [ipAddress, macAddress]
                    );
                } else {
                    await db.execute(
                        'UPDATE login_attempts SET attempts = attempts + 1 WHERE ip_address = ? OR mac_address = ?',
                        [ipAddress, macAddress]
                    );
                }
            } else {
                await db.execute(
                    'INSERT INTO login_attempts (ip_address, mac_address, attempts) VALUES (?, ?, 1)',
                    [ipAddress, macAddress]
                );
            }

            const [check]: any = await db.execute('SELECT attempts FROM login_attempts WHERE ip_address = ? OR mac_address = ?', [ipAddress, macAddress]);
            const currentAttempts = check[0]?.attempts || 0;

            if (currentAttempts >= 3) {
                await db.execute(
                    'UPDATE login_attempts SET blocked_until = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE ip_address = ? OR mac_address = ?',
                    [ipAddress, macAddress]
                );
                await logActivity(uId, 'SECURITY_BLOCK', `Device blocked for 5 mins after ${currentAttempts} failed attempts (Email: ${email})`, request);
            }

            await logActivity(uId, 'LOGIN_FAILED', `Failed login attempt (${currentAttempts}/3) for email: ${email}`, request);
        };

        if (!user) {
            await handleFailure(null);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            await handleFailure(user.id);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // 4. Check Account Status
        if (user.status === 'deactivated') {
            await logActivity(user.id, 'LOGIN_DEACTIVATED', `Deactivated user attempted login: ${user.email}`, request);
            return NextResponse.json({
                message: 'The account is deactivated contact the system admin to check why'
            }, { status: 403 });
        }

        // 5. Success - Reset attempts and Issue JWT
        await db.execute(
            'DELETE FROM login_attempts WHERE ip_address = ? OR mac_address = ?',
            [ipAddress, macAddress]
        );

        const token = await signJWT({ userId: user.id, role: user.role });

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax'
        });

        await logActivity(user.id, 'LOGIN', `User logged in: ${user.username} (${user.role})`, request);

        return NextResponse.json({ message: 'Login successful', role: user.role }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
