require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const questRoutes = require('./routes/quests');
const rewardRoutes = require('./routes/rewards');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Redeemo API listening on port ${PORT}`));
