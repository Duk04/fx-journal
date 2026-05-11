import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/session'
import { deleteSession } from '@/lib/db'

export async function POST() {
  const store = await cookies()
  const sessionId = store.get(SESSION_COOKIE)?.value
  if (sessionId) await deleteSession(sessionId)

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
