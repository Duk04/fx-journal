import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rowToTrade } from '@/lib/db'
import { getSession } from '@/lib/auth-server'

function esc(v: string | number | null | undefined): string {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pair      = searchParams.get('pair')
  const direction = searchParams.get('direction')
  const status    = searchParams.get('status')
  const dateFrom  = searchParams.get('dateFrom')
  const dateTo    = searchParams.get('dateTo')

  const rows = await prisma.trade.findMany({
    where: {
      userId: session.u,
      ...(pair      && { pair }),
      ...(direction && { direction }),
      ...(dateFrom  && { openedAt: { gte: new Date(dateFrom) } }),
      ...(dateTo    && { openedAt: { lte: new Date(dateTo) } }),
      ...(status === 'open'   && { closedAt: null }),
      ...(status === 'closed' && { NOT: { closedAt: null } }),
    },
    orderBy: { openedAt: 'desc' },
  })
  const trades = rows.map(rowToTrade)

  const headers = ['ID', 'Pair', 'Direction', 'Entry', 'Exit', 'Lots', 'SL', 'TP', 'Opened', 'Closed', 'P&L', 'R:R', 'Tags', 'Notes', 'Plan']
  const lines = [
    headers.join(','),
    ...trades.map(t => [
      t.id, t.pair, t.direction,
      t.entryPrice, t.exitPrice ?? '', t.lotSize,
      t.sl ?? '', t.tp ?? '',
      t.openedAt.slice(0, 16).replace('T', ' '),
      t.closedAt ? t.closedAt.slice(0, 16).replace('T', ' ') : '',
      t.pnl ?? '', t.rr ?? '',
      esc(t.tags.join('; ')),
      esc(t.notes ?? ''),
      esc(t.plan ?? ''),
    ].map(esc).join(',')),
  ]

  const csv = lines.join('\r\n')
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="trades-${date}.csv"`,
    },
  })
}
