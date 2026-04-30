'use client'
import { useStats } from '@/hooks/use-stats'
import { useTrades } from '@/hooks/use-trades'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import type { Trade } from '@/types'

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()
  const { data: trades = [] } = useTrades({ status: 'closed' })

  const equityData = [...trades]
    .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
    .reduce<{ date: string; equity: number }[]>((acc, t) => {
      const prev = acc[acc.length - 1]?.equity ?? 0
      acc.push({ date: (t.closedAt ?? t.openedAt).slice(0, 10), equity: prev + (t.pnl ?? 0) })
      return acc
    }, [])

  if (isLoading) return <LoadingScreen />

  const pnlPositive = (stats?.totalPnl ?? 0) >= 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Performance overview</p>
        </div>
      </div>

      {/* Main P&L hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(79,70,229,0.1))',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 16, padding: '2rem',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
      }}>
        <HeroStat label="Total P&L" value={formatCurrency(stats?.totalPnl ?? 0)} positive={pnlPositive} large />
        <HeroStat label="Win Rate" value={formatPercent(stats?.winRate ?? 0)} positive={(stats?.winRate ?? 0) >= 0.5} />
        <HeroStat label="Avg R:R" value={(stats?.avgRR ?? 0).toFixed(2)} positive={(stats?.avgRR ?? 0) >= 1} />
        <HeroStat label="Total Trades" value={String(stats?.totalTrades ?? 0)} />
      </div>

      {/* Secondary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard label="Max Drawdown" value={formatCurrency(stats?.maxDrawdown ?? 0)} color="#ef4444" />
        <StatCard label="Win Streak" value={`${stats?.streaks?.current ?? 0} current / ${stats?.streaks?.best ?? 0} best`} color="#f59e0b" />
        <StatCard label="Open Trades" value={String(trades.filter((t: Trade) => !t.closedAt).length)} color="#60a5fa" />
      </div>

      {/* Equity chart */}
      {equityData.length > 1 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Equity Curve</h2>
            <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.8rem', marginTop: 2 }}>Cumulative P&L over time</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={equityData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.4)', fontSize: 11 }} tickLine={false} />
              <YAxis stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.4)', fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                labelStyle={{ color: 'rgba(226,232,240,0.6)', fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), 'Equity']}
              />
              <Area type="monotone" dataKey="equity" stroke="#3b82f6" fill="url(#eq)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / Worst */}
      {(stats?.bestTrade || stats?.worstTrade) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {stats?.bestTrade && (
            <Link href={`/trades/${stats.bestTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer' }}>
                <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Best Trade</p>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{stats.bestTrade.pair} · {stats.bestTrade.direction}</p>
                <p style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.5rem' }}>{formatCurrency(stats.bestTrade.pnl ?? 0)}</p>
              </div>
            </Link>
          )}
          {stats?.worstTrade && (
            <Link href={`/trades/${stats.worstTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer' }}>
                <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Worst Trade</p>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{stats.worstTrade.pair} · {stats.worstTrade.direction}</p>
                <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.5rem' }}>{formatCurrency(stats.worstTrade.pnl ?? 0)}</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {equityData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📈</p>
          <p style={{ color: 'rgba(226,232,240,0.5)', marginBottom: 16 }}>No closed trades yet. Add your first trade to see analytics.</p>
          <Link href="/trades/new" style={{
            display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
          }}>
            Add First Trade
          </Link>
        </div>
      )}
    </div>
  )
}

function HeroStat({ label, value, positive, large }: { label: string; value: string; positive?: boolean; large?: boolean }) {
  const color = positive === true ? '#22c55e' : positive === false ? '#ef4444' : '#e2e8f0'
  return (
    <div>
      <p style={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: large ? '2rem' : '1.5rem', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card">
      <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
      <p style={{ color, fontWeight: 600, fontSize: '1.1rem' }}>{value}</p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}
