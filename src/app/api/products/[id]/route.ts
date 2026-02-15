import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { saveBase64Image } from '@/lib/upload';
import { getSession, ProductSchema } from '@/lib/security';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
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

        // 1. Fetch old data for logging
        const [oldProducts]: any = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (oldProducts.length === 0) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        const old = oldProducts[0];

        // 2. Save image to filesystem if it's base64
        let imagePath = image || '';
        if (image && image.startsWith('data:image/')) {
            const savedPath = await saveBase64Image(image);
            if (savedPath) imagePath = savedPath;
        }

        // 3. Perform update
        const [result]: any = await db.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image = ? WHERE id = ?',
            [name, description || '', price, stock, category, imagePath, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Product not found or no changes made' }, { status: 404 });
        }

        // 4. Compare and Log specific changes
        const changes = [];
        if (old.name !== name) changes.push(`name: "${old.name}" -> "${name}"`);
        if (Number(old.price) !== Number(price)) changes.push(`price: ${old.price} -> ${price}`);
        if (old.stock !== stock) changes.push(`stock: ${old.stock} -> ${stock}`);
        if (old.category !== category) changes.push(`category: ${old.category} -> ${category}`);

        const details = changes.length > 0 ? `Updated product ${id}. Changes: ${changes.join(', ')}` : `Updated product ${id}`;

        await logActivity(session.userId, 'UPDATE_PRODUCT', details, request);

        return NextResponse.json({ message: 'Product updated', image: imagePath });
    } catch (error: any) {
        console.error('PUT product error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const [result]: any = await db.execute('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

        await logActivity(session.userId, 'DELETE_PRODUCT', `Deleted product ID: ${id}`, request);
        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
