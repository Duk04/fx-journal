'use client'
import { usePairStats, useMonthlyStats, useTagStats } from '@/hooks/use-stats'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function StatsPage() {
  const { data: pairs = [], isLoading: pL } = usePairStats()
  const { data: monthly = [], isLoading: mL } = useMonthlyStats()
  const { data: tags = [] } = useTagStats()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Statistics</h1>
        <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Detailed performance breakdown</p>
      </div>

      <Section title="By Currency Pair" loading={pL} empty={pairs.length === 0}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pairs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="pair" stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.45)', fontSize: 11 }} tickLine={false} />
            <YAxis stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.45)', fontSize: 11 }} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']} labelStyle={{ color: 'rgba(226,232,240,0.6)', fontSize: 12 }} />
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

      <Section title="Monthly Performance" loading={mL} empty={monthly.length === 0}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.45)', fontSize: 11 }} tickLine={false} />
            <YAxis stroke="rgba(226,232,240,0.15)" tick={{ fill: 'rgba(226,232,240,0.45)', fontSize: 11 }} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              formatter={(v: number) => [formatCurrency(v), 'P&L']} labelStyle={{ color: 'rgba(226,232,240,0.6)', fontSize: 12 }} />
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

      <Section title="By Tag" empty={tags.length === 0}>
        <StatsTable
          columns={['Tag', 'Trades', 'Win Rate', 'P&L']}
          rows={tags.map(t => [t.tag, t.totalTrades, formatPercent(t.winRate), formatCurrency(t.totalPnl)])}
          pnlCol={3}
        />
      </Section>
    </div>
  )
}

function Section({ title, children, loading, empty }: { title: string; children: React.ReactNode; loading?: boolean; empty?: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', fontWeight: 600, margin: 0 }}>{title}</p>
      {loading ? (
        <div style={{ height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
      ) : empty ? (
        <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No data yet.</p>
      ) : children}
    </div>
  )
}

function StatsTable({ columns, rows, pnlCol }: { columns: string[]; rows: (string | number)[][]; pnlCol?: number }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {columns.map(c => (
              <th key={c} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'rgba(226,232,240,0.35)', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {row.map((cell, j) => {
                const isPnl = j === pnlCol
                const val = String(cell)
                const positive = isPnl ? !val.startsWith('-') : undefined
                return (
                  <td key={j} style={{ padding: '0.6rem 0.75rem', fontWeight: isPnl ? 600 : 400, color: isPnl ? (positive ? '#4ade80' : '#f87171') : 'rgba(226,232,240,0.8)', fontFamily: j > 0 ? 'monospace' : undefined, fontSize: j > 0 ? '0.82rem' : undefined }}>
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
