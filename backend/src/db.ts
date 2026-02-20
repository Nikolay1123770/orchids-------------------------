import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'smgvpn.db');
const db = new Database(DB_PATH);

// Enable WAL for better performance
db.pragma('journal_mode = WAL');

// ─── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    uuid       TEXT UNIQUE NOT NULL,
    xui_email  TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    plan       TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    active     INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    plan            TEXT NOT NULL,
    amount          REAL NOT NULL,
    label           TEXT UNIQUE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    yoomoney_opid   TEXT,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    confirmed_at    INTEGER
  );
`);

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function createUser(email: string, password: string, uuid: string, xuiEmail: string) {
  const stmt = db.prepare(
    'INSERT INTO users (email, password, uuid, xui_email) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(email, password, uuid, xuiEmail);
  return getUserById(result.lastInsertRowid as number)!;
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function getUserById(id: number) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getActiveSubscription(userId: number) {
  return db
    .prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? AND active = 1 AND expires_at > unixepoch() ORDER BY expires_at DESC LIMIT 1'
    )
    .get(userId) as Subscription | undefined;
}

export function createSubscription(userId: number, plan: string, expiresAt: number) {
  // Deactivate old
  db.prepare('UPDATE subscriptions SET active = 0 WHERE user_id = ?').run(userId);
  const stmt = db.prepare(
    'INSERT INTO subscriptions (user_id, plan, expires_at) VALUES (?, ?, ?)'
  );
  return stmt.run(userId, plan, expiresAt);
}

export function createPayment(userId: number, plan: string, amount: number, label: string) {
  const stmt = db.prepare(
    'INSERT INTO payments (user_id, plan, amount, label) VALUES (?, ?, ?, ?)'
  );
  stmt.run(userId, plan, amount, label);
}

export function getPaymentByLabel(label: string) {
  return db.prepare('SELECT * FROM payments WHERE label = ?').get(label) as Payment | undefined;
}

export function confirmPayment(label: string, opId: string) {
  db.prepare(
    'UPDATE payments SET status = ?, yoomoney_opid = ?, confirmed_at = unixepoch() WHERE label = ?'
  ).run('confirmed', opId, label);
}

export function getPendingPaymentsForUser(userId: number): Payment[] {
  return db
    .prepare(
      'SELECT * FROM payments WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 10'
    )
    .all(userId, 'pending') as Payment[];
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  password: string;
  uuid: string;
  xui_email: string;
  created_at: number;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan: string;
  expires_at: number;
  active: number;
  created_at: number;
}

export interface Payment {
  id: number;
  user_id: number;
  plan: string;
  amount: number;
  label: string;
  status: string;
  yoomoney_opid: string | null;
  created_at: number;
  confirmed_at: number | null;
}

export default db;
