import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'

type Param = string | number | null | bigint

export function dbGet<T>(db: DatabaseSync, sql: string, ...params: Param[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined
}

export function dbAll<T>(db: DatabaseSync, sql: string, ...params: Param[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[]
}

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

// Ensure prisma directory exists
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
  `)
}

// ── Trades ────────────────────────────────────────────────────────────────────

export interface TradeRow {
  id: number
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
  tags: string
  screenshot_url: string | null
  created_at: string
}

import type { Trade } from '@/types'

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
    tags: JSON.parse(r.tags) as string[],
    screenshotUrl: r.screenshot_url,
    createdAt: r.created_at,
  }
}

// ── Journal ───────────────────────────────────────────────────────────────────

export interface JournalRow {
  id: number
  trade_id: number | null
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
