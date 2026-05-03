import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, dbAll, rowToTrade, type TradeRow } from '@/lib/db'
import { calcPnl, calcRR } from '@/lib/calc'
import { getSession } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.u

  const { searchParams } = new URL(request.url)
  const pair = searchParams.get('pair')
  const direction = searchParams.get('direction')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const status = searchParams.get('status')

  const db = getDb()
  const conditions: string[] = ['user_id = ?']
  const params: (string | number)[] = [userId]

  if (pair) { conditions.push('pair = ?'); params.push(pair) }
  if (direction) { conditions.push('direction = ?'); params.push(direction) }
  if (dateFrom) { conditions.push('opened_at >= ?'); params.push(dateFrom) }
  if (dateTo) { conditions.push('opened_at <= ?'); params.push(dateTo) }
  if (status === 'open') conditions.push('closed_at IS NULL')
  if (status === 'closed') conditions.push('closed_at IS NOT NULL')

  const where = 'WHERE ' + conditions.join(' AND ')
  const rows = dbAll<TradeRow>(db, `SELECT * FROM trades ${where} ORDER BY opened_at DESC`, ...params)
  return NextResponse.json(rows.map(rowToTrade))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.u

  const body = await request.json()
  const { pair, direction, entryPrice, exitPrice, lotSize, sl, tp, openedAt, closedAt, notes, tags } = body

  let pnl: number | null = null
  let rr: number | null = null

  if (exitPrice != null) {
    pnl = calcPnl({ pair, direction, entryPrice, exitPrice, lotSize, sl })
    rr = sl ? calcRR({ pair, direction, entryPrice, exitPrice, lotSize, sl }) : null
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO trades (user_id, pair, direction, entry_price, exit_price, lot_size, sl, tp, opened_at, closed_at, pnl, rr, notes, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, pair, direction, entryPrice, exitPrice ?? null, lotSize, sl ?? null, tp ?? null, openedAt, closedAt ?? null, pnl, rr, notes ?? null, JSON.stringify(tags ?? []))

  const newTrade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', result.lastInsertRowid)!
  return NextResponse.json(rowToTrade(newTrade), { status: 201 })
}
