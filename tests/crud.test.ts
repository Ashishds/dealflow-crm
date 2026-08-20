import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ── In-memory DB helper ───────────────────────────────────────
function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      website    TEXT,
      industry   TEXT,
      notes      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS people (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT,
      phone      TEXT,
      job_title  TEXT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      status     TEXT NOT NULL DEFAULT 'prospect' CHECK(status IN ('prospect','qualified','client')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS opportunities (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      stage      TEXT NOT NULL DEFAULT 'New' CHECK(stage IN ('New','Qualified','Proposal','Negotiation','Won','Lost')),
      value      REAL NOT NULL DEFAULT 0,
      close_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      type           TEXT NOT NULL CHECK(type IN ('note','call','email')),
      person_id      INTEGER REFERENCES people(id) ON DELETE CASCADE,
      opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
      description    TEXT NOT NULL,
      occurred_at    TEXT NOT NULL DEFAULT (datetime('now')),
      due_date       TEXT,
      done           INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// ── Account CRUD ──────────────────────────────────────────────
describe('Accounts CRUD', () => {
  let db: Database.Database;
  beforeAll(() => { db = createTestDb(); });
  afterAll(() => { db.close(); });

  it('creates an account', () => {
    const result = db.prepare(
      `INSERT INTO accounts (name, website, industry, notes) VALUES (?,?,?,?)`
    ).run('Acme Corp', 'https://acme.com', 'Tech', 'Big customer');
    expect(result.lastInsertRowid).toBeTruthy();
  });

  it('reads accounts', () => {
    const rows = db.prepare('SELECT * FROM accounts').all();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('reads a single account by id', () => {
    const id = (db.prepare('SELECT id FROM accounts LIMIT 1').get() as any).id;
    const row = db.prepare('SELECT * FROM accounts WHERE id=?').get(id) as any;
    expect(row).toBeTruthy();
    expect(row.name).toBe('Acme Corp');
  });

  it('updates an account', () => {
    const id = (db.prepare('SELECT id FROM accounts LIMIT 1').get() as any).id;
    db.prepare('UPDATE accounts SET name=? WHERE id=?').run('Acme Updated', id);
    const row = db.prepare('SELECT * FROM accounts WHERE id=?').get(id) as any;
    expect(row.name).toBe('Acme Updated');
  });

  it('deletes an account', () => {
    const result = db.prepare(
      `INSERT INTO accounts (name) VALUES (?)`
    ).run('Delete Me');
    const id = result.lastInsertRowid;
    db.prepare('DELETE FROM accounts WHERE id=?').run(id);
    const row = db.prepare('SELECT * FROM accounts WHERE id=?').get(id);
    expect(row).toBeUndefined();
  });

  it('searches accounts by name', () => {
    db.prepare(`INSERT INTO accounts (name, industry) VALUES (?,?)`).run('BlueStar', 'Retail');
    const rows = db.prepare(`SELECT * FROM accounts WHERE name LIKE ?`).all('%BlueStar%');
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ── People CRUD ───────────────────────────────────────────────
describe('People CRUD', () => {
  let db: Database.Database;
  let accountId: number;

  beforeAll(() => {
    db = createTestDb();
    const r = db.prepare(`INSERT INTO accounts (name) VALUES (?)`).run('Test Account');
    accountId = r.lastInsertRowid as number;
  });
  afterAll(() => db.close());

  it('creates a person', () => {
    const result = db.prepare(
      `INSERT INTO people (name, email, status, account_id) VALUES (?,?,?,?)`
    ).run('Jane Doe', 'jane@test.com', 'prospect', accountId);
    expect(result.lastInsertRowid).toBeTruthy();
  });

  it('reads people', () => {
    const rows = db.prepare('SELECT * FROM people').all();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('reads a person with account join', () => {
    const row = db.prepare(`
      SELECT p.*, a.name as account_name
      FROM people p
      LEFT JOIN accounts a ON p.account_id = a.id
      WHERE p.email = ?
    `).get('jane@test.com') as any;
    expect(row).toBeTruthy();
    expect(row.account_name).toBe('Test Account');
  });

  it('updates a person status', () => {
    const id = (db.prepare('SELECT id FROM people LIMIT 1').get() as any).id;
    db.prepare('UPDATE people SET status=? WHERE id=?').run('client', id);
    const row = db.prepare('SELECT * FROM people WHERE id=?').get(id) as any;
    expect(row.status).toBe('client');
  });

  it('deletes a person', () => {
    const r = db.prepare(`INSERT INTO people (name, status) VALUES (?,?)`).run('Delete Me', 'prospect');
    const id = r.lastInsertRowid;
    db.prepare('DELETE FROM people WHERE id=?').run(id);
    expect(db.prepare('SELECT * FROM people WHERE id=?').get(id)).toBeUndefined();
  });

  it('searches by name and email', () => {
    const q = 'jane@test';
    const rows = db.prepare(`SELECT * FROM people WHERE email LIKE ?`).all(`%${q}%`);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('filters by status', () => {
    db.prepare(`INSERT INTO people (name, status) VALUES (?,?)`).run('Qualified One', 'qualified');
    const rows = db.prepare(`SELECT * FROM people WHERE status=?`).all('qualified') as any[];
    expect(rows.every(r => r.status === 'qualified')).toBe(true);
  });
});

// ── Opportunities CRUD ────────────────────────────────────────
describe('Opportunities CRUD', () => {
  let db: Database.Database;
  let accId: number;
  let personId: number;

  beforeAll(() => {
    db = createTestDb();
    accId = (db.prepare(`INSERT INTO accounts (name) VALUES (?)`).run('OppAccount') as any).lastInsertRowid;
    personId = (db.prepare(`INSERT INTO people (name, status) VALUES (?,?)`).run('OppPerson', 'prospect') as any).lastInsertRowid;
  });
  afterAll(() => db.close());

  it('creates an opportunity', () => {
    const r = db.prepare(
      `INSERT INTO opportunities (name, account_id, contact_id, stage, value) VALUES (?,?,?,?,?)`
    ).run('Big Deal', accId, personId, 'New', 50000);
    expect(r.lastInsertRowid).toBeTruthy();
  });

  it('reads opportunities', () => {
    const rows = db.prepare('SELECT * FROM opportunities').all();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('updates stage — New → Qualified', () => {
    const id = (db.prepare('SELECT id FROM opportunities LIMIT 1').get() as any).id;
    db.prepare('UPDATE opportunities SET stage=? WHERE id=?').run('Qualified', id);
    const row = db.prepare('SELECT * FROM opportunities WHERE id=?').get(id) as any;
    expect(row.stage).toBe('Qualified');
  });

  it('updates stage → Won', () => {
    const id = (db.prepare('SELECT id FROM opportunities LIMIT 1').get() as any).id;
    db.prepare('UPDATE opportunities SET stage=? WHERE id=?').run('Won', id);
    const row = db.prepare('SELECT * FROM opportunities WHERE id=?').get(id) as any;
    expect(row.stage).toBe('Won');
  });

  it('updates stage → Lost', () => {
    const id = (db.prepare('SELECT id FROM opportunities LIMIT 1').get() as any).id;
    db.prepare('UPDATE opportunities SET stage=? WHERE id=?').run('Lost', id);
    const row = db.prepare('SELECT * FROM opportunities WHERE id=?').get(id) as any;
    expect(row.stage).toBe('Lost');
  });

  it('deletes an opportunity', () => {
    const r = db.prepare(`INSERT INTO opportunities (name, stage, value) VALUES (?,?,?)`).run('Del Deal', 'New', 0);
    const id = r.lastInsertRowid;
    db.prepare('DELETE FROM opportunities WHERE id=?').run(id);
    expect(db.prepare('SELECT * FROM opportunities WHERE id=?').get(id)).toBeUndefined();
  });

  it('searches by name', () => {
    const rows = db.prepare('SELECT * FROM opportunities WHERE name LIKE ?').all('%Big%') as any[];
    expect(rows.length).toBeGreaterThan(0);
  });

  it('filters by stage', () => {
    db.prepare(`INSERT INTO opportunities (name, stage, value) VALUES (?,?,?)`).run('Proposal Deal', 'Proposal', 1000);
    const rows = db.prepare('SELECT * FROM opportunities WHERE stage=?').all('Proposal') as any[];
    expect(rows.every(r => r.stage === 'Proposal')).toBe(true);
  });
});

// ── Interactions CRUD ─────────────────────────────────────────
describe('Interactions CRUD', () => {
  let db: Database.Database;
  let personId: number;
  let oppId: number;

  beforeAll(() => {
    db = createTestDb();
    personId = (db.prepare(`INSERT INTO people (name, status) VALUES (?,?)`).run('IntPerson', 'prospect') as any).lastInsertRowid;
    oppId = (db.prepare(`INSERT INTO opportunities (name, stage, value) VALUES (?,?,?)`).run('IntDeal', 'New', 1000) as any).lastInsertRowid;
  });
  afterAll(() => db.close());

  it('logs an interaction (note)', () => {
    const r = db.prepare(
      `INSERT INTO interactions (type, person_id, description, occurred_at) VALUES (?,?,?,?)`
    ).run('note', personId, 'First contact made', new Date().toISOString());
    expect(r.lastInsertRowid).toBeTruthy();
  });

  it('logs a call with due date', () => {
    const r = db.prepare(
      `INSERT INTO interactions (type, person_id, opportunity_id, description, occurred_at, due_date, done) VALUES (?,?,?,?,?,?,?)`
    ).run('call', personId, oppId, 'Discovery call', new Date().toISOString(), '2099-12-31', 0);
    expect(r.lastInsertRowid).toBeTruthy();
  });

  it('reads interactions', () => {
    const rows = db.prepare('SELECT * FROM interactions').all();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('reads interactions for a person', () => {
    const rows = db.prepare('SELECT * FROM interactions WHERE person_id=?').all(personId);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('toggles done to true', () => {
    const id = (db.prepare('SELECT id FROM interactions WHERE done=0 LIMIT 1').get() as any)?.id;
    if (!id) return;
    db.prepare('UPDATE interactions SET done=? WHERE id=?').run(1, id);
    const row = db.prepare('SELECT * FROM interactions WHERE id=?').get(id) as any;
    expect(row.done).toBe(1);
  });

  it('toggles done to false', () => {
    const id = (db.prepare('SELECT id FROM interactions WHERE done=1 LIMIT 1').get() as any)?.id;
    if (!id) return;
    db.prepare('UPDATE interactions SET done=? WHERE id=?').run(0, id);
    const row = db.prepare('SELECT * FROM interactions WHERE id=?').get(id) as any;
    expect(row.done).toBe(0);
  });

  it('deletes an interaction', () => {
    const r = db.prepare(
      `INSERT INTO interactions (type, person_id, description, occurred_at) VALUES (?,?,?,?)`
    ).run('email', personId, 'Delete me', new Date().toISOString());
    const id = r.lastInsertRowid;
    db.prepare('DELETE FROM interactions WHERE id=?').run(id);
    expect(db.prepare('SELECT * FROM interactions WHERE id=?').get(id)).toBeUndefined();
  });

  it('fetches tasks (interactions with due_date)', () => {
    const rows = db.prepare('SELECT * FROM interactions WHERE due_date IS NOT NULL').all();
    expect(rows.length).toBeGreaterThan(0);
  });
});
