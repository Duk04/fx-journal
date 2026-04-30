import { NextResponse } from 'next/server'
import { getDb, dbAll, type TradeRow } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = dbAll<TradeRow>(db, 'SELECT * FROM trades WHERE pnl IS NOT NULL')

  const map = new Map<string, { wins: number; total: number; pnl: number }>()
  for (const t of rows) {
    const tags: string[] = JSON.parse(t.tags)
    for (const tag of tags) {
      const e = map.get(tag) ?? { wins: 0, total: 0, pnl: 0 }
      e.total++; e.pnl += t.pnl ?? 0
      if ((t.pnl ?? 0) > 0) e.wins++
      map.set(tag, e)
    }
  }

  return NextResponse.json(Array.from(map.entries()).map(([tag, v]) => ({
    tag, totalTrades: v.total,
    winRate: v.total > 0 ? v.wins / v.total : 0,
    totalPnl: v.pnl,
  })))
}
