'use client'
import { useStats } from '@/hooks/use-stats'
import { useTrades } from '@/hooks/use-trades'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import type { Trade } from '@/types'
import { TrendingUp, Target, Activity, AlertTriangle, Zap, BarChart2, Plus } from 'lucide-react'

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
  const openCount = trades.filter((t: Trade) => !t.closedAt).length

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 3 }}>Performance overview</p>
        </div>
        <Link href="/trades/new" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
          <Plus size={14} />
          New Trade
        </Link>
      </div>

      {/* Hero P&L banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
        border: '1px solid #bfdbfe',
        borderRadius: 16,
        padding: '1.75rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <HeroStat icon={<TrendingUp size={15} />} label="Total P&L"    value={formatCurrency(stats?.totalPnl ?? 0)} positive={pnlPositive} large />
        <HeroStat icon={<Target size={15} />}     label="Win Rate"      value={formatPercent(stats?.winRate ?? 0)} positive={(stats?.winRate ?? 0) >= 0.5} />
        <HeroStat icon={<BarChart2 size={15} />}  label="Avg R:R"       value={(stats?.avgRR ?? 0).toFixed(2)} positive={(stats?.avgRR ?? 0) >= 1} />
        <HeroStat icon={<Activity size={15} />}   label="Total Trades"  value={String(stats?.totalTrades ?? 0)} />
      </div>

      {/* Secondary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard icon={<AlertTriangle size={16} />} label="Max Drawdown" value={formatCurrency(stats?.maxDrawdown ?? 0)} color="#dc2626" bg="#fef2f2" borderC="#fecaca" />
        <StatCard icon={<Zap size={16} />}           label="Win Streak"   value={`${stats?.streaks?.best ?? 0} best`} sub={`${stats?.streaks?.current ?? 0} current`} color="#d97706" bg="#fffbeb" borderC="#fde68a" />
        <StatCard icon={<TrendingUp size={16} />}    label="Open Trades"  value={String(openCount)} color="#2563eb" bg="#eff6ff" borderC="#bfdbfe" />
      </div>

      {/* Equity chart */}
      {equityData.length > 1 && (
        <div className="card" style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>Equity Curve</h2>
              <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem', marginTop: 2 }}>Cumulative P&L over time</p>
            </div>
            <span style={{ fontSize: '0.8rem', color: pnlPositive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {pnlPositive ? '▲' : '▼'} {formatCurrency(Math.abs(stats?.totalPnl ?? 0))}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={equityData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={pnlPositive ? '#2563eb' : '#dc2626'} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={pnlPositive ? '#2563eb' : '#dc2626'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={55} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                labelStyle={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}
                formatter={(v: number) => [formatCurrency(v), 'Equity']}
                cursor={{ stroke: '#93c5fd', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="equity"
                stroke={pnlPositive ? '#2563eb' : '#dc2626'}
                fill="url(#eq)" strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: pnlPositive ? '#3b82f6' : '#ef4444', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / Worst */}
      {(stats?.bestTrade || stats?.worstTrade) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {stats?.bestTrade && (
            <Link href={`/trades/${stats.bestTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer', borderLeft: '3px solid #16a34a' }}>
                <p style={{ color: 'var(--text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>Best Trade</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: '#0f172a' }}>{stats.bestTrade.pair}</p>
                    <span className="badge badge-buy">{stats.bestTrade.direction}</span>
                  </div>
                  <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '1.4rem' }}>{formatCurrency(stats.bestTrade.pnl ?? 0)}</p>
                </div>
              </div>
            </Link>
          )}
          {stats?.worstTrade && (
            <Link href={`/trades/${stats.worstTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer', borderLeft: '3px solid #dc2626' }}>
                <p style={{ color: 'var(--text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>Worst Trade</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: '#0f172a' }}>{stats.worstTrade.pair}</p>
                    <span className="badge badge-sell">{stats.worstTrade.direction}</span>
                  </div>
                  <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '1.4rem' }}>{formatCurrency(stats.worstTrade.pnl ?? 0)}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {equityData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <TrendingUp size={24} color="#2563eb" />
          </div>
          <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6, color: '#0f172a' }}>No closed trades yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>Add your first trade to start tracking your performance.</p>
          <Link href="/trades/new" className="btn btn-primary">
            <Plus size={14} />
            Add First Trade
          </Link>
        </div>
      )}
    </div>
  )
}

function HeroStat({ icon, label, value, positive, large }: {
  icon: React.ReactNode; label: string; value: string; positive?: boolean; large?: boolean
}) {
  const color = positive === true ? '#16a34a' : positive === false ? '#dc2626' : '#0f172a'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b' }}>
        {icon}
        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: 0 }}>{label}</p>
      </div>
      <p style={{ color, fontWeight: 700, fontSize: large ? '1.9rem' : '1.4rem', margin: 0 }}>{value}</p>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, bg, borderC }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string; borderC: string
}) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: bg, border: `1px solid ${borderC}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ color, fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>{value}</p>
        {sub && <p style={{ color: 'var(--text-faint)', fontSize: '0.75rem', margin: '1px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="skeleton" style={{ height: 130, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 70 }} />)}
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
    </div>
  )
}
