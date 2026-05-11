import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.trade.findMany({
    where: { userId: session.u, NOT: [{ pnl: null }, { closedAt: null }] },
    orderBy: { closedAt: 'asc' },
  })

  const map = new Map<string, { wins: number; total: number; pnl: number }>()
  for (const t of rows) {
    const month = t.closedAt!.toISOString().slice(0, 7)
    const e = map.get(month) ?? { wins: 0, total: 0, pnl: 0 }
    e.total++
    e.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) e.wins++
    map.set(month, e)
  }

  return NextResponse.json(Array.from(map.entries()).map(([month, v]) => ({
    month,
    totalTrades: v.total,
    winRate: v.total > 0 ? v.wins / v.total : 0,
    totalPnl: v.pnl,
  })))
}
