import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, rowToTrade, type TradeRow } from '@/lib/db'
import { calcPnl, calcRR } from '@/lib/calc'
import fs from 'fs'
import path from 'path'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', Number(id))
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rowToTrade(trade))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const existing = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', Number(id))
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const newExitPrice = body.exitPrice !== undefined ? body.exitPrice : existing.exit_price
  const newSl = body.sl !== undefined ? body.sl : existing.sl
  const newLotSize = body.lotSize !== undefined ? body.lotSize : existing.lot_size

  let pnl = existing.pnl
  let rr = existing.rr

  if (newExitPrice != null) {
    pnl = calcPnl({ pair: existing.pair, direction: existing.direction, entryPrice: existing.entry_price, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl })
    rr = newSl ? calcRR({ pair: existing.pair, direction: existing.direction, entryPrice: existing.entry_price, exitPrice: newExitPrice, lotSize: newLotSize, sl: newSl }) : null
  }

  db.prepare(`UPDATE trades SET exit_price=?, closed_at=?, notes=?, tags=?, sl=?, tp=?, lot_size=?, pnl=?, rr=? WHERE id=?`).run(
    newExitPrice,
    body.closedAt !== undefined ? body.closedAt : existing.closed_at,
    body.notes !== undefined ? body.notes : existing.notes,
    body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags,
    newSl, body.tp !== undefined ? body.tp : existing.tp,
    newLotSize, pnl, rr, Number(id)
  )

  const updated = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', Number(id))!
  return NextResponse.json(rowToTrade(updated))
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ?', Number(id))
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trade.screenshot_url) {
    const filePath = path.join(process.cwd(), 'public', trade.screenshot_url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  db.prepare('DELETE FROM trades WHERE id = ?').run(Number(id))
  return NextResponse.json({ success: true })
}
