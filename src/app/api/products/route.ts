import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { saveBase64Image } from '@/lib/upload';
import { getSession, ProductSchema } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const [products]: any = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Zod Validation
        const validation = ProductSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid product data',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { name, description, price, stock, category, image } = validation.data;

        // 1. Save image to filesystem if it's base64
        let imagePath = image || '';
        if (image && image.startsWith('data:image/')) {
            const savedPath = await saveBase64Image(image);
            if (savedPath) imagePath = savedPath;
        }

        const [result]: any = await db.execute(
            'INSERT INTO products (user_id, name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [session.userId, name, description || '', price, stock, category, imagePath]
        );

        await logActivity(session.userId, 'CREATE_PRODUCT', `Created product: ${name} (ID: ${result.insertId})`, request);

        return NextResponse.json({ message: 'Product created', id: result.insertId, image: imagePath }, { status: 201 });
    } catch (error: any) {
        console.error('POST product error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
