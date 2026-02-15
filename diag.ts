import db from './src/lib/db.ts';

async function test() {
    console.log('--- DB DIAGNOSTIC START ---');
    try {
        console.log('Testing connection (SELECT 1)...');
        const [res1] = await db.execute('SELECT 1 as val');
        console.log('Connection OK:', res1);

        console.log('Testing table access (DESCRIBE products)...');
        const [res2] = await db.execute('DESCRIBE products');
        console.log('Table exists. Columns:', res2.map((c: any) => c.Field).join(', '));

        console.log('Testing small UPDATE...');
        // Find a product to test on
        const [products]: any = await db.execute('SELECT id FROM products LIMIT 1');
        if (products.length > 0) {
            const id = products[0].id;
            const [res3] = await db.execute('UPDATE products SET description = description WHERE id = ?', [id]);
            console.log('Small UPDATE OK:', res3);
        } else {
            console.log('No products to test UPDATE on');
        }

        console.log('--- DB DIAGNOSTIC SUCCESS ---');
    } catch (err: any) {
        console.error('--- DB DIAGNOSTIC FAILED ---');
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        console.error('Stack:', err.stack);
    } finally {
        process.exit();
    }
}

test();
