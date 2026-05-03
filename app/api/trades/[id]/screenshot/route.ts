import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbGet, type TradeRow } from '@/lib/db'
import { getSession } from '@/lib/auth-server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('screenshot') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })

  if (trade.screenshot_url) {
    const oldPath = path.join(process.cwd(), 'public', trade.screenshot_url)
    if (existsSync(oldPath)) await unlink(oldPath)
  }

  const ext = file.name.split('.').pop()
  const filename = `${id}-${Date.now()}.${ext}`
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))

  const screenshotUrl = `/uploads/${filename}`
  db.prepare('UPDATE trades SET screenshot_url = ? WHERE id = ?').run(screenshotUrl, Number(id))

  return NextResponse.json({ screenshotUrl })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const trade = dbGet<TradeRow>(db, 'SELECT * FROM trades WHERE id = ? AND user_id = ?', Number(id), session.u)
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trade.screenshot_url) {
    const filePath = path.join(process.cwd(), 'public', trade.screenshot_url)
    if (existsSync(filePath)) await unlink(filePath)
  }

  db.prepare('UPDATE trades SET screenshot_url = NULL WHERE id = ?').run(Number(id))
  return NextResponse.json({ success: true })
}
