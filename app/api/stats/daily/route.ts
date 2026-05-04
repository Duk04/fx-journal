import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbAll, type TradeRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const rows = dbAll<TradeRow>(db,
    'SELECT * FROM trades WHERE user_id = ? AND pnl IS NOT NULL AND closed_at IS NOT NULL ORDER BY closed_at ASC',
    session.u
  )

  const map = new Map<string, { pnl: number; trades: number }>()
  for (const t of rows) {
    const date = t.closed_at!.slice(0, 10)
    const e = map.get(date) ?? { pnl: 0, trades: 0 }
    e.pnl += t.pnl ?? 0
    e.trades++
    map.set(date, e)
  }

  return NextResponse.json(
    Array.from(map.entries()).map(([date, v]) => ({ date, pnl: v.pnl, trades: v.trades }))
  )
}
