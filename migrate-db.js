const sqlite = require('better-sqlite3');
const path = require('path');

const db = new sqlite(path.join(process.cwd(), 'aura.db'));

try {
    // Check if role column exists
    const info = db.prepare("PRAGMA table_info(users)").all();
    const hasRole = info.some(col => col.name === 'role');

    if (!hasRole) {
        db.prepare("ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'").run();
        console.log('Added role column to users table');
    } else {
        console.log('Role column already exists');
    }
} catch (error) {
    console.error('Migration error:', error);
}
