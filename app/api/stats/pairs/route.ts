import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.trade.findMany({
    where: { userId: session.u, NOT: { pnl: null } },
  })

  const map = new Map<string, { wins: number; total: number; pnl: number; rr: number[] }>()
  for (const t of rows) {
    const e = map.get(t.pair) ?? { wins: 0, total: 0, pnl: 0, rr: [] }
    e.total++
    e.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) e.wins++
    if (t.rr !== null) e.rr.push(t.rr)
    map.set(t.pair, e)
  }

  return NextResponse.json(Array.from(map.entries()).map(([pair, v]) => ({
    pair,
    totalTrades: v.total,
    winRate: v.total > 0 ? v.wins / v.total : 0,
    totalPnl: v.pnl,
    avgRR: v.rr.length > 0 ? v.rr.reduce((a, b) => a + b, 0) / v.rr.length : 0,
  })))
}
