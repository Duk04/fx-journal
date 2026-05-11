import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTrade } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.trade.findMany({
    where: { userId: session.u, NOT: { pnl: null } },
    orderBy: { openedAt: 'asc' },
  })
  const closed = rows.map(rowToTrade)

  const totalTrades = closed.length
  const wins   = closed.filter(t => (t.pnl ?? 0) > 0)
  const losses = closed.filter(t => (t.pnl ?? 0) < 0)
  const winRate = totalTrades > 0 ? wins.length / totalTrades : 0

  const totalPnl  = closed.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const rrTrades  = closed.filter(t => t.rr !== null)
  const avgRR     = rrTrades.length > 0 ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length : 0

  const grossProfit  = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const grossLoss    = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  const avgWin       = wins.length > 0   ? grossProfit / wins.length   : 0
  const avgLoss      = losses.length > 0 ? grossLoss   / losses.length : 0
  const expectancy   = (winRate * avgWin) - ((1 - winRate) * avgLoss)

  let peak = 0, equity = 0, maxDrawdown = 0
  for (const t of closed) {
    equity += t.pnl ?? 0
    if (equity > peak) peak = equity
    const dd = peak - equity
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  const sorted = [...closed].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
  const best  = sorted[0]  ?? null
  const worst = sorted[sorted.length - 1] ?? null

  let bestStreak = 0, streak = 0, lastSign: number | null = null
  for (const t of closed) {
    const sign = (t.pnl ?? 0) >= 0 ? 1 : -1
    if (sign === lastSign) streak++
    else { streak = 1; lastSign = sign }
    if (streak > bestStreak) bestStreak = streak
  }

  let currentStreak = 0
  if (closed.length > 0) {
    const ls = (closed[closed.length - 1].pnl ?? 0) >= 0 ? 1 : -1
    for (let i = closed.length - 1; i >= 0; i--) {
      if (((closed[i].pnl ?? 0) >= 0 ? 1 : -1) === ls) currentStreak++
      else break
    }
  }

  return NextResponse.json({
    totalTrades, winRate, totalPnl, avgRR, maxDrawdown,
    profitFactor: isFinite(profitFactor) ? profitFactor : 99.99,
    expectancy, avgWin, avgLoss,
    bestTrade: best, worstTrade: worst,
    streaks: { current: currentStreak, best: bestStreak },
  })
}
