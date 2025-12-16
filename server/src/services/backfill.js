// Backfill historical sends data from Instantly API
import { query } from '../db/database.js';

// This will be called from the metrics calculator
export async function backfillHistoricalSends(dailyData) {
  console.log(`Backfilling ${dailyData.length} days of historical data...`);

  let inserted = 0;
  let updated = 0;

  for (const day of dailyData) {
    const { date, sent } = day;

    if (!date || sent === undefined) continue;

    try {
      const result = await query(`
        INSERT INTO daily_metrics (date, emails_sent, sends_last_synced_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (date) DO UPDATE SET
          emails_sent = CASE
            WHEN daily_metrics.sends_last_synced_at IS NULL THEN $2
            ELSE daily_metrics.emails_sent
          END,
          sends_last_synced_at = COALESCE(daily_metrics.sends_last_synced_at, NOW()),
          updated_at = NOW(),
          etl_ratio = CASE
            WHEN daily_metrics.leads_generated > 0 AND $2 > 0
            THEN daily_metrics.leads_generated::decimal / $2
            ELSE daily_metrics.etl_ratio
          END,
          sends_per_lead = CASE
            WHEN daily_metrics.leads_generated > 0 AND $2 > 0
            THEN $2::decimal / daily_metrics.leads_generated
            ELSE daily_metrics.sends_per_lead
          END
        RETURNING (xmax = 0) AS inserted
      `, [date, sent]);

      if (result.rows[0]?.inserted) {
        inserted++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`Failed to backfill ${date}:`, err.message);
    }
  }

  console.log(`Backfill complete: ${inserted} inserted, ${updated} updated`);
  return { inserted, updated };
}
