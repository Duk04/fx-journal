import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, checkPassword, createSession, type UserRow } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username ?? '')
  const password = String(body.password ?? '')

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = getDb()
  const user = dbGet<UserRow>(db, 'SELECT * FROM users WHERE username = ?', username)

  if (!user || !checkPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const sessionId = createSession(db, user.id, user.username)

  const res = NextResponse.json({ ok: true, username: user.username })
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
