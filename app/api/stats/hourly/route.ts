import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.trade.findMany({
    where: { userId: session.u, NOT: { pnl: null } },
    orderBy: { openedAt: 'asc' },
  })

  const map = new Map<number, { wins: number; total: number; pnl: number }>()
  for (let h = 0; h < 24; h++) map.set(h, { wins: 0, total: 0, pnl: 0 })

  for (const t of rows) {
    const hour = t.openedAt.getUTCHours()
    const e = map.get(hour)!
    e.total++
    e.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) e.wins++
  }

  return NextResponse.json(
    Array.from(map.entries())
      .filter(([, v]) => v.total > 0)
      .map(([hour, v]) => ({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        totalTrades: v.total,
        winRate: v.total > 0 ? v.wins / v.total : 0,
        totalPnl: v.pnl,
      }))
  )
}
