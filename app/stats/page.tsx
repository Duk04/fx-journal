'use client'
import { usePairStats, useMonthlyStats, useTagStats } from '@/hooks/use-stats'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Globe, Calendar, Tag } from 'lucide-react'

export default function StatsPage() {
  const { data: pairs = [], isLoading: pL } = usePairStats()
  const { data: monthly = [], isLoading: mL } = useMonthlyStats()
  const { data: tags = [] } = useTagStats()

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Statistics</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', marginTop: 3 }}>Detailed performance breakdown</p>
      </div>

      <Section icon={<Globe size={14} />} title="By Currency Pair" loading={pL} empty={pairs.length === 0}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={pairs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
            <XAxis dataKey="pair" stroke="transparent"
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} />
            <YAxis stroke="transparent"
              tick={{ fill: 'var(--text-faint)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
            <Tooltip
              contentStyle={{ background: '#0e1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 13 }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']}
              labelStyle={{ color: 'var(--text-faint)', fontSize: 11, marginBottom: 4 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="totalPnl" radius={[5, 5, 0, 0]}>
              {pairs.map((p, i) => <Cell key={i} fill={p.totalPnl >= 0 ? '#00d485' : '#ff3553'} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <StatsTable
          columns={['Pair', 'Trades', 'Win Rate', 'P&L', 'Avg R:R']}
          rows={pairs.map(p => [p.pair, p.totalTrades, formatPercent(p.winRate), formatCurrency(p.totalPnl), p.avgRR.toFixed(2)])}
          pnlCol={3}
        />
      </Section>

      <Section icon={<Calendar size={14} />} title="Monthly Performance" loading={mL} empty={monthly.length === 0}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
            <XAxis dataKey="month" stroke="transparent"
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} />
            <YAxis stroke="transparent"
              tick={{ fill: 'var(--text-faint)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
            <Tooltip
              contentStyle={{ background: '#0e1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 13 }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']}
              labelStyle={{ color: 'var(--text-faint)', fontSize: 11, marginBottom: 4 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="totalPnl" radius={[5, 5, 0, 0]}>
              {monthly.map((m, i) => <Cell key={i} fill={m.totalPnl >= 0 ? '#00d485' : '#ff3553'} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <StatsTable
          columns={['Month', 'Trades', 'Win Rate', 'P&L']}
          rows={monthly.map(m => [m.month, m.totalTrades, formatPercent(m.winRate), formatCurrency(m.totalPnl)])}
          pnlCol={3}
        />
      </Section>

      <Section icon={<Tag size={14} />} title="By Tag" empty={tags.length === 0}>
        <StatsTable
          columns={['Tag', 'Trades', 'Win Rate', 'P&L']}
          rows={tags.map(t => [t.tag, t.totalTrades, formatPercent(t.winRate), formatCurrency(t.totalPnl)])}
          pnlCol={3}
        />
      </Section>
    </div>
  )
}

function Section({ icon, title, children, loading, empty }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; loading?: boolean; empty?: boolean
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: 'var(--text-faint)' }}>{icon}</span>
        <p className="section-label" style={{ margin: 0 }}>{title}</p>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : empty ? (
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>No data yet.</p>
      ) : children}
    </div>
  )
}

function StatsTable({ columns, rows, pnlCol }: { columns: string[]; rows: (string | number)[][]; pnlCol?: number }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(c => (
              <th key={c} style={{
                textAlign: 'left', padding: '0.55rem 0.75rem',
                color: 'var(--text-faint)', fontWeight: 600,
                fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {row.map((cell, j) => {
                const isPnl = j === pnlCol
                const val = String(cell)
                const positive = isPnl ? !val.startsWith('-') : undefined
                return (
                  <td key={j} style={{
                    padding: '0.6rem 0.75rem',
                    fontWeight: isPnl ? 700 : j === 0 ? 600 : 400,
                    color: isPnl
                      ? (positive ? 'var(--pos)' : 'var(--neg)')
                      : j === 0 ? 'var(--text)' : 'var(--text-muted)',
                    fontFamily: j > 0 ? "'JetBrains Mono', monospace" : undefined,
                    fontSize: j > 0 ? '0.82rem' : '0.875rem',
                  }}>
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
