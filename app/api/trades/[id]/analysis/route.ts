import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, dbAll, rowToTrade, type TradeRow } from '@/lib/db'
import { analyzeTradeWithClaude } from '@/lib/claude'
import { getSession } from '@/lib/auth-server'
import type { JournalEntry } from '@/types'
import fs from 'fs'
import path from 'path'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CacheRow { trade_id: number; result: string; cached_at: string }
interface JournalRow { id: number; trade_id: number | null; content: string; mood: string | null; created_at: string }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const tradeId = Number(id)
  const db = getDb()

  const tradeRow = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', tradeId, session.u)
  if (!tradeRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cached = dbGet<CacheRow>(db, 'SELECT * FROM analysis_cache WHERE trade_id = ?', tradeId)
  if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(JSON.parse(cached.result))
  }

  const journalRows = dbAll<JournalRow>(db, 'SELECT * FROM journal_entries WHERE trade_id = ?', tradeId)
  const recentRows = dbAll<TradeRow>(db, 'SELECT * FROM trades WHERE user_id = ? ORDER BY opened_at DESC LIMIT 20', session.u)

  const trade = rowToTrade(tradeRow)
  const journalEntries: JournalEntry[] = journalRows.map(j => ({
    id: j.id, tradeId: j.trade_id, content: j.content,
    mood: j.mood as JournalEntry['mood'], createdAt: j.created_at,
  }))
  const recentTrades = recentRows.map(rowToTrade)

  let screenshotBase64: string | undefined
  let screenshotMimeType: string | undefined

  if (tradeRow.screenshot_url) {
    const filePath = path.join(process.cwd(), 'public', tradeRow.screenshot_url)
    if (fs.existsSync(filePath)) {
      screenshotBase64 = fs.readFileSync(filePath).toString('base64')
      const ext = filePath.split('.').pop()?.toLowerCase()
      screenshotMimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    }
  }

  const analysis = await analyzeTradeWithClaude(trade, journalEntries, recentTrades, screenshotBase64, screenshotMimeType)
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO analysis_cache (trade_id, result, cached_at) VALUES (?, ?, ?)
    ON CONFLICT(trade_id) DO UPDATE SET result = excluded.result, cached_at = excluded.cached_at
  `).run(tradeId, JSON.stringify(analysis), now)

  return NextResponse.json(analysis)
}
