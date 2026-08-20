import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

// GET all people with optional search and status filter
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const q = (req.query.q as string) || '';
  const status = (req.query.status as string) || '';

  let sql = `
    SELECT p.*, a.name as account_name
    FROM people p
    LEFT JOIN accounts a ON p.account_id = a.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (q) {
    sql += ` AND (p.name LIKE ? OR p.email LIKE ? OR p.job_title LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY p.name`;

  res.json(db.prepare(sql).all(...params));
});

// GET single person with account info
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const person = db.prepare(`
    SELECT p.*, a.name as account_name
    FROM people p
    LEFT JOIN accounts a ON p.account_id = a.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Not found' });

  const interactions = db.prepare(`
    SELECT i.*, o.name as opportunity_name
    FROM interactions i
    LEFT JOIN opportunities o ON i.opportunity_id = o.id
    WHERE i.person_id = ?
    ORDER BY i.occurred_at DESC
  `).all(req.params.id);

  res.json({ ...person as object, interactions });
});

// POST create person
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, email, phone, job_title, account_id, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(
    `INSERT INTO people (name, email, phone, job_title, account_id, status) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, email || null, phone || null, job_title || null, account_id || null, status || 'prospect');
  const row = db.prepare(`SELECT p.*, a.name as account_name FROM people p LEFT JOIN accounts a ON p.account_id = a.id WHERE p.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(row);
});

// PUT update person
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, email, phone, job_title, account_id, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  db.prepare(
    `UPDATE people SET name=?, email=?, phone=?, job_title=?, account_id=?, status=? WHERE id=?`
  ).run(name, email || null, phone || null, job_title || null, account_id || null, status || 'prospect', req.params.id);
  const row = db.prepare(`SELECT p.*, a.name as account_name FROM people p LEFT JOIN accounts a ON p.account_id = a.id WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// DELETE person
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(`DELETE FROM people WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
