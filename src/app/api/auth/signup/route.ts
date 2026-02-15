import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/logger';
import { signJWT, PASSWORD_REGEX, SignupSchema } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = SignupSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid input',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { username, email, password } = validation.data;

        // Capture Device Info
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
        const macAddress = ipAddress === '127.0.0.1' ? '00-15-5D-BD-8A-11' : '48-2A-E3-11-BC-05';

        // 2. Security Block Check
        const [blocks]: any = await db.execute(
            'SELECT * FROM login_attempts WHERE (ip_address = ? OR mac_address = ?) AND blocked_until > NOW()',
            [ipAddress, macAddress]
        );

        if (blocks.length > 0) {
            await logActivity(null, 'SECURITY_BLOCK_ATTEMPT', `Blocked device attempted signup (Email: ${email})`, request);
            return NextResponse.json({
                message: 'Your device is temporarily blocked due to multiple failed login attempts.'
            }, { status: 429 });
        }

        // Strong password check
        if (!PASSWORD_REGEX.test(password)) {
            await logActivity(null, 'SIGNUP_FAILED', `Weak password attempt for: ${username}`, request);
            return NextResponse.json({
                message: 'Password must include uppercase, lowercase, a number, and a special character.'
            }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result]: any = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const uId = result.insertId;
        await logActivity(uId, 'SIGNUP', `New user registered: ${username} (${email})`, request);

        return NextResponse.json({ message: 'Registration successful! Please sign in.', id: uId }, { status: 201 });
    } catch (error: any) {
        console.error('Signup error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
