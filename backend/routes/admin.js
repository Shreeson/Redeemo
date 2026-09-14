const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---------- Users ----------

router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = db
    .prepare(
      `SELECT id, username, email, coins, is_admin, created_at
       FROM users
       ORDER BY created_at DESC`
    )
    .all()
    .map((u) => ({ ...u, is_admin: !!u.is_admin }));

  res.json({ users, total: users.length });
});

router.delete('/users/:id', requireAuth, requireAdmin, (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.userId) {
    return res.status(400).json({ error: "You can't delete your own account from here" });
  }

  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const tx = db.transaction((userId) => {
    db.prepare('DELETE FROM quest_completions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM redemptions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM feedback WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  tx(targetId);

  res.json({ message: `Deleted user ${user.username} (${user.email})` });
});

// ---------- Quests ----------

router.get('/quests', requireAuth, requireAdmin, (req, res) => {
  const quests = db.prepare('SELECT * FROM quests ORDER BY id').all();
  res.json({ quests });
});

router.post('/quests', requireAuth, requireAdmin, (req, res) => {
  const { name, description, reward, cooldown_hours } = req.body;

  if (!name || !description || !reward || !cooldown_hours) {
    return res.status(400).json({ error: 'name, description, reward, and cooldown_hours are all required' });
  }
  if (!Number.isInteger(reward) || reward <= 0) {
    return res.status(400).json({ error: 'reward must be a positive whole number' });
  }
  if (!Number.isInteger(cooldown_hours) || cooldown_hours <= 0) {
    return res.status(400).json({ error: 'cooldown_hours must be a positive whole number' });
  }

  const result = db
    .prepare('INSERT INTO quests (name, description, reward, cooldown_hours) VALUES (?, ?, ?, ?)')
    .run(name.trim(), description.trim(), reward, cooldown_hours);

  res.status(201).json({ id: result.lastInsertRowid, name, description, reward, cooldown_hours });
});

router.put('/quests/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Quest not found' });

  const { name, description, reward, cooldown_hours } = req.body;

  if (!name || !description || !reward || !cooldown_hours) {
    return res.status(400).json({ error: 'name, description, reward, and cooldown_hours are all required' });
  }
  if (!Number.isInteger(reward) || reward <= 0) {
    return res.status(400).json({ error: 'reward must be a positive whole number' });
  }
  if (!Number.isInteger(cooldown_hours) || cooldown_hours <= 0) {
    return res.status(400).json({ error: 'cooldown_hours must be a positive whole number' });
  }

  db.prepare(
    'UPDATE quests SET name = ?, description = ?, reward = ?, cooldown_hours = ? WHERE id = ?'
  ).run(name.trim(), description.trim(), reward, cooldown_hours, id);

  res.json({ id, name, description, reward, cooldown_hours });
});

router.delete('/quests/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Quest not found' });

  const tx = db.transaction((questId) => {
    db.prepare('DELETE FROM quest_completions WHERE quest_id = ?').run(questId);
    db.prepare('DELETE FROM quests WHERE id = ?').run(questId);
  });
  tx(id);

  res.json({ message: `Deleted quest: ${existing.name}` });
});

// ---------- Rewards ----------

router.get('/rewards', requireAuth, requireAdmin, (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards ORDER BY id').all();
  res.json({ rewards });
});

router.post('/rewards', requireAuth, requireAdmin, (req, res) => {
  const { name, cost, category, image } = req.body;

  if (!name || !cost || !category) {
    return res.status(400).json({ error: 'name, cost, and category are required' });
  }
  if (!Number.isInteger(cost) || cost <= 0) {
    return res.status(400).json({ error: 'cost must be a positive whole number' });
  }

  const result = db
    .prepare('INSERT INTO rewards (name, cost, category, image) VALUES (?, ?, ?, ?)')
    .run(name.trim(), cost, category.trim(), (image || '').trim());

  res.status(201).json({ id: result.lastInsertRowid, name, cost, category, image: image || '' });
});

router.put('/rewards/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Reward not found' });

  const { name, cost, category, image } = req.body;

  if (!name || !cost || !category) {
    return res.status(400).json({ error: 'name, cost, and category are required' });
  }
  if (!Number.isInteger(cost) || cost <= 0) {
    return res.status(400).json({ error: 'cost must be a positive whole number' });
  }

  db.prepare('UPDATE rewards SET name = ?, cost = ?, category = ?, image = ? WHERE id = ?').run(
    name.trim(),
    cost,
    category.trim(),
    (image || '').trim(),
    id
  );

  res.json({ id, name, cost, category, image: image || '' });
});

router.delete('/rewards/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Reward not found' });

  const tx = db.transaction((rewardId) => {
    db.prepare('DELETE FROM redemptions WHERE reward_id = ?').run(rewardId);
    db.prepare('DELETE FROM rewards WHERE id = ?').run(rewardId);
  });
  tx(id);

  res.json({ message: `Deleted reward: ${existing.name}` });
});

module.exports = router;

