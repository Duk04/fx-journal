import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, type TemplateRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const db = getDb()
  const tmpl = dbGet<TemplateRow>(db, 'SELECT * FROM trade_templates WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!tmpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare('DELETE FROM trade_templates WHERE id = ?').run(Number(id))
  return NextResponse.json({ success: true })
}
