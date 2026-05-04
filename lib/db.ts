import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

type Param = string | number | null | bigint

export function dbGet<T>(db: DatabaseSync, sql: string, ...params: Param[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined
}

export function dbAll<T>(db: DatabaseSync, sql: string, ...params: Param[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[]
}

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    initSchema(_db)
  }
  return _db
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex')
}

export function checkPassword(pw: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const derived = scryptSync(pw, salt, 64)
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionInfo {
  u: number
  n: string
}

export function createSession(db: DatabaseSync, userId: number, username: string): string {
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO sessions (id, user_id, username, expires_at) VALUES (?, ?, ?, ?)').run(id, userId, username, expiresAt)
  return id
}

export function getSessionInfo(db: DatabaseSync, sessionId: string): SessionInfo | null {
  const row = dbGet<{ user_id: number; username: string; expires_at: string }>(db, 'SELECT user_id, username, expires_at FROM sessions WHERE id = ?', sessionId)
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return null
  }
  return { u: row.user_id, n: row.username }
}

export function deleteSession(db: DatabaseSync, sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

// ── Schema ────────────────────────────────────────────────────────────────────

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      lot_size REAL NOT NULL,
      sl REAL,
      tp REAL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      pnl REAL,
      rr REAL,
      notes TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      screenshot_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id INTEGER REFERENCES trades(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      mood TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      trade_id INTEGER PRIMARY KEY REFERENCES trades(id) ON DELETE CASCADE,
      result TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trade_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      pair TEXT NOT NULL,
      direction TEXT NOT NULL,
      lot_size REAL,
      sl REAL,
      tp REAL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  seedUsers(db)

  // Migrations — safe to run multiple times
  try { db.exec('ALTER TABLE trades ADD COLUMN user_id INTEGER REFERENCES users(id)') } catch {}
  try { db.exec('ALTER TABLE journal_entries ADD COLUMN user_id INTEGER REFERENCES users(id)') } catch {}
  try { db.exec('ALTER TABLE trades ADD COLUMN plan TEXT') } catch {}

  const first = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as { id: number } | undefined
  if (first) {
    db.exec(`UPDATE trades SET user_id = ${first.id} WHERE user_id IS NULL`)
    db.exec(`UPDATE journal_entries SET user_id = ${first.id} WHERE user_id IS NULL`)
  }
}

function seedUsers(db: DatabaseSync) {
  const { c } = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (c > 0) return

  const users = [
    { name: process.env.USER1_NAME ?? 'trader1', pass: process.env.USER1_PASS ?? 'pass1' },
    { name: process.env.USER2_NAME ?? 'trader2', pass: process.env.USER2_PASS ?? 'pass2' },
  ]

  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
  for (const u of users) stmt.run(u.name, hashPassword(u.pass))
}

// ── Trades ────────────────────────────────────────────────────────────────────

export interface TradeRow {
  id: number
  user_id: number | null
  pair: string
  direction: string
  entry_price: number
  exit_price: number | null
  lot_size: number
  sl: number | null
  tp: number | null
  opened_at: string
  closed_at: string | null
  pnl: number | null
  rr: number | null
  notes: string | null
  plan: string | null
  tags: string
  screenshot_url: string | null
  created_at: string
}

import type { Trade, TradeTemplate } from '@/types'

export function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    pair: r.pair,
    direction: r.direction as Trade['direction'],
    entryPrice: r.entry_price,
    exitPrice: r.exit_price,
    lotSize: r.lot_size,
    sl: r.sl,
    tp: r.tp,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    pnl: r.pnl,
    rr: r.rr,
    notes: r.notes,
    plan: (r as { plan?: string | null }).plan ?? null,
    tags: JSON.parse(r.tags) as string[],
    screenshotUrl: r.screenshot_url,
    createdAt: r.created_at,
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export interface TemplateRow {
  id: number
  user_id: number
  name: string
  pair: string
  direction: string
  lot_size: number | null
  sl: number | null
  tp: number | null
  tags: string
  notes: string | null
  created_at: string
}

export function rowToTemplate(r: TemplateRow): TradeTemplate {
  return {
    id: r.id,
    name: r.name,
    pair: r.pair,
    direction: r.direction,
    lotSize: r.lot_size,
    sl: r.sl,
    tp: r.tp,
    tags: JSON.parse(r.tags) as string[],
    notes: r.notes,
    createdAt: r.created_at,
  }
}

// ── Journal ───────────────────────────────────────────────────────────────────

export interface JournalRow {
  id: number
  trade_id: number | null
  user_id: number | null
  content: string
  mood: string | null
  created_at: string
}

export function rowToJournal(r: JournalRow) {
  return {
    id: r.id,
    tradeId: r.trade_id,
    content: r.content,
    mood: r.mood,
    createdAt: r.created_at,
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserRow {
  id: number
  username: string
  password_hash: string
  created_at: string
}
