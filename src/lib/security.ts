import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'synthshield_ultra_secure_fallback_secret_32_chars_long'
);

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const AuthSchema = z.object({
    email: z.string().min(3, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const ProductSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().optional().nullable(),
    price: z.coerce.number().positive('Price must be positive'),
    stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
    category: z.string().min(1, 'Category is required'),
    image: z.string().optional().nullable(),
});

export const OrderSchema = z.object({
    customer_name: z.string().min(1),
    customer_email: z.string().email().optional().or(z.literal('')).nullable(),
    items: z.array(z.object({
        product_id: z.coerce.number(),
        quantity: z.coerce.number().int().positive(),
        unit_price: z.coerce.number().positive(),
    })).min(1),
});

export const UpdateProfileSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
});

export const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().regex(PASSWORD_REGEX, 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"]
});

export const SignupSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().regex(PASSWORD_REGEX, 'Strong password required'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export async function signJWT(payload: { userId: string | number; role: string }) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string | number; role: string };
    } catch (err) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
}

export async function checkAdmin() {
    const session = await getSession();
    return session?.role === 'admin';
}
