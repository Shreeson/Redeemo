const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
