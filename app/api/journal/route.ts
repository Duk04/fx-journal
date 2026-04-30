import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, dbAll, rowToJournal, type JournalRow } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tradeId = searchParams.get('tradeId')
  const mood = searchParams.get('mood')

  const db = getDb()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (tradeId) { conditions.push('trade_id = ?'); params.push(Number(tradeId)) }
  if (mood) { conditions.push('mood = ?'); params.push(mood) }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const rows = dbAll<JournalRow>(db, `SELECT * FROM journal_entries ${where} ORDER BY created_at DESC`, ...params)

  return NextResponse.json(rows.map(rowToJournal))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { tradeId, content, mood } = body

  const db = getDb()
  const result = db.prepare('INSERT INTO journal_entries (trade_id, content, mood) VALUES (?, ?, ?)').run(tradeId ?? null, content, mood ?? null)

  const row = dbGet<JournalRow>(db, 'SELECT * FROM journal_entries WHERE id = ?', result.lastInsertRowid)!
  return NextResponse.json(rowToJournal(row), { status: 201 })
}
