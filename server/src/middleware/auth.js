// Simple password-based authentication middleware

import crypto from 'crypto';
import { query } from '../db/database.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Generate a random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify admin password and create session
export async function login(req, res) {
  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin authentication not configured' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Generate token with 24-hour expiry
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await query(
      'INSERT INTO admin_sessions (token, expires_at) VALUES ($1, $2)',
      [token, expiresAt]
    );

    res.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
}

// Logout - invalidate token
export async function logout(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    await query('DELETE FROM admin_sessions WHERE token = $1', [token]);
  }

  res.json({ success: true });
}

// Check if request is authenticated
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await query(
      'SELECT id FROM admin_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Valid session - proceed
    next();
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

// Verify token without middleware (for status checks)
export async function verifyToken(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const result = await query(
      'SELECT expires_at FROM admin_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      expiresAt: result.rows[0].expires_at
    });
  } catch (err) {
    res.json({ authenticated: false });
  }
}

// Clean up expired sessions (called periodically)
export async function cleanupSessions() {
  try {
    const result = await query('DELETE FROM admin_sessions WHERE expires_at < NOW()');
    if (result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (err) {
    console.error('Session cleanup error:', err);
  }
}
