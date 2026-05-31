const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../lib/auth');
const { getPlanLimits } = require('../lib/plans');

const router = express.Router();
router.use(authMiddleware);

// GET /api/deadlines
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', req.user.id)
    .order('due_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/deadlines
router.post('/', async (req, res) => {
  const { title, description, due_date, category, jurisdiction, alert_30d, alert_14d, alert_7d, alert_1d } = req.body;

  if (!title || !due_date) return res.status(400).json({ error: 'Title and due date are required' });

  // Check plan limits
  const limits = getPlanLimits(req.user.plan);
  const { count } = await supabase
    .from('deadlines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('status', 'upcoming');

  if (count >= limits.maxDeadlines) {
    return res.status(403).json({ error: `Your ${req.user.plan} plan allows up to ${limits.maxDeadlines} active deadlines. Please upgrade.` });
  }

  const { data, error } = await supabase
    .from('deadlines')
    .insert({
      user_id: req.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      due_date,
      category: category || 'other',
      jurisdiction: jurisdiction?.trim() || null,
      alert_30d: alert_30d !== false,
      alert_14d: alert_14d !== false,
      alert_7d: alert_7d !== false,
      alert_1d: alert_1d !== false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/deadlines/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['title', 'description', 'due_date', 'category', 'jurisdiction', 'status', 'alert_30d', 'alert_14d', 'alert_7d', 'alert_1d'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const { data, error } = await supabase
    .from('deadlines')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/deadlines/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('deadlines')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/deadlines/stats
router.get('/stats', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: all } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', req.user.id);

  const upcoming = (all || []).filter(d => d.status === 'upcoming');
  const dueSoon = upcoming.filter(d => d.due_date <= in7days);
  const dueThisMonth = upcoming.filter(d => d.due_date <= in30days);
  const missed = (all || []).filter(d => d.status === 'missed');
  const completed = (all || []).filter(d => d.status === 'completed');

  res.json({
    total: (all || []).length,
    upcoming: upcoming.length,
    due_soon: dueSoon.length,
    due_this_month: dueThisMonth.length,
    missed: missed.length,
    completed: completed.length,
  });
});

module.exports = router;
