// ETL Ratio Dashboard - Express Server

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool, initializeDatabase, testConnection } from './db/database.js';
import { seedIndustries } from './db/seed-industries.js';
import { startSyncJob, stopSyncJob } from './services/metrics-calculator.js';
import { cleanupSessions } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import metricsRoutes from './routes/metrics.js';
import leadsRoutes from './routes/leads.js';
import industriesRoutes from './routes/industries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Allow same-origin in production
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/industries', industriesRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');
  stopSyncJob();
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Initialize database schema
    await initializeDatabase();

    // Seed industries
    await seedIndustries();

    // Start the sync job (every 15 minutes)
    if (process.env.INSTANTLY_API_KEY) {
      startSyncJob(15);
    } else {
      console.warn('INSTANTLY_API_KEY not set - sync job disabled');
    }

    // Clean up expired sessions periodically (every hour)
    setInterval(cleanupSessions, 60 * 60 * 1000);

    // Start listening
    app.listen(PORT, () => {
      console.log(`ETL Dashboard server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
