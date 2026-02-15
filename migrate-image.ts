import db from './src/lib/db.ts';

async function migrate() {
    console.log('--- SCHEMA FIX START ---');
    try {
        const [columns]: any = await db.execute('SHOW COLUMNS FROM products LIKE "image_url"');
        if (columns.length > 0) {
            console.log('Renaming image_url to image...');
            await db.execute('ALTER TABLE products CHANGE image_url image LONGTEXT');
            console.log('Rename successful.');
        } else {
            console.log('Column image_url not found.');
            const [columns2]: any = await db.execute('SHOW COLUMNS FROM products LIKE "image"');
            if (columns2.length === 0) {
                console.log('Adding image column...');
                await db.execute('ALTER TABLE products ADD COLUMN image LONGTEXT AFTER category');
                console.log('Add successful.');
            } else {
                console.log('Column image already exists.');
            }
        }
        console.log('--- SCHEMA FIX SUCCESS ---');
    } catch (err: any) {
        console.error('--- SCHEMA FIX FAILED ---');
        console.error(err.message);
    } finally {
        process.exit();
    }
}

migrate();
