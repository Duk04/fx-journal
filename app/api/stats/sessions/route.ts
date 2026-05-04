import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbAll, type TradeRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

function getSession_name(openedAt: string): string {
  const hour = new Date(openedAt).getUTCHours()
  if (hour < 7)  return 'Asia'
  if (hour < 12) return 'London'
  if (hour < 21) return 'New York'
  return 'Asia' // 21-24 UTC → early Asia
}

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const rows = dbAll<TradeRow>(db,
    'SELECT * FROM trades WHERE user_id = ? AND pnl IS NOT NULL ORDER BY opened_at ASC',
    session.u
  )

  const ORDER = ['Asia', 'London', 'New York']
  const map = new Map<string, { wins: number; total: number; pnl: number; rr: number[] }>()
  for (const s of ORDER) map.set(s, { wins: 0, total: 0, pnl: 0, rr: [] })

  for (const t of rows) {
    const s = getSession_name(t.opened_at)
    const e = map.get(s) ?? { wins: 0, total: 0, pnl: 0, rr: [] }
    e.total++
    e.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) e.wins++
    if (t.rr !== null) e.rr.push(t.rr)
    map.set(s, e)
  }

  return NextResponse.json(
    Array.from(map.entries())
      .filter(([, v]) => v.total > 0)
      .map(([session, v]) => ({
        session,
        totalTrades: v.total,
        winRate: v.total > 0 ? v.wins / v.total : 0,
        totalPnl: v.pnl,
        avgRR: v.rr.length > 0 ? v.rr.reduce((a, b) => a + b, 0) / v.rr.length : 0,
      }))
  )
}
