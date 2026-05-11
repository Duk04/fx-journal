import { cookies } from 'next/headers'
import { SESSION_COOKIE } from './session'
import { getSessionInfo, type SessionInfo } from './db'

export async function getSession(): Promise<SessionInfo | null> {
  const store = await cookies()
  const sessionId = store.get(SESSION_COOKIE)?.value
  if (!sessionId) return null
  return getSessionInfo(sessionId)
}
