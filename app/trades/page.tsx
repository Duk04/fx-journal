'use client'
import { useState } from 'react'
import { useTrades, useDeleteTrade } from '@/hooks/use-trades'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Trade } from '@/types'
import { Filter, Trash2, ArrowUpRight } from 'lucide-react'

const PAIRS = [
  '',
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD',
]

export default function TradesPage() {
  const [pair, setPair] = useState('')
  const [direction, setDirection] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params: Record<string, string> = {}
  if (pair) params.pair = pair
  if (direction) params.direction = direction
  if (status) params.status = status
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo

  const { data: trades = [], isLoading } = useTrades(params)
  const deleteTrade = useDeleteTrade()
  const hasFilters = !!(pair || direction || status || dateFrom || dateTo)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Trades</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 3 }}>
            {trades.length} {hasFilters ? 'filtered' : 'total'} trade{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', marginRight: 4 }}>
          <Filter size={14} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter</span>
        </div>
        <select value={pair} onChange={e => setPair(e.target.value)} className="input" style={{ width: 'auto' }}>
          {PAIRS.map(p => <option key={p} value={p}>{p || 'All Pairs'}</option>)}
        </select>
        <select value={direction} onChange={e => setDirection(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="">All Directions</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" style={{ width: 'auto' }} />
          <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" style={{ width: 'auto' }} />
        </div>
        {hasFilters && (
          <button onClick={() => { setPair(''); setDirection(''); setStatus(''); setDateFrom(''); setDateTo('') }}
            className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : trades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: '#ede9fe', border: '1px solid #ddd6fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Filter size={20} color="#7c3aed" />
          </div>
          <p style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>{hasFilters ? 'No matching trades' : 'No trades yet'}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            {hasFilters ? 'Try adjusting your filters.' : 'Start tracking your forex trades.'}
          </p>
          {!hasFilters && <Link href="/trades/new" className="btn btn-primary">Add Trade</Link>}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                {['Pair', 'Dir', 'Entry', 'Exit', 'Lots', 'P&L', 'R:R', 'Tags', 'Date', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '0.75rem 1rem',
                    color: 'var(--text-faint)', fontWeight: 600,
                    fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t: Trade, i: number) => (
                <tr key={t.id}
                  style={{ borderBottom: i < trades.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{t.pair}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span className={`badge ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.direction}</span>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{t.entryPrice}</td>
                  <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: t.exitPrice ? '#475569' : '#cbd5e1' }}>{t.exitPrice ?? '—'}</td>
                  <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{t.lotSize}</td>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: t.pnl === null ? '#cbd5e1' : t.pnl >= 0 ? '#16a34a' : '#dc2626' }}>
                    {t.pnl !== null ? formatCurrency(t.pnl) : '—'}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{t.rr !== null ? t.rr.toFixed(2) : '—'}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {t.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="badge badge-tag">{tag}</span>
                      ))}
                      {t.tags.length > 2 && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>+{t.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(t.openedAt)}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link href={`/trades/${t.id}`} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        color: '#2563eb', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 500,
                      }}>
                        View <ArrowUpRight size={12} />
                      </Link>
                      <button
                        onClick={() => { if (confirm('Delete this trade?')) deleteTrade.mutate(t.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#cbd5e1', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
