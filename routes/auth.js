const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const { sendWelcomeEmail } = require('../lib/email');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, company_name, industry, country } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      company_name: company_name || null,
      industry: industry || null,
      country: country || null,
    })
    .select('id, email, plan, company_name')
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.setHeader('Set-Cookie', `token=${token}; Max-Age=2592000; HttpOnly; SameSite=lax; Path=/`);
  sendWelcomeEmail({ to: user.email, name: user.company_name }).catch(console.error);
  res.json({ success: true, user: { id: user.id, email: user.email, plan: user.plan } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, plan')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.setHeader('Set-Cookie', `token=${token}; Max-Age=2592000; HttpOnly; SameSite=lax; Path=/`);
  res.json({ success: true, user: { id: user.id, email: user.email, plan: user.plan } });
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'token=; Max-Age=0; HttpOnly; SameSite=lax; Path=/');
  res.json({ success: true });
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, email, plan, company_name, industry, country, email_alerts, created_at')
      .eq('id', decoded.id)
      .single();
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
