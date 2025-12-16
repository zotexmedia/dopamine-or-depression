// Authentication routes

import express from 'express';
import { login, logout, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login - Login with password
router.post('/login', login);

// POST /api/auth/logout - Invalidate session
router.post('/logout', logout);

// GET /api/auth/verify - Check if token is valid
router.get('/verify', verifyToken);

export default router;
