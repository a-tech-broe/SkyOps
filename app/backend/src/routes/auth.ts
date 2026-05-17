import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import { requireAuth, signToken } from '../middleware/requireAuth';

const router = Router();
const BCRYPT_ROUNDS = 12;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { rows } = await pool.query<{ id: string; email: string }>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
      [email.toLowerCase().trim(), passwordHash],
    );

    const user = rows[0];
    res.status(201).json({ token: signToken({ userId: user.id, email: user.email }), user });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query<{ id: string; email: string; password_hash: string }>(
      `UPDATE users SET last_login = NOW() WHERE email = $1 RETURNING id, email, password_hash`,
      [email.toLowerCase().trim()],
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const { password_hash: _, ...safeUser } = user;
    res.json({ token: signToken({ userId: safeUser.id, email: safeUser.email }), user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE id = $1`,
      [req.auth!.userId],
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
