const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  db.prepare('INSERT INTO feedback (user_id, message) VALUES (?, ?)').run(
    req.userId,
    message.trim()
  );
  res.status(201).json({ message: 'Feedback received. Thank you!' });
});

// Admin-only: view all feedback, most recent first
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const feedback = db
    .prepare(
      `SELECT feedback.id, feedback.message, feedback.created_at,
              users.username, users.email
       FROM feedback
       LEFT JOIN users ON users.id = feedback.user_id
       ORDER BY feedback.created_at DESC`
    )
    .all();
  res.json({ feedback });
});

module.exports = router;
