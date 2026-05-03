import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, dbAll, rowToJournal, type JournalRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.u

  const { searchParams } = new URL(request.url)
  const tradeId = searchParams.get('tradeId')
  const mood = searchParams.get('mood')

  const db = getDb()
  const conditions: string[] = ['user_id = ?']
  const params: (string | number)[] = [userId]

  if (tradeId) { conditions.push('trade_id = ?'); params.push(Number(tradeId)) }
  if (mood) { conditions.push('mood = ?'); params.push(mood) }

  const where = 'WHERE ' + conditions.join(' AND ')
  const rows = dbAll<JournalRow>(db, `SELECT * FROM journal_entries ${where} ORDER BY created_at DESC`, ...params)
  return NextResponse.json(rows.map(rowToJournal))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.u

  const body = await request.json()
  const { tradeId, content, mood } = body

  const db = getDb()
  const result = db.prepare('INSERT INTO journal_entries (user_id, trade_id, content, mood) VALUES (?, ?, ?, ?)').run(userId, tradeId ?? null, content, mood ?? null)

  const row = dbGet<JournalRow>(db, 'SELECT * FROM journal_entries WHERE id = ?', result.lastInsertRowid)!
  return NextResponse.json(rowToJournal(row), { status: 201 })
}
