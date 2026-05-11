import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToJournal } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tradeId = searchParams.get('tradeId')
  const mood    = searchParams.get('mood')

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId:  session.u,
      ...(tradeId && { tradeId: Number(tradeId) }),
      ...(mood    && { mood }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(entries.map(rowToJournal))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tradeId, content, mood } = body

  const entry = await prisma.journalEntry.create({
    data: {
      userId:  session.u,
      tradeId: tradeId ?? null,
      content,
      mood:    mood ?? null,
    },
  })

  return NextResponse.json(rowToJournal(entry), { status: 201 })
}
