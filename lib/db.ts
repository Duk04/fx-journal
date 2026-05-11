import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'
import type { Trade, JournalEntry, TradeTemplate } from '@/types'

export interface SessionInfo {
  u: number
  n: string
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex')
}

export function checkPassword(pw: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const derived = scryptSync(pw, salt, 64)
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

export async function createSession(userId: number, username: string): Promise<string> {
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id, userId, username, expiresAt } })
  return id
}

export async function getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    return null
  }
  return { u: session.userId, n: session.username }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToTrade(r: any): Trade {
  return {
    id: r.id,
    pair: r.pair,
    direction: r.direction,
    entryPrice: r.entryPrice,
    exitPrice: r.exitPrice ?? null,
    lotSize: r.lotSize,
    sl: r.sl ?? null,
    tp: r.tp ?? null,
    openedAt: r.openedAt instanceof Date ? r.openedAt.toISOString() : r.openedAt,
    closedAt: r.closedAt instanceof Date ? r.closedAt.toISOString() : (r.closedAt ?? null),
    pnl: r.pnl ?? null,
    rr: r.rr ?? null,
    notes: r.notes ?? null,
    plan: r.plan ?? null,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) as string[] : r.tags,
    screenshotUrl: r.screenshotUrl ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToJournal(r: any): JournalEntry {
  return {
    id: r.id,
    tradeId: r.tradeId ?? null,
    content: r.content,
    mood: r.mood ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToTemplate(r: any): TradeTemplate {
  return {
    id: r.id,
    name: r.name,
    pair: r.pair,
    direction: r.direction,
    lotSize: r.lotSize ?? null,
    sl: r.sl ?? null,
    tp: r.tp ?? null,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) as string[] : r.tags,
    notes: r.notes ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }
}
