import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { put, del } from '@vercel/blob'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const trade = await prisma.trade.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('screenshot') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  if (trade.screenshotUrl) {
    await del(trade.screenshotUrl).catch(() => {})
  }

  const ext = file.name.split('.').pop()
  const blob = await put(`screenshots/${id}-${Date.now()}.${ext}`, file, { access: 'public' })

  await prisma.trade.update({
    where: { id: Number(id) },
    data: { screenshotUrl: blob.url },
  })

  return NextResponse.json({ screenshotUrl: blob.url })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const trade = await prisma.trade.findFirst({ where: { id: Number(id), userId: session.u } })
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trade.screenshotUrl) {
    await del(trade.screenshotUrl).catch(() => {})
  }

  await prisma.trade.update({
    where: { id: Number(id) },
    data: { screenshotUrl: null },
  })

  return NextResponse.json({ success: true })
}
