import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTrade } from '@/lib/db'
import { analyzeTradeWithClaude } from '@/lib/claude'
import { getSession } from '@/lib/auth-server'
import type { JournalEntry } from '@/types'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const tradeId = Number(id)

  const tradeRow = await prisma.trade.findFirst({ where: { id: tradeId, userId: session.u } })
  if (!tradeRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cached = await prisma.analysisCache.findUnique({ where: { tradeId } })
  if (cached && Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json(JSON.parse(cached.result))
  }

  const [journalRows, recentRows] = await Promise.all([
    prisma.journalEntry.findMany({ where: { tradeId } }),
    prisma.trade.findMany({
      where: { userId: session.u },
      orderBy: { openedAt: 'desc' },
      take: 20,
    }),
  ])

  const trade = rowToTrade(tradeRow)
  const journalEntries: JournalEntry[] = journalRows.map(j => ({
    id: j.id,
    tradeId: j.tradeId ?? null,
    content: j.content,
    mood: j.mood as JournalEntry['mood'],
    createdAt: j.createdAt.toISOString(),
  }))
  const recentTrades = recentRows.map(rowToTrade)

  let screenshotBase64: string | undefined
  let screenshotMimeType: string | undefined

  if (tradeRow.screenshotUrl) {
    try {
      const res = await fetch(tradeRow.screenshotUrl)
      const buf = Buffer.from(await res.arrayBuffer())
      screenshotBase64 = buf.toString('base64')
      screenshotMimeType = res.headers.get('content-type') ?? 'image/jpeg'
    } catch {}
  }

  const analysis = await analyzeTradeWithClaude(trade, journalEntries, recentTrades, screenshotBase64, screenshotMimeType)
  const now = new Date()

  await prisma.analysisCache.upsert({
    where:  { tradeId },
    create: { tradeId, result: JSON.stringify(analysis), cachedAt: now },
    update: { result: JSON.stringify(analysis), cachedAt: now },
  })

  return NextResponse.json(analysis)
}
