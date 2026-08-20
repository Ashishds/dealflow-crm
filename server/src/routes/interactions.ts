import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

const TYPES = ['note', 'call', 'email'];

// GET interactions (optionally filtered by person_id or opportunity_id)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { person_id, opportunity_id } = req.query;

  let sql = `
    SELECT i.*, p.name as person_name, o.name as opportunity_name
    FROM interactions i
    LEFT JOIN people p ON i.person_id = p.id
    LEFT JOIN opportunities o ON i.opportunity_id = o.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (person_id) { sql += ` AND i.person_id = ?`; params.push(person_id as string); }
  if (opportunity_id) { sql += ` AND i.opportunity_id = ?`; params.push(opportunity_id as string); }
  sql += ` ORDER BY i.occurred_at DESC`;

  res.json(db.prepare(sql).all(...params));
});

// GET recent interactions (for dashboard feed)
router.get('/recent', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT i.*, p.name as person_name, o.name as opportunity_name
    FROM interactions i
    LEFT JOIN people p ON i.person_id = p.id
    LEFT JOIN opportunities o ON i.opportunity_id = o.id
    ORDER BY i.occurred_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

// GET tasks (interactions with due_date, optionally filtered by done)
router.get('/tasks', (req: Request, res: Response) => {
  const db = getDb();
  const done = req.query.done;
  let sql = `
    SELECT i.*, p.name as person_name, o.name as opportunity_name
    FROM interactions i
    LEFT JOIN people p ON i.person_id = p.id
    LEFT JOIN opportunities o ON i.opportunity_id = o.id
    WHERE i.due_date IS NOT NULL
  `;
  const params: (string | number)[] = [];
  if (done !== undefined) {
    sql += ` AND i.done = ?`;
    params.push(done === 'true' ? 1 : 0);
  }
  sql += ` ORDER BY i.due_date ASC`;
  res.json(db.prepare(sql).all(...params));
});

// GET single interaction
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM interactions WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST create interaction
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { type, person_id, opportunity_id, description, occurred_at, due_date, done } = req.body;
  if (!type || !TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (!description) return res.status(400).json({ error: 'description is required' });

  const result = db.prepare(
    `INSERT INTO interactions (type, person_id, opportunity_id, description, occurred_at, due_date, done) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    type,
    person_id || null,
    opportunity_id || null,
    description,
    occurred_at || new Date().toISOString(),
    due_date || null,
    done ? 1 : 0
  );
  const row = db.prepare(`
    SELECT i.*, p.name as person_name, o.name as opportunity_name
    FROM interactions i
    LEFT JOIN people p ON i.person_id = p.id
    LEFT JOIN opportunities o ON i.opportunity_id = o.id
    WHERE i.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(row);
});

// PATCH toggle done
router.patch('/:id/done', (req: Request, res: Response) => {
  const db = getDb();
  const { done } = req.body;
  const result = db.prepare(`UPDATE interactions SET done=? WHERE id=?`).run(done ? 1 : 0, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  const row = db.prepare(`SELECT * FROM interactions WHERE id = ?`).get(req.params.id);
  res.json(row);
});

// PUT update interaction
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { type, person_id, opportunity_id, description, occurred_at, due_date, done } = req.body;
  if (!type || !TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (!description) return res.status(400).json({ error: 'description is required' });

  db.prepare(
    `UPDATE interactions SET type=?, person_id=?, opportunity_id=?, description=?, occurred_at=?, due_date=?, done=? WHERE id=?`
  ).run(type, person_id || null, opportunity_id || null, description, occurred_at, due_date || null, done ? 1 : 0, req.params.id);
  const row = db.prepare(`SELECT * FROM interactions WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// DELETE interaction
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(`DELETE FROM interactions WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
