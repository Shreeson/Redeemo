const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards').all();
  res.json({ rewards });
});

router.post('/:id/redeem', requireAuth, (req, res) => {
  const rewardId = Number(req.params.id);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (user.coins < reward.cost) {
    return res.status(400).json({ error: 'Not enough coins', needed: reward.cost, have: user.coins });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(reward.cost, req.userId);
    db.prepare('INSERT INTO redemptions (user_id, reward_id) VALUES (?, ?)').run(
      req.userId,
      rewardId
    );
  });
  tx();

  const updated = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.userId);
  res.json({ message: `Redeemed ${reward.name}`, coins: updated.coins });
});

router.get('/history', requireAuth, (req, res) => {
  const history = db.prepare(`
    SELECT redemptions.id, redemptions.redeemed_at, rewards.name, rewards.cost
    FROM redemptions
    JOIN rewards ON rewards.id = redemptions.reward_id
    WHERE redemptions.user_id = ?
    ORDER BY redemptions.redeemed_at DESC
  `).all(req.userId);
  res.json({ history });
});

module.exports = router;
