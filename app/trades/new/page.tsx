'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateTrade } from '@/hooks/use-trades'
import { Check, Clock, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD',
]
const LOT_PRESETS = ['0.01', '0.05', '0.10', '0.25', '0.50', '1.00']
const TAG_PRESETS = ['breakout', 'trend', 'reversal', 'scalp', 'news', 'range']

function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function NewTradePage() {
  const router = useRouter()
  const createTrade = useCreateTrade()

  const [pair, setPair] = useState('EURUSD')
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [lotSize, setLotSize] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [openedAt, setOpenedAt] = useState(nowLocal)
  const [closedAt, setClosedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(true)

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTrade.mutateAsync({
      pair, direction,
      entryPrice: Number(entryPrice),
      exitPrice: (!isOpen && exitPrice) ? Number(exitPrice) : null,
      lotSize: Number(lotSize),
      sl: sl ? Number(sl) : null,
      tp: tp ? Number(tp) : null,
      openedAt,
      closedAt: (!isOpen && closedAt) ? closedAt : null,
      notes: notes || null,
      tags,
    })
    router.push('/trades')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <Link href="/trades" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', textDecoration: 'none', padding: '0.25rem' }}>
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>New Trade</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>Record a position</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Pair */}
          <div>
            <label style={labelStyle}>Pair</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PAIRS.map(p => (
                <button key={p} type="button" onClick={() => setPair(p)} style={{
                  flex: '0 0 calc(25% - 5px)', minWidth: 0,
                  padding: '0.45rem 0.25rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.12s', border: '1px solid',
                  background: pair === p ? 'rgba(0,196,238,0.1)' : 'var(--bg-2)',
                  color: pair === p ? 'var(--cyan)' : 'var(--text-faint)',
                  borderColor: pair === p ? 'rgba(0,196,238,0.3)' : 'var(--border)',
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label style={labelStyle}>Direction</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['BUY', 'SELL'] as const).map(d => (
                <button key={d} type="button" onClick={() => setDirection(d)} style={{
                  flex: 1, padding: '0.55rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.12s', border: '1px solid',
                  background: direction === d ? (d === 'BUY' ? 'rgba(0,212,133,0.12)' : 'rgba(255,53,83,0.12)') : 'var(--bg-2)',
                  color: direction === d ? (d === 'BUY' ? 'var(--pos)' : 'var(--neg)') : 'var(--text-faint)',
                  borderColor: direction === d ? (d === 'BUY' ? 'rgba(0,212,133,0.3)' : 'rgba(255,53,83,0.3)') : 'var(--border)',
                }}>{d}</button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

          {/* Entry + Lot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Entry Price *</label>
              <input required type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)}
                className="input" placeholder="1.08500" />
            </div>
            <div>
              <label style={labelStyle}>Lot Size *</label>
              <input required type="number" step="any" value={lotSize} onChange={e => setLotSize(e.target.value)}
                className="input" placeholder="0.10" />
              <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                {LOT_PRESETS.map(l => (
                  <button key={l} type="button" onClick={() => setLotSize(l)} style={{
                    padding: '0.15rem 0.45rem', borderRadius: 5, fontSize: '0.7rem', fontWeight: 500,
                    cursor: 'pointer', border: '1px solid',
                    background: lotSize === l ? 'rgba(0,196,238,0.1)' : 'var(--bg-2)',
                    color: lotSize === l ? 'var(--cyan)' : 'var(--text-faint)',
                    borderColor: lotSize === l ? 'rgba(0,196,238,0.25)' : 'var(--border)',
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* SL + TP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Stop Loss</label>
              <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)}
                className="input" placeholder="Optional" />
            </div>
            <div>
              <label style={labelStyle}>Take Profit</label>
              <input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)}
                className="input" placeholder="Optional" />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

          {/* Opened At */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Opened At *</label>
              <button type="button" onClick={() => setOpenedAt(nowLocal())} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 500,
                color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <Clock size={11} /> Now
              </button>
            </div>
            <input required type="datetime-local" value={openedAt} onChange={e => setOpenedAt(e.target.value)} className="input" />
          </div>

          {/* Open/Closed toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, border: '1.5px solid',
              borderColor: isOpen ? 'var(--border)' : 'var(--cyan)',
              background: isOpen ? 'var(--bg-2)' : 'var(--cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }} onClick={() => setIsOpen(v => !v)}>
              {!isOpen && <Check size={11} color="#fff" strokeWidth={3} />}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Trade is closed</span>
          </label>

          {/* Exit fields — shown only when closed */}
          {!isOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: 4 }}>
              <div>
                <label style={labelStyle}>Exit Price</label>
                <input type="number" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
                  className="input" placeholder="1.09200" />
              </div>
              <div>
                <label style={labelStyle}>Closed At</label>
                <input type="datetime-local" value={closedAt} onChange={e => setClosedAt(e.target.value)} className="input" />
              </div>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {TAG_PRESETS.map(t => {
                const active = tags.includes(t)
                return (
                  <button key={t} type="button" onClick={() => toggleTag(t)} style={{
                    padding: '0.28rem 0.7rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.12s', border: '1px solid',
                    background: active ? 'rgba(139,92,246,0.12)' : 'var(--bg-2)',
                    color: active ? '#a78bfa' : 'var(--text-faint)',
                    borderColor: active ? 'rgba(139,92,246,0.3)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {active && <Check size={10} strokeWidth={3} />}
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="input" style={{ resize: 'vertical' }}
              placeholder="Trade rationale, observations..." />
          </div>

        </div>

        {/* Submit */}
        <button type="submit" disabled={createTrade.isPending} className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontSize: '0.95rem', justifyContent: 'center', opacity: createTrade.isPending ? 0.6 : 1 }}>
          {createTrade.isPending ? 'Saving...' : 'Save Trade'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
}
