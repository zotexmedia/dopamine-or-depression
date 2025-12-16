// Leads API routes (admin-only)

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { updateLeadsForDate, getRecentEntries } from '../services/metrics-calculator.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/leads - Submit daily lead count
router.post('/', async (req, res) => {
  const { date, leadCount, notes } = req.body;

  // Validate lead count
  if (leadCount === undefined || leadCount === null) {
    return res.status(400).json({ error: 'leadCount is required' });
  }

  const count = parseInt(leadCount, 10);
  if (isNaN(count) || count < 0) {
    return res.status(400).json({ error: 'leadCount must be a non-negative integer' });
  }

  // Use today if no date provided
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const result = await updateLeadsForDate(targetDate, count, notes);
    res.json(result);
  } catch (err) {
    console.error('Failed to update leads:', err);
    res.status(500).json({ error: 'Failed to update lead count' });
  }
});

// GET /api/leads/recent - Get recent entries for reference
router.get('/recent', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;

  try {
    const entries = await getRecentEntries(days);
    res.json(entries);
  } catch (err) {
    console.error('Failed to get recent entries:', err);
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

export default router;
