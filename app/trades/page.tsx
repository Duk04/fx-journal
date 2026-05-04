'use client'
import { useState } from 'react'
import { useTrades, useDeleteTrade } from '@/hooks/use-trades'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Trade } from '@/types'
import { SlidersHorizontal, Trash2, ArrowUpRight, Plus } from 'lucide-react'

const PAIRS = [
  '', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
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
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Trades</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', marginTop: 3 }}>
            {trades.length} {hasFilters ? 'filtered' : 'total'} trade{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/trades/new" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
          <Plus size={13} strokeWidth={2.5} /> New Trade
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', marginRight: 4 }}>
          <SlidersHorizontal size={13} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter</span>
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
          <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" style={{ width: 'auto' }} />
        </div>
        {hasFilters && (
          <button onClick={() => { setPair(''); setDirection(''); setStatus(''); setDateFrom(''); setDateTo('') }}
            className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : trades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SlidersHorizontal size={20} color="var(--purple)" />
          </div>
          <p style={{ fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 6, color: 'var(--text)' }}>
            {hasFilters ? 'No matching trades' : 'No trades yet'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            {hasFilters ? 'Try adjusting your filters.' : 'Start tracking your forex trades.'}
          </p>
          {!hasFilters && (
            <Link href="/trades/new" className="btn btn-primary">
              <Plus size={13} strokeWidth={2.5} /> Add Trade
            </Link>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Pair', 'Dir', 'Entry', 'Exit', 'Lots', 'P&L', 'R:R', 'Tags', 'Date', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t: Trade) => {
                const pnlClass = t.pnl === null ? '' : t.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", fontSize: '0.88rem' }}>{t.pair}</td>
                    <td><span className={`badge badge-${t.direction === 'BUY' ? 'buy' : 'sell'}`}>{t.direction}</span></td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{t.entryPrice}</td>
                    <td className="mono" style={{ fontSize: '0.8rem', color: t.exitPrice ? 'var(--text-muted)' : 'var(--text-faint)' }}>{t.exitPrice ?? '—'}</td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{t.lotSize}</td>
                    <td className={`mono ${pnlClass}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {t.pnl !== null ? formatCurrency(t.pnl) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{t.rr !== null ? t.rr.toFixed(2) : <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {t.tags.slice(0, 2).map(tag => <span key={tag} className="badge badge-tag">{tag}</span>)}
                        {t.tags.length > 2 && <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>+{t.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{formatDate(t.openedAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Link href={`/trades/${t.id}`} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          color: 'var(--cyan)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600,
                        }}>
                          View <ArrowUpRight size={11} />
                        </Link>
                        <button
                          onClick={() => { if (confirm('Delete this trade?')) deleteTrade.mutate(t.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--neg)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
