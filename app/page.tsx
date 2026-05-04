'use client'
import { useStats } from '@/hooks/use-stats'
import { useTrades } from '@/hooks/use-trades'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { TrendingUp, Target, Activity, AlertTriangle, Zap, BarChart2, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()
  const { data: trades = [] } = useTrades({ status: 'closed' })
  const { data: openTrades = [] } = useTrades({ status: 'open' })

  const equityData = [...trades]
    .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
    .reduce<{ date: string; equity: number }[]>((acc, t) => {
      const prev = acc[acc.length - 1]?.equity ?? 0
      acc.push({ date: (t.closedAt ?? t.openedAt).slice(0, 10), equity: prev + (t.pnl ?? 0) })
      return acc
    }, [])

  if (isLoading) return <LoadingScreen />

  const pnlPositive = (stats?.totalPnl ?? 0) >= 0
  const openCount = openTrades.length
  const strokeColor = pnlPositive ? '#00d485' : '#ff3553'

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', marginTop: 3 }}>Performance overview</p>
        </div>
        <Link href="/trades/new" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
          <Plus size={13} strokeWidth={2.5} /> New Trade
        </Link>
      </div>

      {/* Hero P&L banner */}
      <div className="hero-banner" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
      }}>
        <HeroStat icon={<TrendingUp size={14} />} label="Total P&L"   value={formatCurrency(stats?.totalPnl ?? 0)} positive={pnlPositive} large />
        <HeroStat icon={<Target size={14} />}     label="Win Rate"    value={formatPercent(stats?.winRate ?? 0)} positive={(stats?.winRate ?? 0) >= 0.5} />
        <HeroStat icon={<BarChart2 size={14} />}  label="Avg R:R"     value={(stats?.avgRR ?? 0).toFixed(2)} positive={(stats?.avgRR ?? 0) >= 1} />
        <HeroStat icon={<Activity size={14} />}   label="Total Trades" value={String(stats?.totalTrades ?? 0)} />
      </div>

      {/* Secondary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
        <SecondaryCard icon={<AlertTriangle size={15} />} label="Max Drawdown"
          value={formatCurrency(stats?.maxDrawdown ?? 0)} colorClass="neg" />
        <SecondaryCard icon={<Zap size={15} />} label="Win Streak"
          value={`${stats?.streaks?.best ?? 0} best`} sub={`${stats?.streaks?.current ?? 0} current`} colorClass="amber" />
        <SecondaryCard icon={<TrendingUp size={15} />} label="Open Trades"
          value={String(openCount)} colorClass="cyan" />
      </div>

      {/* Equity chart */}
      {equityData.length > 1 && (
        <div className="card" style={{ padding: '1.5rem 1.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <p className="section-label" style={{ margin: 0 }}>Equity Curve</p>
              <p style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: 2 }}>Cumulative P&L over time</p>
            </div>
            <span className={`mono ${pnlPositive ? 'pnl-pos' : 'pnl-neg'}`} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {pnlPositive ? '▲' : '▼'} {formatCurrency(Math.abs(stats?.totalPnl ?? 0))}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={equityData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="transparent"
                tick={{ fill: 'var(--text-faint)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} />
              <YAxis stroke="transparent"
                tick={{ fill: 'var(--text-faint)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
              <Tooltip
                contentStyle={{
                  background: '#0e1520', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 13,
                }}
                labelStyle={{ color: 'var(--text-faint)', fontSize: 11, marginBottom: 4 }}
                formatter={(v: number) => [formatCurrency(v), 'Equity']}
                cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area type="monotone" dataKey="equity"
                stroke={strokeColor} fill="url(#eq)" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / Worst */}
      {(stats?.bestTrade || stats?.worstTrade) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          {stats?.bestTrade && (
            <Link href={`/trades/${stats.bestTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer', borderLeft: '2px solid var(--pos)' }}>
                <p className="section-label">Best Trade</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', marginBottom: 6, color: 'var(--text)' }}>{stats.bestTrade.pair}</p>
                    <span className="badge badge-buy">{stats.bestTrade.direction}</span>
                  </div>
                  <p className="mono pnl-pos" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatCurrency(stats.bestTrade.pnl ?? 0)}</p>
                </div>
              </div>
            </Link>
          )}
          {stats?.worstTrade && (
            <Link href={`/trades/${stats.worstTrade.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ cursor: 'pointer', borderLeft: '2px solid var(--neg)' }}>
                <p className="section-label">Worst Trade</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', marginBottom: 6, color: 'var(--text)' }}>{stats.worstTrade.pair}</p>
                    <span className="badge badge-sell">{stats.worstTrade.direction}</span>
                  </div>
                  <p className="mono pnl-neg" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatCurrency(stats.worstTrade.pnl ?? 0)}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {equityData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem',
            background: 'rgba(0,196,238,0.1)', border: '1px solid rgba(0,196,238,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={22} color="var(--cyan)" />
          </div>
          <p style={{ fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: '1rem', marginBottom: 6, color: 'var(--text)' }}>No closed trades yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>Add your first trade to start tracking your performance.</p>
          <Link href="/trades/new" className="btn btn-primary">
            <Plus size={13} strokeWidth={2.5} /> Add First Trade
          </Link>
        </div>
      )}
    </div>
  )
}

function HeroStat({ icon, label, value, positive, large }: {
  icon: React.ReactNode; label: string; value: string; positive?: boolean; large?: boolean
}) {
  const colorClass = positive === true ? 'pnl-pos' : positive === false ? 'pnl-neg' : ''
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, color: 'var(--text-faint)' }}>
        {icon}
        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</span>
      </div>
      <p className={`mono ${colorClass}`} style={{
        fontWeight: 700, margin: 0,
        fontSize: large ? '1.85rem' : '1.35rem',
        letterSpacing: '-0.02em',
      }}>{value}</p>
    </div>
  )
}

function SecondaryCard({ icon, label, value, sub, colorClass }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
  colorClass: 'neg' | 'amber' | 'cyan'
}) {
  const colors = {
    neg:   { color: 'var(--neg)',   bg: 'rgba(255,53,83,0.1)',   border: 'rgba(255,53,83,0.2)' },
    amber: { color: 'var(--amber)', bg: 'rgba(245,166,35,0.1)',  border: 'rgba(245,166,35,0.2)' },
    cyan:  { color: 'var(--cyan)',  bg: 'rgba(0,196,238,0.1)',   border: 'rgba(0,196,238,0.2)' },
  }
  const c = colors[colorClass]
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: c.bg, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
      }}>{icon}</div>
      <div>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 2 }}>{label}</p>
        <p className="mono" style={{ color: c.color, fontWeight: 600, fontSize: '1rem', margin: 0 }}>{value}</p>
        {sub && <p style={{ color: 'var(--text-faint)', fontSize: '0.72rem', margin: '1px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="skeleton" style={{ height: 130, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 70 }} />)}
      </div>
      <div className="skeleton" style={{ height: 280 }} />
    </div>
  )
}
