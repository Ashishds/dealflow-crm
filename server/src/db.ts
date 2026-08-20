import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../crm.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      website     TEXT,
      industry    TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS people (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT,
      phone       TEXT,
      job_title   TEXT,
      account_id  INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      status      TEXT NOT NULL DEFAULT 'prospect' CHECK(status IN ('prospect','qualified','client')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      account_id   INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      contact_id   INTEGER REFERENCES people(id) ON DELETE SET NULL,
      stage        TEXT NOT NULL DEFAULT 'New' CHECK(stage IN ('New','Qualified','Proposal','Negotiation','Won','Lost')),
      value        REAL NOT NULL DEFAULT 0,
      close_date   TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      type            TEXT NOT NULL CHECK(type IN ('note','call','email')),
      person_id       INTEGER REFERENCES people(id) ON DELETE CASCADE,
      opportunity_id  INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
      description     TEXT NOT NULL,
      occurred_at     TEXT NOT NULL DEFAULT (datetime('now')),
      due_date        TEXT,
      done            INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed only if tables are empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM accounts').get() as { c: number }).c;
  if (count === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const daysFromNow = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const monthsAgo = (n: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - n);
    return d.toISOString().slice(0, 10);
  };

  // Accounts
  const insertAccount = db.prepare(
    `INSERT INTO accounts (name, website, industry, notes) VALUES (?, ?, ?, ?)`
  );
  const accountIds: number[] = [];
  const accountData = [
    ['Apex Technologies', 'https://apextech.io', 'Software', 'Key strategic partner. Interested in enterprise plan.'],
    ['BlueStar Retail', 'https://bluestar.com', 'Retail', 'Large retail chain. Looking to modernize POS systems.'],
    ['ClearWave Media', 'https://clearwave.media', 'Media', 'Growing media company. Needs analytics solution.'],
    ['DeltaForge Manufacturing', 'https://deltaforge.com', 'Manufacturing', 'Traditional manufacturer pivoting to IoT.'],
    ['Evergreen Logistics', 'https://evgreenlogistics.com', 'Logistics', 'Fleet management and route optimization.'],
    ['FrontLine Healthcare', 'https://frontlinehc.com', 'Healthcare', 'Mid-size hospital network.'],
    ['GoldPath Finance', 'https://goldpathfin.com', 'Finance', 'Wealth management firm seeking CRM replacement.'],
    ['HorizonEdu', 'https://horizonedu.org', 'Education', 'EdTech startup, budget-sensitive.'],
    ['IronClad Security', 'https://ironcladsc.com', 'Security', 'B2B security consultancy.'],
    ['JetStream Travel', 'https://jetstreamtravel.com', 'Travel', 'Corporate travel agency.'],
  ];
  for (const [name, website, industry, notes] of accountData) {
    const result = insertAccount.run(name, website, industry, notes);
    accountIds.push(result.lastInsertRowid as number);
  }

  // People
  const insertPerson = db.prepare(
    `INSERT INTO people (name, email, phone, job_title, account_id, status) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const peopleIds: number[] = [];
  const peopleData = [
    ['Sarah Mitchell', 'sarah.mitchell@apextech.io', '+1-555-0101', 'VP of Engineering', accountIds[0], 'client'],
    ['James Cho', 'james.cho@apextech.io', '+1-555-0102', 'CTO', accountIds[0], 'client'],
    ['Priya Nair', 'priya.nair@bluestar.com', '+1-555-0103', 'Head of IT', accountIds[1], 'qualified'],
    ['Tom Russo', 'tom.russo@bluestar.com', '+1-555-0104', 'COO', accountIds[1], 'prospect'],
    ['Maria Santos', 'maria.santos@clearwave.media', '+1-555-0105', 'CEO', accountIds[2], 'qualified'],
    ['David Kim', 'david.kim@deltaforge.com', '+1-555-0106', 'Operations Director', accountIds[3], 'prospect'],
    ['Lisa Chen', 'lisa.chen@deltaforge.com', '+1-555-0107', 'Plant Manager', accountIds[3], 'prospect'],
    ['Robert James', 'robert.james@evgreenlogistics.com', '+1-555-0108', 'Fleet Director', accountIds[4], 'client'],
    ['Anna Petrova', 'anna.petrova@frontlinehc.com', '+1-555-0109', 'CIO', accountIds[5], 'qualified'],
    ['Carlos Rivera', 'carlos.rivera@goldpathfin.com', '+1-555-0110', 'Managing Partner', accountIds[6], 'client'],
    ['Emily Watson', 'emily.watson@goldpathfin.com', '+1-555-0111', 'IT Director', accountIds[6], 'qualified'],
    ['Michael Park', 'michael.park@horizonedu.org', '+1-555-0112', 'Product Lead', accountIds[7], 'prospect'],
    ['Sophie Turner', 'sophie.turner@ironcladsc.com', '+1-555-0113', 'CEO', accountIds[8], 'client'],
    ['Nathan Brooks', 'nathan.brooks@jetstreamtravel.com', '+1-555-0114', 'Travel Manager', accountIds[9], 'prospect'],
    ['Olivia Grant', 'olivia.grant@apextech.io', '+1-555-0115', 'Procurement Lead', accountIds[0], 'qualified'],
    ['William Tan', 'william.tan@bluestar.com', '+1-555-0116', 'Digital Lead', accountIds[1], 'prospect'],
    ['Helen Ford', 'helen.ford@clearwave.media', '+1-555-0117', 'Data Director', accountIds[2], 'prospect'],
    ['Jake Morris', 'jake.morris@evgreenlogistics.com', '+1-555-0118', 'Tech Lead', accountIds[4], 'qualified'],
    ['Nina Shah', 'nina.shah@frontlinehc.com', '+1-555-0119', 'Department Head', accountIds[5], 'prospect'],
    ['Oscar Webb', 'oscar.webb@ironcladsc.com', '+1-555-0120', 'Sales Director', accountIds[8], 'qualified'],
  ];
  for (const [name, email, phone, job_title, account_id, status] of peopleData) {
    const result = insertPerson.run(name, email, phone, job_title, account_id, status);
    peopleIds.push(result.lastInsertRowid as number);
  }

  // Opportunities
  const insertOpp = db.prepare(
    `INSERT INTO opportunities (name, account_id, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const oppIds: number[] = [];
  const oppData = [
    ['Enterprise Suite — Apex', accountIds[0], peopleIds[0], 'Won', 85000, monthsAgo(2)],
    ['Analytics Platform — Apex', accountIds[0], peopleIds[1], 'Won', 42000, monthsAgo(3)],
    ['POS Modernization — BlueStar', accountIds[1], peopleIds[2], 'Proposal', 120000, daysFromNow(21)],
    ['Digital Transformation — BlueStar', accountIds[1], peopleIds[3], 'Qualified', 65000, daysFromNow(45)],
    ['Media Analytics — ClearWave', accountIds[2], peopleIds[4], 'Negotiation', 38000, daysFromNow(14)],
    ['IoT Integration — DeltaForge', accountIds[3], peopleIds[5], 'New', 92000, daysFromNow(60)],
    ['Process Automation — DeltaForge', accountIds[3], peopleIds[6], 'Qualified', 47000, daysFromNow(30)],
    ['Fleet Mgmt Renewal — Evergreen', accountIds[4], peopleIds[7], 'Won', 55000, monthsAgo(1)],
    ['Route Optimizer — Evergreen', accountIds[4], peopleIds[17], 'Proposal', 28000, daysFromNow(18)],
    ['EHR Dashboard — FrontLine', accountIds[5], peopleIds[8], 'Qualified', 110000, daysFromNow(40)],
    ['CRM Replacement — GoldPath', accountIds[6], peopleIds[9], 'Won', 75000, monthsAgo(1)],
    ['Compliance Module — GoldPath', accountIds[6], peopleIds[10], 'Negotiation', 33000, daysFromNow(10)],
    ['Learning Platform — HorizonEdu', accountIds[7], peopleIds[11], 'New', 22000, daysFromNow(55)],
    ['Security Audit — IronClad', accountIds[8], peopleIds[12], 'Won', 48000, monthsAgo(4)],
    ['Retainer 2024 — IronClad', accountIds[8], peopleIds[19], 'Proposal', 36000, daysFromNow(25)],
    ['Travel Portal — JetStream', accountIds[9], peopleIds[13], 'New', 19000, daysFromNow(70)],
    ['Enterprise Plus — Apex', accountIds[0], peopleIds[14], 'Won', 95000, monthsAgo(5)],
    ['Platform Ext — Apex', accountIds[0], peopleIds[0], 'Lost', 30000, monthsAgo(2)],
    ['Staff Training — FrontLine', accountIds[5], peopleIds[18], 'Lost', 15000, monthsAgo(3)],
    ['Security Expansion — IronClad', accountIds[8], peopleIds[12], 'Won', 62000, monthsAgo(1)],
  ];
  for (const [name, account_id, contact_id, stage, value, close_date] of oppData) {
    const result = insertOpp.run(name, account_id, contact_id, stage, value, close_date);
    oppIds.push(result.lastInsertRowid as number);
  }

  // Interactions
  const insertInteraction = db.prepare(
    `INSERT INTO interactions (type, person_id, opportunity_id, description, occurred_at, due_date, done) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const interactionData = [
    ['call', peopleIds[0], oppIds[0], 'Discovery call — confirmed budget and timeline. Decision maker is Sarah.', daysAgo(45), null, 1],
    ['email', peopleIds[0], oppIds[0], 'Sent enterprise proposal deck. Awaited feedback within a week.', daysAgo(40), null, 1],
    ['note', peopleIds[1], oppIds[1], 'James confirmed analytics POC went well. Moving forward.', daysAgo(35), null, 1],
    ['call', peopleIds[2], oppIds[2], 'Priya walked us through current POS pain points. Needs multi-location support.', daysAgo(20), null, 1],
    ['email', peopleIds[2], oppIds[2], 'Sent POS proposal document. Follow up if no response by end of week.', daysAgo(15), daysFromNow(2), 0],
    ['call', peopleIds[4], oppIds[4], 'Negotiating on annual pricing. Maria wants 15% discount.', daysAgo(5), null, 1],
    ['note', peopleIds[4], oppIds[4], 'Internal note: authorize up to 10% discount. Schedule final call.', daysAgo(4), daysFromNow(3), 0],
    ['email', peopleIds[7], oppIds[7], 'Fleet mgmt contract signed. Onboarding scheduled for next Monday.', daysAgo(30), null, 1],
    ['call', peopleIds[8], oppIds[9], 'EHR demo went very well. Anna loved the dashboard. Needs exec approval.', daysAgo(12), null, 1],
    ['email', peopleIds[8], oppIds[9], 'Sent executive summary. Follow up with Anna next week.', daysAgo(8), daysFromNow(6), 0],
    ['note', peopleIds[9], oppIds[10], 'Carlos confirmed this project is top priority for Q3.', daysAgo(60), null, 1],
    ['call', peopleIds[10], oppIds[11], 'Emily reviewing compliance module details with legal team.', daysAgo(7), null, 1],
    ['email', peopleIds[10], oppIds[11], 'Legal review complete. Emily needs final pricing before decision.', daysAgo(3), daysFromNow(4), 0],
    ['call', peopleIds[12], oppIds[13], 'Security audit completed. All deliverables accepted by Sophie.', daysAgo(120), null, 1],
    ['note', peopleIds[12], oppIds[14], 'Sophie interested in expanding retainer scope. Prepare updated SOW.', daysAgo(10), daysFromNow(5), 0],
    ['call', peopleIds[5], oppIds[5], 'Initial call with David. IoT use case is factory floor monitoring.', daysAgo(18), null, 1],
    ['email', peopleIds[5], oppIds[5], 'Sent IoT integration whitepaper. Schedule technical deep-dive.', daysAgo(14), daysFromNow(7), 0],
    ['note', peopleIds[3], oppIds[3], 'Tom skeptical about ROI. Need to prepare case study from similar retail client.', daysAgo(9), daysFromNow(3), 0],
    ['call', peopleIds[17], oppIds[8], 'Route optimizer demo scheduled for next Tuesday.', daysAgo(6), daysFromNow(5), 0],
    ['email', peopleIds[11], oppIds[12], 'HorizonEdu responded — they need a pilot program first. Prepare pilot proposal.', daysAgo(3), daysFromNow(10), 0],
    ['note', peopleIds[0], null, 'Sarah mentioned they are evaluating competitors. Schedule executive business review.', daysAgo(2), daysFromNow(1), 0],
    ['call', peopleIds[19], oppIds[14], 'Oscar wants security retainer extended to cover new EU office.', daysAgo(4), null, 1],
    ['email', peopleIds[14], oppIds[16], 'Enterprise Plus contract executed. Onboarding team notified.', daysAgo(150), null, 1],
    ['note', peopleIds[9], null, 'Referred us to two contacts at partner firm. Follow up on introductions.', daysAgo(5), daysFromNow(2), 0],
    ['call', peopleIds[6], null, 'Lisa inquired about scalability for 3 additional factory locations.', daysAgo(11), null, 1],
    ['email', peopleIds[13], oppIds[15], 'JetStream reviewing travel portal proposal. Procurement involved now.', daysAgo(7), daysFromNow(14), 0],
    ['note', peopleIds[1], null, 'James hinted at upcoming platform expansion. Potential $150k opportunity.', daysAgo(1), daysFromNow(7), 0],
    ['call', peopleIds[18], null, 'Nina from FrontLine interested in patient dashboard add-on.', daysAgo(3), daysFromNow(8), 0],
    ['email', peopleIds[20 - 1], oppIds[19], 'IronClad security expansion signed and delivered.', daysAgo(35), null, 1],
    ['note', peopleIds[7], null, 'Robert mentioned budget review in Q4. Prepare renewal package early.', daysAgo(6), daysFromNow(30), 0],
  ];
  for (const [type, person_id, opportunity_id, description, occurred_at, due_date, done] of interactionData) {
    insertInteraction.run(type, person_id, opportunity_id, description, occurred_at, due_date, done);
  }
}
