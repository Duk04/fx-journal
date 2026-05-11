import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTemplate } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

export async function GET(_: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.tradeTemplate.findMany({
    where: { userId: session.u },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(templates.map(rowToTemplate))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, pair, direction, lotSize, sl, tp, tags, notes } = body
  if (!name || !pair || !direction) {
    return NextResponse.json({ error: 'name, pair, direction required' }, { status: 400 })
  }

  const template = await prisma.tradeTemplate.create({
    data: {
      userId:    session.u,
      name,
      pair,
      direction,
      lotSize:   lotSize ?? null,
      sl:        sl ?? null,
      tp:        tp ?? null,
      tags:      JSON.stringify(tags ?? []),
      notes:     notes ?? null,
    },
  })

  return NextResponse.json(rowToTemplate(template), { status: 201 })
}
