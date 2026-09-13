const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'redeemo.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL,
  cooldown_hours INTEGER NOT NULL DEFAULT 24
);

CREATE TABLE IF NOT EXISTS quest_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  quest_id INTEGER NOT NULL REFERENCES quests(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'gift-card',
  image TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migration: add is_admin column if this db was created before it existed
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes('is_admin')) {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
}

// Seed quests/rewards once, if empty
const questCount = db.prepare('SELECT COUNT(*) AS c FROM quests').get().c;
if (questCount === 0) {
  const insertQuest = db.prepare(
    'INSERT INTO quests (name, description, reward, cooldown_hours) VALUES (?, ?, ?, ?)'
  );
  insertQuest.run('Daily Check-in', 'Log in and claim your daily bonus', 50, 24);
  insertQuest.run('Watch a Video', 'Watch a short sponsored video', 30, 6);
  insertQuest.run('Invite a Friend', 'Invite a friend using your referral link', 200, 720);
  insertQuest.run('Complete a Survey', 'Fill out a short survey', 80, 24);
  insertQuest.run('Play a Sponsored Game (5 min)', 'Try a featured game for at least 5 minutes', 120, 12);
  insertQuest.run('Spin the Daily Wheel', 'One free spin every day for a random bonus', 40, 24);
  insertQuest.run('Answer Trivia', 'Answer 5 quick trivia questions correctly', 60, 8);
  insertQuest.run('Rate the App', 'Leave a rating on the app store', 150, 8760);
  insertQuest.run('Share on Social Media', 'Share your referral link on any platform', 90, 48);
  insertQuest.run('Weekly Login Streak', 'Log in every day for 7 days straight', 300, 168);
  insertQuest.run('Read a Sponsored Article', 'Read a short article from a partner brand', 25, 4);
  insertQuest.run('Complete Your Profile', 'Fill out your avatar and bio', 100, 8760);
}

const rewardCount = db.prepare('SELECT COUNT(*) AS c FROM rewards').get().c;
if (rewardCount === 0) {
  const insertReward = db.prepare(
    'INSERT INTO rewards (name, cost, category, image) VALUES (?, ?, ?, ?)'
  );
  insertReward.run('Steam Gift Card ($5)', 1000, 'gift-card', 'steam.jpg');
  insertReward.run('Steam Gift Card ($10)', 1900, 'gift-card', 'steam.jpg');
  insertReward.run('Apple Gift Card ($5)', 1000, 'gift-card', 'apple.jpg');
  insertReward.run('eBay Gift Card ($5)', 1000, 'gift-card', 'ebay.jpg');
  insertReward.run('Amazon Gift Card ($5)', 1000, 'gift-card', 'amazon.jpg');
  insertReward.run('Amazon Gift Card ($10)', 1900, 'gift-card', 'amazon.jpg');
  insertReward.run('Google Play Gift Card ($5)', 1000, 'gift-card', 'google-play.jpg');
  insertReward.run('PlayStation Store Card ($10)', 1900, 'gift-card', 'playstation.jpg');
  insertReward.run('Xbox Gift Card ($10)', 1900, 'gift-card', 'xbox.jpg');
  insertReward.run('Roblox Robux (400)', 800, 'game-currency', 'roblox.jpg');
  insertReward.run('Roblox Robux (800)', 1500, 'game-currency', 'roblox.jpg');
  insertReward.run('Fortnite V-Bucks (1000)', 850, 'game-currency', 'fortnite.jpg');
  insertReward.run('Minecoins (330)', 700, 'game-currency', 'minecraft.jpg');
  insertReward.run('Spotify Premium (1 Month)', 900, 'subscription', 'spotify.jpg');
  insertReward.run('Discord Nitro (1 Month)', 950, 'subscription', 'discord.jpg');
  insertReward.run('Charity Donation ($5)', 500, 'charity', 'charity.jpg');
  insertReward.run('Environmental Fund ($5)', 500, 'charity', 'environment.jpg');
  insertReward.run('Education Support Fund ($5)', 500, 'charity', 'education.jpg');
  insertReward.run('Food Bank Donation ($5)', 500, 'charity', 'foodbank.jpg');
}

module.exports = db;
