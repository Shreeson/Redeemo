// Usage: node scripts/make-admin.js someone@example.com
const path = require('path');
const Database = require('better-sqlite3');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

const db = new Database(path.join(__dirname, '..', 'redeemo.db'));

const user = db.prepare('SELECT id, username, email, is_admin FROM users WHERE email = ?').get(email);

if (!user) {
  console.log(`No user found with email: ${email}`);
  process.exit(0);
}

if (user.is_admin) {
  console.log(`${user.username} (${user.email}) is already an admin.`);
  process.exit(0);
}

db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
console.log(`${user.username} (${user.email}) is now an admin.`);
