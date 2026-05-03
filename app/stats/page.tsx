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
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Statistics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 3 }}>Detailed performance breakdown</p>
      </div>

      <Section icon={<Globe size={14} />} title="By Currency Pair" loading={pL} empty={pairs.length === 0}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={pairs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
            <XAxis dataKey="pair" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']}
              labelStyle={{ color: '#64748b', fontSize: 11 }}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="totalPnl" radius={[5, 5, 0, 0]}>
              {pairs.map((p, i) => <Cell key={i} fill={p.totalPnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />)}
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
            <XAxis dataKey="month" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']}
              labelStyle={{ color: '#64748b', fontSize: 11 }}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="totalPnl" radius={[5, 5, 0, 0]}>
              {monthly.map((m, i) => <Cell key={i} fill={m.totalPnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />)}
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
        <span style={{ color: '#64748b' }}>{icon}</span>
        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', fontWeight: 700, margin: 0 }}>{title}</p>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : empty ? (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>No data yet.</p>
      ) : children}
    </div>
  )
}

function StatsTable({ columns, rows, pnlCol }: { columns: string[]; rows: (string | number)[][]; pnlCol?: number }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            {columns.map(c => (
              <th key={c} style={{
                textAlign: 'left', padding: '0.55rem 0.75rem',
                color: '#94a3b8', fontWeight: 600,
                fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
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
                    color: isPnl ? (positive ? '#16a34a' : '#dc2626') : j === 0 ? '#1e293b' : '#64748b',
                    fontFamily: j > 0 ? 'monospace' : undefined,
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
