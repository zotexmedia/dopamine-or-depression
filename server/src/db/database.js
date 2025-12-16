import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  min: 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database client connected');
});

// Query with retry logic
export async function query(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const isTransient = err.code === 'ECONNREFUSED' ||
                          err.code === 'ETIMEDOUT' ||
                          err.code === '57P01' ||
                          err.message?.includes('Connection terminated');

      if (isTransient && attempt < maxRetries) {
        console.log(`Database query failed (attempt ${attempt}), retrying...`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// Initialize database schema
export async function initializeDatabase() {
  const schema = `
    -- Daily metrics table
    CREATE TABLE IF NOT EXISTS daily_metrics (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      emails_sent INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      etl_ratio DECIMAL(10,6),
      sends_per_lead DECIMAL(10,2),
      sends_last_synced_at TIMESTAMPTZ,
      leads_updated_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Admin sessions for simple auth
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Sync history for debugging
    CREATE TABLE IF NOT EXISTS sync_history (
      id SERIAL PRIMARY KEY,
      sync_type VARCHAR(50) NOT NULL,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'running',
      records_processed INTEGER DEFAULT 0,
      error_message TEXT
    );

    -- Index for date queries
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

    -- Clean up expired sessions periodically
    DELETE FROM admin_sessions WHERE expires_at < NOW();
  `;

  try {
    await pool.query(schema);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    throw err;
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}
