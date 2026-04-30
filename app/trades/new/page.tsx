'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateTrade } from '@/hooks/use-trades'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD']

export default function NewTradePage() {
  const router = useRouter()
  const createTrade = useCreateTrade()
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

  const [form, setForm] = useState({
    pair: 'EURUSD', direction: 'BUY',
    entryPrice: '', exitPrice: '', lotSize: '', sl: '', tp: '',
    openedAt: now.toISOString().slice(0, 16), closedAt: '',
    notes: '', tags: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTrade.mutateAsync({
      pair: form.pair, direction: form.direction as 'BUY' | 'SELL',
      entryPrice: Number(form.entryPrice),
      exitPrice: form.exitPrice ? Number(form.exitPrice) : null,
      lotSize: Number(form.lotSize),
      sl: form.sl ? Number(form.sl) : null,
      tp: form.tp ? Number(form.tp) : null,
      openedAt: form.openedAt, closedAt: form.closedAt || null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    router.push('/trades')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>New Trade</h1>
        <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Record a new position</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Pair & Direction */}
        <Section title="Position">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Pair">
              <select value={form.pair} onChange={set('pair')} className="input">
                {PAIRS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <div style={{ display: 'flex', gap: 8 }}>
                {['BUY', 'SELL'].map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, direction: d }))}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                      background: form.direction === d ? (d === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.05)',
                      color: form.direction === d ? (d === 'BUY' ? '#4ade80' : '#f87171') : 'rgba(226,232,240,0.5)',
                      borderColor: form.direction === d ? (d === 'BUY' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.1)',
                    }}>{d}</button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Prices */}
        <Section title="Prices">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Entry Price *">
              <input required type="number" step="any" value={form.entryPrice} onChange={set('entryPrice')} className="input" placeholder="1.08500" />
            </Field>
            <Field label="Exit Price">
              <input type="number" step="any" value={form.exitPrice} onChange={set('exitPrice')} className="input" placeholder="Optional" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <Field label="Lot Size *">
              <input required type="number" step="any" value={form.lotSize} onChange={set('lotSize')} className="input" placeholder="0.10" />
            </Field>
            <Field label="Stop Loss">
              <input type="number" step="any" value={form.sl} onChange={set('sl')} className="input" placeholder="1.08000" />
            </Field>
            <Field label="Take Profit">
              <input type="number" step="any" value={form.tp} onChange={set('tp')} className="input" placeholder="1.09500" />
            </Field>
          </div>
        </Section>

        {/* Timing */}
        <Section title="Timing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Opened At *">
              <input required type="datetime-local" value={form.openedAt} onChange={set('openedAt')} className="input" />
            </Field>
            <Field label="Closed At">
              <input type="datetime-local" value={form.closedAt} onChange={set('closedAt')} className="input" />
            </Field>
          </div>
        </Section>

        {/* Notes & Tags */}
        <Section title="Notes">
          <Field label="Tags (comma-separated)">
            <input type="text" value={form.tags} onChange={set('tags')} placeholder="breakout, trend, news" className="input" />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <Field label="Notes">
              <textarea value={form.notes} onChange={set('notes')} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Trade rationale, market context, observations..." />
            </Field>
          </div>
        </Section>

        <button type="submit" disabled={createTrade.isPending} style={{
          padding: '0.75rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
          border: 'none', cursor: 'pointer', opacity: createTrade.isPending ? 0.6 : 1, transition: 'opacity 0.15s',
        }}>
          {createTrade.isPending ? 'Saving...' : 'Save Trade'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.4)', marginBottom: '0.875rem', fontWeight: 600 }}>{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(226,232,240,0.55)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
