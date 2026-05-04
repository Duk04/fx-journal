import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbAll, rowToTemplate, type TemplateRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const rows = dbAll<TemplateRow>(db,
    'SELECT * FROM trade_templates WHERE user_id = ? ORDER BY created_at DESC',
    session.u
  )
  return NextResponse.json(rows.map(rowToTemplate))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, pair, direction, lotSize, sl, tp, tags, notes } = body
  if (!name || !pair || !direction) return NextResponse.json({ error: 'name, pair, direction required' }, { status: 400 })

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO trade_templates (user_id, name, pair, direction, lot_size, sl, tp, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(session.u, name, pair, direction, lotSize ?? null, sl ?? null, tp ?? null, JSON.stringify(tags ?? []), notes ?? null)

  const created = db.prepare('SELECT * FROM trade_templates WHERE id = ?').get(result.lastInsertRowid) as TemplateRow
  return NextResponse.json(rowToTemplate(created), { status: 201 })
}
