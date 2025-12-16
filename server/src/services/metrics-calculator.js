// Metrics Calculator Service
// Handles ETL ratio calculations and data aggregation

import { query } from '../db/database.js';
import { instantlyClient } from './instantly-client.js';
import { backfillHistoricalSends } from './backfill.js';

// Calculate ETL metrics for a set of rows
function calculateMetrics(rows) {
  const totalSends = rows.reduce((sum, r) => sum + (parseInt(r.emails_sent) || 0), 0);
  const totalLeads = rows.reduce((sum, r) => sum + (parseInt(r.leads_generated) || 0), 0);

  return {
    sends: totalSends,
    leads: totalLeads,
    etlRatio: totalSends > 0 ? totalLeads / totalSends : 0,
    sendsPerLead: totalLeads > 0 ? Math.round(totalSends / totalLeads) : 0
  };
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Get date N days ago
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return formatDate(date);
}

// Get first day of current week (Sunday)
function firstOfWeek() {
  const date = new Date();
  const day = date.getDay(); // 0 = Sunday
  date.setDate(date.getDate() - day);
  return formatDate(date);
}

// Get first day of current month
function firstOfMonth() {
  const date = new Date();
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

// Get metrics for all time periods
export async function getMetricsForAllPeriods() {
  const today = formatDate(new Date());
  const yesterday = daysAgo(1);
  const weekStart = firstOfWeek();
  const monthStart = firstOfMonth();
  const yearAgo = daysAgo(365);

  // Fetch data for all periods in parallel
  const [dayResult, yesterdayResult, weekResult, monthResult, yearResult, allResult, trendResult] = await Promise.all([
    query('SELECT * FROM daily_metrics WHERE date = $1', [today]),
    query('SELECT * FROM daily_metrics WHERE date = $1', [yesterday]),
    query('SELECT * FROM daily_metrics WHERE date >= $1', [weekStart]),
    query('SELECT * FROM daily_metrics WHERE date >= $1', [monthStart]),
    query('SELECT * FROM daily_metrics WHERE date >= $1', [yearAgo]),
    query('SELECT * FROM daily_metrics'),
    query('SELECT date, emails_sent, leads_generated FROM daily_metrics WHERE date >= $1 ORDER BY date ASC', [daysAgo(30)])
  ]);

  // Get last sync time
  const syncResult = await query(
    'SELECT sends_last_synced_at FROM daily_metrics WHERE sends_last_synced_at IS NOT NULL ORDER BY sends_last_synced_at DESC LIMIT 1'
  );
  const lastSyncedAt = syncResult.rows[0]?.sends_last_synced_at || null;

  // Calculate metrics for each period
  const periods = {
    day: calculateMetrics(dayResult.rows),
    yesterday: calculateMetrics(yesterdayResult.rows),
    week: calculateMetrics(weekResult.rows),
    month: calculateMetrics(monthResult.rows),
    year: calculateMetrics(yearResult.rows),
    allTime: calculateMetrics(allResult.rows)
  };

  // Build trend data (last 30 days)
  const trend = trendResult.rows.map(row => ({
    date: formatDate(new Date(row.date)),
    sends: parseInt(row.emails_sent) || 0,
    leads: parseInt(row.leads_generated) || 0,
    etlRatio: row.emails_sent > 0 ? row.leads_generated / row.emails_sent : 0
  }));

  return {
    periods,
    trend,
    lastSyncedAt,
    today: {
      date: today,
      ...periods.day
    }
  };
}

// Get metrics for a specific period
export async function getMetricsForPeriod(period) {
  let startDate;

  switch (period) {
    case 'day':
      startDate = formatDate(new Date());
      break;
    case 'week':
      startDate = daysAgo(7);
      break;
    case 'month':
      startDate = daysAgo(30);
      break;
    case 'year':
      startDate = daysAgo(365);
      break;
    case 'allTime':
    default:
      startDate = null;
  }

  const result = startDate
    ? await query('SELECT * FROM daily_metrics WHERE date >= $1', [startDate])
    : await query('SELECT * FROM daily_metrics');

  return calculateMetrics(result.rows);
}

// Sync sends from Instantly for a specific date
export async function syncSendsForDate(date) {
  const formattedDate = typeof date === 'string' ? date : formatDate(date);

  console.log(`Syncing sends for ${formattedDate}...`);

  try {
    const totalSends = await instantlyClient.getTotalSendsForDate(formattedDate);

    // Upsert into daily_metrics
    await query(`
      INSERT INTO daily_metrics (date, emails_sent, sends_last_synced_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (date) DO UPDATE SET
        emails_sent = $2,
        sends_last_synced_at = NOW(),
        updated_at = NOW(),
        etl_ratio = CASE
          WHEN daily_metrics.leads_generated > 0
          THEN daily_metrics.leads_generated::decimal / NULLIF($2, 0)
          ELSE NULL
        END,
        sends_per_lead = CASE
          WHEN daily_metrics.leads_generated > 0 AND $2 > 0
          THEN $2::decimal / daily_metrics.leads_generated
          ELSE NULL
        END
    `, [formattedDate, totalSends]);

    console.log(`Synced ${totalSends} sends for ${formattedDate}`);
    return { success: true, date: formattedDate, sends: totalSends };
  } catch (err) {
    console.error(`Failed to sync sends for ${formattedDate}:`, err.message);
    return { success: false, date: formattedDate, error: err.message };
  }
}

// Sync sends for today
export async function syncTodaySends() {
  return syncSendsForDate(new Date());
}

// Update leads for a date
export async function updateLeadsForDate(date, leadCount, notes = null) {
  const formattedDate = typeof date === 'string' ? date : formatDate(date);

  // Get current data to return previous count
  const currentResult = await query(
    'SELECT leads_generated FROM daily_metrics WHERE date = $1',
    [formattedDate]
  );
  const previousCount = currentResult.rows[0]?.leads_generated || 0;

  // Upsert with new lead count
  const result = await query(`
    INSERT INTO daily_metrics (date, leads_generated, leads_updated_at, notes, updated_at)
    VALUES ($1, $2, NOW(), $3, NOW())
    ON CONFLICT (date) DO UPDATE SET
      leads_generated = $2,
      leads_updated_at = NOW(),
      notes = COALESCE($3, daily_metrics.notes),
      updated_at = NOW(),
      etl_ratio = CASE
        WHEN daily_metrics.emails_sent > 0
        THEN $2::decimal / daily_metrics.emails_sent
        ELSE NULL
      END,
      sends_per_lead = CASE
        WHEN $2 > 0 AND daily_metrics.emails_sent > 0
        THEN daily_metrics.emails_sent::decimal / $2
        ELSE NULL
      END
    RETURNING etl_ratio
  `, [formattedDate, leadCount, notes]);

  return {
    success: true,
    date: formattedDate,
    previousLeadCount: previousCount,
    newLeadCount: leadCount,
    newEtlRatio: parseFloat(result.rows[0]?.etl_ratio) || 0
  };
}

// Get recent entries for admin reference
export async function getRecentEntries(days = 7) {
  const result = await query(`
    SELECT date, emails_sent, leads_generated, etl_ratio, notes, leads_updated_at
    FROM daily_metrics
    WHERE date >= $1
    ORDER BY date DESC
  `, [daysAgo(days)]);

  return result.rows.map(row => ({
    date: formatDate(new Date(row.date)),
    sends: parseInt(row.emails_sent) || 0,
    leads: parseInt(row.leads_generated) || 0,
    etlRatio: parseFloat(row.etl_ratio) || 0,
    notes: row.notes,
    updatedAt: row.leads_updated_at
  }));
}

// Full historical backfill from Instantly
export async function runFullBackfill() {
  console.log('Starting full historical backfill...');

  try {
    // Fetch all daily analytics from Jan 1, 2025 to today
    const startDate = '2025-01-01';
    const endDate = formatDate(new Date());

    const dailyData = await instantlyClient.getDailyAnalytics(startDate, endDate);

    if (!dailyData || dailyData.length === 0) {
      console.log('No historical data available');
      return { success: false, error: 'No data' };
    }

    const result = await backfillHistoricalSends(dailyData);
    console.log(`Backfill complete: ${result.inserted} new, ${result.updated} updated`);

    return { success: true, ...result };
  } catch (err) {
    console.error('Backfill failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Start periodic sync job
let syncInterval = null;
let hasBackfilled = false;

export async function startSyncJob(intervalMinutes = 15) {
  // Do a full backfill on first startup (only once)
  if (!hasBackfilled) {
    hasBackfilled = true;
    runFullBackfill().catch(err => {
      console.error('Initial backfill failed:', err.message);
    });
  }

  // Initial sync of today
  syncTodaySends().catch(err => {
    console.error('Initial sync failed:', err.message);
  });

  // Schedule periodic sync
  syncInterval = setInterval(() => {
    syncTodaySends().catch(err => {
      console.error('Periodic sync failed:', err.message);
    });
  }, intervalMinutes * 60 * 1000);

  console.log(`Sync job started - will sync every ${intervalMinutes} minutes`);
}

export function stopSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Sync job stopped');
  }
}
