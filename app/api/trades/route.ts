import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTrade } from '@/lib/db'
import { calcPnl, calcRR } from '@/lib/calc'
import { getSession } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pair      = searchParams.get('pair')
  const direction = searchParams.get('direction')
  const dateFrom  = searchParams.get('dateFrom')
  const dateTo    = searchParams.get('dateTo')
  const status    = searchParams.get('status')

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.u,
      ...(pair      && { pair }),
      ...(direction && { direction }),
      ...(dateFrom  && { openedAt: { gte: new Date(dateFrom) } }),
      ...(dateTo    && { openedAt: { lte: new Date(dateTo) } }),
      ...(status === 'open'   && { closedAt: null }),
      ...(status === 'closed' && { NOT: { closedAt: null } }),
    },
    orderBy: { openedAt: 'desc' },
  })

  return NextResponse.json(trades.map(rowToTrade))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { pair, direction, entryPrice, exitPrice, lotSize, sl, tp, openedAt, closedAt, notes, plan, tags } = body

  let pnl: number | null = null
  let rr: number | null = null
  let resolvedClosedAt: Date | null = closedAt ? new Date(closedAt) : null

  if (exitPrice != null) {
    pnl = calcPnl({ pair, direction, entryPrice, exitPrice, lotSize, sl })
    rr  = sl ? calcRR({ pair, direction, entryPrice, exitPrice, lotSize, sl }) : null
    if (!resolvedClosedAt) resolvedClosedAt = new Date()
  }

  const trade = await prisma.trade.create({
    data: {
      userId:     session.u,
      pair,
      direction,
      entryPrice,
      exitPrice:  exitPrice ?? null,
      lotSize,
      sl:         sl ?? null,
      tp:         tp ?? null,
      openedAt:   new Date(openedAt),
      closedAt:   resolvedClosedAt,
      pnl,
      rr,
      notes:      notes ?? null,
      plan:       plan ?? null,
      tags:       JSON.stringify(tags ?? []),
    },
  })

  return NextResponse.json(rowToTrade(trade), { status: 201 })
}
