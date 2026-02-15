import db from './src/lib/db.ts';

async function apply() {
    console.log('--- Applying Security Enhancements (Retry with .query()) ---');
    try {
        // 1. Indexes & Views
        console.log('Re-applying Views...');
        await db.query('CREATE OR REPLACE VIEW view_secure_users AS SELECT id, username, email, role, status, created_at FROM users');
        await db.query('CREATE OR REPLACE VIEW view_available_inventory AS SELECT * FROM products WHERE stock > 0');

        // 2. Triggers
        console.log('Setting up triggers...');

        await db.query('DROP TRIGGER IF EXISTS trig_check_stock_integrity');
        const trigger1 = `
            CREATE TRIGGER trig_check_stock_integrity
            BEFORE UPDATE ON products
            FOR EACH ROW
            BEGIN
                IF NEW.stock < 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Stock cannot be negative';
                END IF;
            END
        `;
        await db.query(trigger1);

        await db.query('DROP TRIGGER IF EXISTS trig_audit_user_changes');
        const trigger2 = `
            CREATE TRIGGER trig_audit_user_changes
            AFTER UPDATE ON users
            FOR EACH ROW
            BEGIN
                IF OLD.role <> NEW.role OR OLD.status <> NEW.status THEN
                    INSERT INTO logs (user_id, action, details)
                    VALUES (
                        NEW.id, 
                        'USER_SEC_CHANGE', 
                        CONCAT('User update: Role [', OLD.role, '->', NEW.role, '], Status [', OLD.status, '->', NEW.status, ']')
                    );
                END IF;
            END
        `;
        await db.query(trigger2);

        console.log('--- Security Enhancements Applied Successfully ---');
    } catch (err) {
        console.error('--- Migration Failed ---');
        console.error(err);
    } finally {
        process.exit();
    }
}

apply();
