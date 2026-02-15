import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // 1. Rename image_url to image in products table if it exists
        const [columns]: any = await db.execute('SHOW COLUMNS FROM products LIKE "image_url"');
        if (columns.length > 0) {
            await db.execute('ALTER TABLE products CHANGE image_url image LONGTEXT');
            return NextResponse.json({ message: 'Renamed image_url to image in products table' });
        }
        
        // 2. Double check if 'image' exists if 'image_url' didn't
        const [columns2]: any = await db.execute('SHOW COLUMNS FROM products LIKE "image"');
        if (columns2.length === 0) {
            await db.execute('ALTER TABLE products ADD COLUMN image LONGTEXT AFTER category');
            return NextResponse.json({ message: 'Added image column to products table' });
        }

        return NextResponse.json({ message: 'Database schema is already correct' });
    } catch (error: any) {
        return NextResponse.json({ message: 'Migration failed', error: error.message }, { status: 500 });
    }
}
