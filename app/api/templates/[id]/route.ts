import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const tmpl = await prisma.tradeTemplate.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!tmpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.tradeTemplate.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
