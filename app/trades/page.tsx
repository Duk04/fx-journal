'use client'
import { useState } from 'react'
import { useTrades, useDeleteTrade } from '@/hooks/use-trades'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Trade } from '@/types'

const PAIRS = ['', 'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD']

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Trades</h1>
          <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.85rem', marginTop: 4 }}>
            {trades.length} {hasFilters ? 'filtered' : 'total'} trade{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
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
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" style={{ width: 'auto' }} />
        <span style={{ color: 'rgba(226,232,240,0.3)', fontSize: '0.85rem' }}>—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" style={{ width: 'auto' }} />
        {hasFilters && (
          <button onClick={() => { setPair(''); setDirection(''); setStatus(''); setDateFrom(''); setDateTo('') }}
            style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: 52, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />)}
        </div>
      ) : trades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>🗂️</p>
          <p style={{ color: 'rgba(226,232,240,0.5)', marginBottom: 16 }}>
            {hasFilters ? 'No trades match your filters.' : 'No trades yet. Add your first trade!'}
          </p>
          {!hasFilters && (
            <Link href="/trades/new" style={{
              display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
              textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
            }}>
              Add Trade
            </Link>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                {['Pair', 'Dir', 'Entry', 'Exit', 'Lots', 'P&L', 'R:R', 'Tags', 'Date', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'rgba(226,232,240,0.4)', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t: Trade, i: number) => (
                <tr key={t.id} style={{
                  borderBottom: i < trades.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t.pair}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                      background: t.direction === 'BUY' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: t.direction === 'BUY' ? '#4ade80' : '#f87171',
                      border: `1px solid ${t.direction === 'BUY' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>{t.direction}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.entryPrice}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: t.exitPrice ? '#e2e8f0' : 'rgba(226,232,240,0.3)' }}>{t.exitPrice ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.lotSize}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem', color: t.pnl === null ? 'rgba(226,232,240,0.3)' : t.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                    {t.pnl !== null ? formatCurrency(t.pnl) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: 'rgba(226,232,240,0.6)' }}>{t.rr !== null ? t.rr.toFixed(2) : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {t.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{tag}</span>
                      ))}
                      {t.tags.length > 2 && <span style={{ fontSize: '0.72rem', color: 'rgba(226,232,240,0.3)' }}>+{t.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'rgba(226,232,240,0.4)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(t.openedAt)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Link href={`/trades/${t.id}`} style={{ color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>View</Link>
                      <button onClick={() => { if (confirm('Delete this trade?')) deleteTrade.mutate(t.id) }}
                        style={{ color: '#f87171', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                        Delete
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
