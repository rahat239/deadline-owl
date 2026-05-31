require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const deadlineRoutes = require('./routes/deadlines');
const { runAlertScheduler } = require('./lib/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/deadlines', deadlineRoutes);

// Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/refund', (req, res) => res.sendFile(path.join(__dirname, 'public', 'refund.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/blog', (req, res) => {
  const blogPath = path.join(__dirname, 'public', 'blog.html');
  const fs = require('fs');
  if (fs.existsSync(blogPath)) res.sendFile(blogPath);
  else res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run alert scheduler daily at 9am UTC
cron.schedule('0 9 * * *', async () => {
  try { await runAlertScheduler(); }
  catch (err) { console.error('Scheduler error:', err.message); }
});

// Also run on startup after 10 seconds
setTimeout(() => { runAlertScheduler().catch(console.error); }, 10000);

app.listen(PORT, () => {
  console.log(`DeadlineOwl running on http://localhost:${PORT}`);
});

module.exports = app;
