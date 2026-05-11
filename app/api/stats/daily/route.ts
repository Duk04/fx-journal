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

  const map = new Map<string, { pnl: number; trades: number }>()
  for (const t of rows) {
    const date = t.closedAt!.toISOString().slice(0, 10)
    const e = map.get(date) ?? { pnl: 0, trades: 0 }
    e.pnl += t.pnl ?? 0
    e.trades++
    map.set(date, e)
  }

  return NextResponse.json(
    Array.from(map.entries()).map(([date, v]) => ({ date, pnl: v.pnl, trades: v.trades }))
  )
}
