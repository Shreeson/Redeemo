const path = require('path');
const Database = require('better-sqlite3');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-user.js <email>');
  process.exit(1);
}

const db = new Database(path.join(__dirname, '..', 'redeemo.db'));

const user = db.prepare('SELECT id, username, email FROM users WHERE email = ?').get(email);

if (!user) {
  console.log(`No user found with email: ${email}`);
  process.exit(0);
}

const tx = db.transaction((userId) => {
  db.prepare('DELETE FROM quest_completions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM redemptions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM feedback WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
});

tx(user.id);

console.log(`Deleted user: ${user.username} (${user.email})`);