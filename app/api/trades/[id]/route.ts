import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, rowToTrade, type TradeRow } from '@/lib/db'
import { calcPnl, calcRR } from '@/lib/calc'
import { getSession } from '@/lib/auth-server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rowToTrade(trade))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const existing = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()

  const newPair      = body.pair      !== undefined ? body.pair      : existing.pair
  const newDirection = body.direction !== undefined ? body.direction : existing.direction
  const newEntryPrice = body.entryPrice !== undefined ? body.entryPrice : existing.entry_price
  const newExitPrice  = body.exitPrice  !== undefined ? body.exitPrice  : existing.exit_price
  const newSl        = body.sl        !== undefined ? body.sl        : existing.sl
  const newTp        = body.tp        !== undefined ? body.tp        : existing.tp
  const newLotSize   = body.lotSize   !== undefined ? body.lotSize   : existing.lot_size
  const newOpenedAt  = body.openedAt  !== undefined ? body.openedAt  : existing.opened_at
  const newNotes     = body.notes     !== undefined ? body.notes     : existing.notes
  const newPlan      = body.plan      !== undefined ? body.plan      : (existing as { plan?: string | null }).plan ?? null
  const newTags      = body.tags      !== undefined ? JSON.stringify(body.tags) : existing.tags

  let pnl = existing.pnl
  let rr  = existing.rr
  let newClosedAt = body.closedAt !== undefined ? body.closedAt : existing.closed_at

  if (newExitPrice != null) {
    pnl = calcPnl({ pair: newPair, direction: newDirection, entryPrice: newEntryPrice, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl })
    rr  = newSl ? calcRR({ pair: newPair, direction: newDirection, entryPrice: newEntryPrice, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl }) : null
    if (!newClosedAt) newClosedAt = new Date().toISOString()
  } else if (body.exitPrice === null) {
    pnl = null; rr = null; newClosedAt = null
  }

  db.prepare(`
    UPDATE trades SET
      pair=?, direction=?, entry_price=?, exit_price=?, lot_size=?,
      sl=?, tp=?, opened_at=?, closed_at=?, notes=?, plan=?, tags=?, pnl=?, rr=?
    WHERE id=?
  `).run(
    newPair, newDirection, newEntryPrice, newExitPrice, newLotSize,
    newSl, newTp, newOpenedAt, newClosedAt, newNotes, newPlan, newTags,
    pnl, rr, Number(id)
  )

  const updated = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', Number(id))!
  return NextResponse.json(rowToTrade(updated))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trade.screenshot_url) {
    const filePath = path.join(process.cwd(), 'public', trade.screenshot_url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  db.prepare('DELETE FROM trades WHERE id = ?').run(Number(id))
  return NextResponse.json({ success: true })
}
