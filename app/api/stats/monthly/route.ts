import { NextResponse } from 'next/server'
import { getDb, dbAll, type TradeRow } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = dbAll<TradeRow>(db, 'SELECT * FROM trades WHERE pnl IS NOT NULL AND closed_at IS NOT NULL ORDER BY closed_at ASC')

  const map = new Map<string, { wins: number; total: number; pnl: number }>()
  for (const t of rows) {
    const month = t.closed_at!.slice(0, 7)
    const e = map.get(month) ?? { wins: 0, total: 0, pnl: 0 }
    e.total++; e.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) e.wins++
    map.set(month, e)
  }

  return NextResponse.json(Array.from(map.entries()).map(([month, v]) => ({
    month, totalTrades: v.total,
    winRate: v.total > 0 ? v.wins / v.total : 0,
    totalPnl: v.pnl,
  })))
}
