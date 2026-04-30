import { NextResponse } from 'next/server'
import { getDb, dbAll, rowToTrade, type TradeRow } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const closed = dbAll<TradeRow>(db, 'SELECT * FROM trades WHERE pnl IS NOT NULL ORDER BY opened_at ASC').map(rowToTrade)

  const totalTrades = closed.length
  const wins = closed.filter(t => (t.pnl ?? 0) > 0)
  const winRate = totalTrades > 0 ? wins.length / totalTrades : 0
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const rrTrades = closed.filter(t => t.rr !== null)
  const avgRR = rrTrades.length > 0 ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length : 0

  let peak = 0, equity = 0, maxDrawdown = 0
  for (const t of closed) {
    equity += t.pnl ?? 0
    if (equity > peak) peak = equity
    const dd = peak - equity
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  const sorted = [...closed].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
  const best = sorted[0] ?? null
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

  return NextResponse.json({ totalTrades, winRate, totalPnl, avgRR, maxDrawdown, bestTrade: best, worstTrade: worst, streaks: { current: currentStreak, best: bestStreak } })
}
