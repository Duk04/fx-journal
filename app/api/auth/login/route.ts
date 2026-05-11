import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, createSession } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username ?? '')
  const password = String(body.password ?? '')

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !checkPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const sessionId = await createSession(user.id, user.username)

  const res = NextResponse.json({ ok: true, username: user.username })
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
