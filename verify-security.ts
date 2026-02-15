import db from './src/lib/db.ts';

async function verify() {
    try {
        console.log('--- Checking Database Security Features ---');

        // Check Views
        console.log('\nChecking Views:');
        try {
            const [users]: any = await db.execute('SELECT * FROM view_secure_users LIMIT 1');
            console.log('view_secure_users: SUCCESS (Columns:', Object.keys(users[0] || {}).join(', '), ')');
        } catch (e: any) { console.error('view_secure_users: FAILED -', e.message); }

        try {
            await db.execute('SELECT * FROM view_available_inventory LIMIT 1');
            console.log('view_available_inventory: SUCCESS');
        } catch (e: any) { console.error('view_available_inventory: FAILED -', e.message); }

        // Check Triggers
        console.log('\nChecking Triggers:');
        try {
            await db.execute('UPDATE products SET stock = -10 WHERE id = 1');
            console.error('trig_check_stock_integrity: FAILED (Allowed negative stock)');
        } catch (e: any) {
            if (e.message.includes('Stock cannot be negative')) {
                console.log('trig_check_stock_integrity: SUCCESS (Blocked negative stock)');
            } else {
                console.error('trig_check_stock_integrity: FAILED -', e.message);
            }
        }

        try {
            // Update a user to trigger audit
            await db.execute('UPDATE users SET status = "deactivated" WHERE id = 1');
            const [logs]: any = await db.execute('SELECT * FROM logs WHERE action = "USER_SEC_CHANGE" ORDER BY created_at DESC LIMIT 1');
            if (logs.length > 0) {
                console.log('trig_audit_user_changes: SUCCESS (Log entry found)');
            } else {
                console.error('trig_audit_user_changes: FAILED (No log entry found)');
            }
            // Reset status
            await db.execute('UPDATE users SET status = "active" WHERE id = 1');
        } catch (e: any) { console.error('trig_audit_user_changes: FAILED -', e.message); }

        console.log('\n--- Verification Complete ---');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

verify();
