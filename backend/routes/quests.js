const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List all quests, with each quest's availability for the current user
router.get('/', requireAuth, (req, res) => {
  const quests = db.prepare('SELECT * FROM quests').all();

  const lastCompletion = db.prepare(`
    SELECT quest_id, MAX(completed_at) AS last_completed
    FROM quest_completions
    WHERE user_id = ?
    GROUP BY quest_id
  `).all(req.userId);

  const lastMap = Object.fromEntries(lastCompletion.map((r) => [r.quest_id, r.last_completed]));

  const now = new Date();
  const enriched = quests.map((q) => {
    const last = lastMap[q.id];
    let availableAt = null;
    let available = true;
    if (last) {
      const lastDate = new Date(last + 'Z'); // SQLite datetime('now') is UTC
      availableAt = new Date(lastDate.getTime() + q.cooldown_hours * 3600 * 1000);
      available = now >= availableAt;
    }
    return { ...q, available, availableAt: availableAt ? availableAt.toISOString() : null };
  });

  res.json({ quests: enriched });
});

// Complete a quest — cooldown and reward are enforced server-side
router.post('/:id/complete', requireAuth, (req, res) => {
  const questId = Number(req.params.id);
  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  const last = db.prepare(`
    SELECT MAX(completed_at) AS last_completed
    FROM quest_completions
    WHERE user_id = ? AND quest_id = ?
  `).get(req.userId, questId).last_completed;

  if (last) {
    const lastDate = new Date(last + 'Z');
    const availableAt = new Date(lastDate.getTime() + quest.cooldown_hours * 3600 * 1000);
    if (new Date() < availableAt) {
      return res.status(429).json({
        error: 'Quest is on cooldown',
        availableAt: availableAt.toISOString(),
      });
    }
  }

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO quest_completions (user_id, quest_id) VALUES (?, ?)').run(
      req.userId,
      questId
    );
    db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(quest.reward, req.userId);
  });
  tx();

  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.userId);
  res.json({ message: `Earned ${quest.reward} coins`, reward: quest.reward, coins: user.coins });
});

module.exports = router;
