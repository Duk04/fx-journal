import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTrade } from '@/lib/db'
import { calcPnl, calcRR } from '@/lib/calc'
import { getSession } from '@/lib/auth-server'
import { del } from '@vercel/blob'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const trade = await prisma.trade.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rowToTrade(trade))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.trade.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()

  const newPair       = body.pair       !== undefined ? body.pair       : existing.pair
  const newDirection  = body.direction  !== undefined ? body.direction  : existing.direction
  const newEntryPrice = body.entryPrice !== undefined ? body.entryPrice : existing.entryPrice
  const newExitPrice  = body.exitPrice  !== undefined ? body.exitPrice  : existing.exitPrice
  const newSl         = body.sl         !== undefined ? body.sl         : existing.sl
  const newTp         = body.tp         !== undefined ? body.tp         : existing.tp
  const newLotSize    = body.lotSize    !== undefined ? body.lotSize    : existing.lotSize
  const newOpenedAt   = body.openedAt   !== undefined ? new Date(body.openedAt) : existing.openedAt
  const newNotes      = body.notes      !== undefined ? body.notes      : existing.notes
  const newPlan       = body.plan       !== undefined ? body.plan       : existing.plan
  const newTags       = body.tags       !== undefined ? JSON.stringify(body.tags) : existing.tags

  let pnl = existing.pnl
  let rr  = existing.rr
  let newClosedAt: Date | null = body.closedAt !== undefined
    ? (body.closedAt ? new Date(body.closedAt) : null)
    : existing.closedAt

  if (newExitPrice != null) {
    pnl = calcPnl({ pair: newPair, direction: newDirection, entryPrice: newEntryPrice, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl })
    rr  = newSl ? calcRR({ pair: newPair, direction: newDirection, entryPrice: newEntryPrice, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl }) : null
    if (!newClosedAt) newClosedAt = new Date()
  } else if (body.exitPrice === null) {
    pnl = null; rr = null; newClosedAt = null
  }

  const updated = await prisma.trade.update({
    where: { id: Number(id) },
    data: {
      pair:       newPair,
      direction:  newDirection,
      entryPrice: newEntryPrice,
      exitPrice:  newExitPrice,
      lotSize:    newLotSize,
      sl:         newSl,
      tp:         newTp,
      openedAt:   newOpenedAt,
      closedAt:   newClosedAt,
      notes:      newNotes,
      plan:       newPlan,
      tags:       newTags,
      pnl,
      rr,
    },
  })

  return NextResponse.json(rowToTrade(updated))
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const trade = await prisma.trade.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trade.screenshotUrl) {
    await del(trade.screenshotUrl).catch(() => {})
  }

  await prisma.trade.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
