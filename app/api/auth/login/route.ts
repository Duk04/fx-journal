import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, checkPassword, type UserRow } from '@/lib/db'
import { createToken, SESSION_COOKIE } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = getDb()
  const user = dbGet<UserRow>(db, 'SELECT * FROM users WHERE username = ?', String(username))

  if (!user || !checkPassword(String(password), user.password_hash)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const token = await createToken({ u: user.id, n: user.username, e: Date.now() + 30 * 24 * 60 * 60 * 1000 })

  const res = NextResponse.json({ ok: true, username: user.username })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
