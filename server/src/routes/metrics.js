// Metrics API routes

import express from 'express';
import {
  getMetricsForAllPeriods,
  syncTodaySends,
  syncSendsForDate
} from '../services/metrics-calculator.js';
import { instantlyClient } from '../services/instantly-client.js';

const router = express.Router();

// GET /api/metrics - Get all metrics for dashboard
router.get('/', async (req, res) => {
  try {
    const metrics = await getMetricsForAllPeriods();
    res.json(metrics);
  } catch (err) {
    console.error('Failed to get metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/metrics/refresh - Force sync from Instantly
router.post('/refresh', async (req, res) => {
  try {
    const result = await syncTodaySends();

    if (result.success) {
      res.json({
        success: true,
        date: result.date,
        totalSendsToday: result.sends,
        syncedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Refresh failed:', err);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

// POST /api/metrics/sync-date - Sync a specific date (for backfilling)
router.post('/sync-date', async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const result = await syncSendsForDate(date);
    res.json(result);
  } catch (err) {
    console.error('Sync date failed:', err);
    res.status(500).json({ error: 'Failed to sync date' });
  }
});

// GET /api/metrics/date/:date - Get metrics for a specific date
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }

  try {
    const { query } = await import('../db/database.js');
    const result = await query(
      'SELECT * FROM daily_metrics WHERE date = $1',
      [date]
    );

    if (result.rows.length === 0) {
      return res.json({
        date,
        sends: 0,
        leads: 0,
        etlRatio: 0,
        sendsPerLead: 0,
        exists: false
      });
    }

    const row = result.rows[0];
    const sends = parseInt(row.emails_sent) || 0;
    const leads = parseInt(row.leads_generated) || 0;

    res.json({
      date,
      sends,
      leads,
      etlRatio: sends > 0 ? leads / sends : 0,
      sendsPerLead: leads > 0 ? Math.round(sends / leads) : 0,
      notes: row.notes,
      exists: true
    });
  } catch (err) {
    console.error('Failed to get date metrics:', err);
    res.status(500).json({ error: 'Failed to fetch date metrics' });
  }
});

// GET /api/metrics/range - Get metrics for a date range
router.get('/range', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ error: 'Valid start and end dates (YYYY-MM-DD) are required' });
  }

  try {
    const { query } = await import('../db/database.js');
    const result = await query(
      'SELECT * FROM daily_metrics WHERE date >= $1 AND date <= $2',
      [start, end]
    );

    // Aggregate the results
    let totalSends = 0;
    let totalLeads = 0;

    for (const row of result.rows) {
      totalSends += parseInt(row.emails_sent) || 0;
      totalLeads += parseInt(row.leads_generated) || 0;
    }

    res.json({
      startDate: start,
      endDate: end,
      days: result.rows.length,
      sends: totalSends,
      leads: totalLeads,
      etlRatio: totalSends > 0 ? totalLeads / totalSends : 0,
      sendsPerLead: totalLeads > 0 ? Math.round(totalSends / totalLeads) : 0
    });
  } catch (err) {
    console.error('Failed to get range metrics:', err);
    res.status(500).json({ error: 'Failed to fetch range metrics' });
  }
});

// GET /api/metrics/health - Check Instantly API health
router.get('/health', async (req, res) => {
  try {
    const health = await instantlyClient.healthCheck();
    res.json(health);
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

export default router;
