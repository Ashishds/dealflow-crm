import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

const STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

// GET all opportunities with optional search and stage filter
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const q = (req.query.q as string) || '';
  const stage = (req.query.stage as string) || '';

  let sql = `
    SELECT o.*, a.name as account_name, p.name as contact_name
    FROM opportunities o
    LEFT JOIN accounts a ON o.account_id = a.id
    LEFT JOIN people p ON o.contact_id = p.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (q) {
    sql += ` AND (o.name LIKE ? OR a.name LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (stage) {
    sql += ` AND o.stage = ?`;
    params.push(stage);
  }
  sql += ` ORDER BY o.created_at DESC`;

  res.json(db.prepare(sql).all(...params));
});

// GET single opportunity with interactions
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const opp = db.prepare(`
    SELECT o.*, a.name as account_name, p.name as contact_name
    FROM opportunities o
    LEFT JOIN accounts a ON o.account_id = a.id
    LEFT JOIN people p ON o.contact_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Not found' });

  const interactions = db.prepare(`
    SELECT i.*, p.name as person_name
    FROM interactions i
    LEFT JOIN people p ON i.person_id = p.id
    WHERE i.opportunity_id = ?
    ORDER BY i.occurred_at DESC
  `).all(req.params.id);

  res.json({ ...opp as object, interactions });
});

// POST create opportunity
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, account_id, contact_id, stage, value, close_date } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (stage && !STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });

  const result = db.prepare(
    `INSERT INTO opportunities (name, account_id, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, account_id || null, contact_id || null, stage || 'New', value || 0, close_date || null);
  const row = db.prepare(`
    SELECT o.*, a.name as account_name, p.name as contact_name
    FROM opportunities o
    LEFT JOIN accounts a ON o.account_id = a.id
    LEFT JOIN people p ON o.contact_id = p.id
    WHERE o.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(row);
});

// PUT update opportunity (full update)
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, account_id, contact_id, stage, value, close_date } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (stage && !STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });

  db.prepare(
    `UPDATE opportunities SET name=?, account_id=?, contact_id=?, stage=?, value=?, close_date=? WHERE id=?`
  ).run(name, account_id || null, contact_id || null, stage || 'New', value || 0, close_date || null, req.params.id);
  const row = db.prepare(`
    SELECT o.*, a.name as account_name, p.name as contact_name
    FROM opportunities o LEFT JOIN accounts a ON o.account_id = a.id LEFT JOIN people p ON o.contact_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// PATCH update stage only (used by the Board drag-and-drop)
router.patch('/:id/stage', (req: Request, res: Response) => {
  const db = getDb();
  const { stage } = req.body;
  if (!stage || !STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });
  const result = db.prepare(`UPDATE opportunities SET stage=? WHERE id=?`).run(stage, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  const row = db.prepare(`
    SELECT o.*, a.name as account_name, p.name as contact_name
    FROM opportunities o LEFT JOIN accounts a ON o.account_id = a.id LEFT JOIN people p ON o.contact_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);
  res.json(row);
});

// DELETE opportunity
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(`DELETE FROM opportunities WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// GET stats for dashboard
router.get('/stats/won-by-month', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', close_date) as month,
           COUNT(*) as count,
           SUM(value) as revenue
    FROM opportunities
    WHERE stage = 'Won' AND close_date IS NOT NULL
    GROUP BY month
    ORDER BY month
  `).all();
  res.json(rows);
});

export default router;
