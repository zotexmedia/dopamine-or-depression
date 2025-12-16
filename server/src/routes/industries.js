// Industries API routes
import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// GET /api/industries - List all industries
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, source, send_percentage, keywords
      FROM industries
      ORDER BY send_percentage DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to get industries:', err);
    res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

// Calculate sends based on source type
// - apollo: 100% of sends (general)
// - gmaps: 50% of sends (flat)
// - industry_specific: 50% of sends × industry percentage
function calculateIndustrySends(totalSends, source, industryPercentage) {
  if (source === 'gmaps') {
    // GMaps: flat 50% of sends, no industry breakdown
    return Math.round(totalSends * 0.50);
  } else if (source === 'industry_specific') {
    // Industry Specific: 50% of sends × industry percentage
    return Math.round(totalSends * 0.50 * (industryPercentage / 100));
  } else {
    // Apollo (general): 100% of sends × industry percentage
    return Math.round(totalSends * (industryPercentage / 100));
  }
}

// GET /api/industries/leads - Get industry leads with ETL metrics
router.get('/leads', async (req, res) => {
  const { startDate, endDate, source } = req.query;

  try {
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE il.date >= $1 AND il.date <= $2';
      params = [startDate, endDate];
    }

    if (source) {
      if (dateFilter) {
        dateFilter += ` AND il.source = $${params.length + 1}`;
      } else {
        dateFilter = `WHERE il.source = $1`;
      }
      params.push(source);
    }

    // Get total sends for the period
    const sendsResult = await query(`
      SELECT COALESCE(SUM(emails_sent), 0) as total_sends
      FROM daily_metrics
      ${startDate && endDate ? 'WHERE date >= $1 AND date <= $2' : ''}
    `, startDate && endDate ? [startDate, endDate] : []);

    const totalSends = parseInt(sendsResult.rows[0]?.total_sends) || 0;

    // Get leads by industry and source
    const result = await query(`
      SELECT
        i.id,
        i.name,
        i.send_percentage,
        il.source as lead_source,
        COALESCE(SUM(il.leads_count), 0) as total_leads
      FROM industries i
      LEFT JOIN industry_leads il ON i.id = il.industry_id
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
      GROUP BY i.id, i.name, i.send_percentage, il.source
      ORDER BY i.send_percentage DESC
    `, params);

    // Calculate ETL for each industry/source combination
    const industries = result.rows.map(row => {
      const leadSource = row.lead_source || 'apollo';
      const industryPercentage = parseFloat(row.send_percentage);
      const industrySends = calculateIndustrySends(totalSends, leadSource, industryPercentage);
      const leads = parseInt(row.total_leads) || 0;
      const etlRatio = leads > 0 ? Math.round(industrySends / leads) : 0;

      return {
        id: row.id,
        name: row.name,
        source: leadSource,
        sendPercentage: industryPercentage,
        sends: industrySends,
        leads,
        etlRatio,
        sendsPerLead: etlRatio
      };
    });

    res.json({
      totalSends,
      industries
    });
  } catch (err) {
    console.error('Failed to get industry leads:', err);
    res.status(500).json({ error: 'Failed to fetch industry leads' });
  }
});

// GET /api/industries/leaderboard - Get top industries by ETL
router.get('/leaderboard', async (req, res) => {
  const { startDate, endDate, source, limit = 20 } = req.query;

  try {
    // Get total sends for the period
    const sendsResult = await query(`
      SELECT COALESCE(SUM(emails_sent), 0) as total_sends
      FROM daily_metrics
      ${startDate && endDate ? 'WHERE date >= $1 AND date <= $2' : ''}
    `, startDate && endDate ? [startDate, endDate] : []);

    const totalSends = parseInt(sendsResult.rows[0]?.total_sends) || 0;

    // Build date filter for industry_leads
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'AND il.date >= $1 AND il.date <= $2';
      params = [startDate, endDate];
    }

    if (source) {
      dateFilter += ` AND il.source = $${params.length + 1}`;
      params.push(source);
    }

    // Get industries with leads grouped by source
    const result = await query(`
      SELECT
        i.id,
        i.name,
        i.send_percentage,
        il.source as lead_source,
        COALESCE(SUM(il.leads_count), 0) as total_leads
      FROM industries i
      LEFT JOIN industry_leads il ON i.id = il.industry_id ${dateFilter}
      GROUP BY i.id, i.name, i.send_percentage, il.source
      HAVING COALESCE(SUM(il.leads_count), 0) > 0
      ORDER BY i.send_percentage DESC
    `, params);

    // Calculate ETL and sort by best ratio
    const industries = result.rows
      .map(row => {
        const leadSource = row.lead_source || 'apollo';
        const industryPercentage = parseFloat(row.send_percentage);
        const industrySends = calculateIndustrySends(totalSends, leadSource, industryPercentage);
        const leads = parseInt(row.total_leads) || 0;
        const etlRatio = leads > 0 ? Math.round(industrySends / leads) : Infinity;

        return {
          id: row.id,
          name: row.name,
          source: leadSource,
          sendPercentage: industryPercentage,
          sends: industrySends,
          leads,
          etlRatio,
          sendsPerLead: etlRatio
        };
      })
      .filter(i => i.leads > 0 && i.etlRatio !== Infinity)
      .sort((a, b) => a.etlRatio - b.etlRatio) // Lower is better
      .slice(0, parseInt(limit));

    res.json({
      totalSends,
      leaderboard: industries
    });
  } catch (err) {
    console.error('Failed to get industry leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/industries/leads - Submit leads for an industry
router.post('/leads', async (req, res) => {
  const { industryId, date, leadsCount, source = 'apollo', notes } = req.body;

  if (!industryId || !date || leadsCount === undefined) {
    return res.status(400).json({ error: 'industryId, date, and leadsCount are required' });
  }

  try {
    const result = await query(`
      INSERT INTO industry_leads (industry_id, date, source, leads_count, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date, industry_id, source) DO UPDATE SET
        leads_count = $4,
        notes = $5,
        updated_at = NOW()
      RETURNING *
    `, [industryId, date, source, leadsCount, notes]);

    // Also update total leads for the day
    await query(`
      INSERT INTO daily_metrics (date, leads_generated, leads_updated_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (date) DO UPDATE SET
        leads_generated = (
          SELECT COALESCE(SUM(leads_count), 0)
          FROM industry_leads
          WHERE date = $1
        ),
        leads_updated_at = NOW(),
        updated_at = NOW()
    `, [date]);

    res.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (err) {
    console.error('Failed to submit industry leads:', err);
    res.status(500).json({ error: 'Failed to submit leads' });
  }
});

// GET /api/industries/:id/stats - Get stats for a specific industry
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Get industry info
    const industryResult = await query(
      'SELECT * FROM industries WHERE id = $1',
      [id]
    );

    if (industryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    const industry = industryResult.rows[0];

    // Get total sends for the period
    const sendsResult = await query(`
      SELECT COALESCE(SUM(emails_sent), 0) as total_sends
      FROM daily_metrics
      ${startDate && endDate ? 'WHERE date >= $1 AND date <= $2' : ''}
    `, startDate && endDate ? [startDate, endDate] : []);

    const totalSends = parseInt(sendsResult.rows[0]?.total_sends) || 0;

    // Get leads for this industry grouped by source
    const leadsResult = await query(`
      SELECT
        source,
        COALESCE(SUM(leads_count), 0) as total_leads,
        COUNT(DISTINCT date) as days_with_leads
      FROM industry_leads
      WHERE industry_id = $1
      ${startDate && endDate ? 'AND date >= $2 AND date <= $3' : ''}
      GROUP BY source
    `, startDate && endDate ? [id, startDate, endDate] : [id]);

    // Calculate stats per source
    const industryPercentage = parseFloat(industry.send_percentage);
    const statsBySource = leadsResult.rows.map(row => {
      const source = row.source || 'apollo';
      const leads = parseInt(row.total_leads) || 0;
      const daysWithLeads = parseInt(row.days_with_leads) || 0;
      const industrySends = calculateIndustrySends(totalSends, source, industryPercentage);

      return {
        source,
        sends: industrySends,
        leads,
        etlRatio: leads > 0 ? Math.round(industrySends / leads) : 0,
        daysWithLeads,
        avgLeadsPerDay: daysWithLeads > 0 ? Math.round(leads / daysWithLeads * 10) / 10 : 0
      };
    });

    // Calculate totals
    const totalLeads = statsBySource.reduce((sum, s) => sum + s.leads, 0);
    const totalDaysWithLeads = Math.max(...statsBySource.map(s => s.daysWithLeads), 0);
    // Use Apollo calculation for overall sends (100%)
    const overallSends = calculateIndustrySends(totalSends, 'apollo', industryPercentage);

    res.json({
      industry: {
        id: industry.id,
        name: industry.name,
        source: industry.source,
        sendPercentage: industryPercentage,
        keywords: industry.keywords
      },
      stats: {
        sends: overallSends,
        leads: totalLeads,
        etlRatio: totalLeads > 0 ? Math.round(overallSends / totalLeads) : 0,
        daysWithLeads: totalDaysWithLeads,
        avgLeadsPerDay: totalDaysWithLeads > 0 ? Math.round(totalLeads / totalDaysWithLeads * 10) / 10 : 0
      },
      statsBySource
    });
  } catch (err) {
    console.error('Failed to get industry stats:', err);
    res.status(500).json({ error: 'Failed to fetch industry stats' });
  }
});

export default router;
