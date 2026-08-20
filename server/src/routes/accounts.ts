import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

// GET all accounts (with optional search)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const q = (req.query.q as string) || '';
  const rows = q
    ? db.prepare(`SELECT * FROM accounts WHERE name LIKE ? OR industry LIKE ? ORDER BY name`).all(`%${q}%`, `%${q}%`)
    : db.prepare(`SELECT * FROM accounts ORDER BY name`).all();
  res.json(rows);
});

// GET single account with linked people and opportunities
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Not found' });
  const people = db.prepare(`SELECT * FROM people WHERE account_id = ? ORDER BY name`).all(req.params.id);
  const opportunities = db.prepare(`SELECT * FROM opportunities WHERE account_id = ? ORDER BY created_at DESC`).all(req.params.id);
  res.json({ ...account as object, people, opportunities });
});

// POST create account
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, website, industry, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(`INSERT INTO accounts (name, website, industry, notes) VALUES (?, ?, ?, ?)`).run(name, website || null, industry || null, notes || null);
  const row = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(row);
});

// PUT update account
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, website, industry, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  db.prepare(`UPDATE accounts SET name=?, website=?, industry=?, notes=? WHERE id=?`).run(name, website || null, industry || null, notes || null, req.params.id);
  const row = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// DELETE account
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(`DELETE FROM accounts WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
