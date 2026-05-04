'use client'
import { use, useState } from 'react'
import { useTrade, useUpdateTrade } from '@/hooks/use-trades'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { JournalEntry, TradeAnalysis } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, ImagePlus, X, ChevronRight, Pencil, CheckCircle, Clock } from 'lucide-react'

const MOOD_COLOR: Record<string, string> = {
  confident: 'var(--pos)', uncertain: 'var(--amber)',
  fearful: 'var(--neg)', greedy: 'var(--purple)',
}

function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tradeId = Number(id)
  const { data: trade, isLoading } = useTrade(tradeId)
  const updateTrade = useUpdateTrade(tradeId)
  const qc = useQueryClient()

  const { data: journal = [] } = useQuery<JournalEntry[]>({
    queryKey: ['journal', tradeId],
    queryFn: async () => (await fetch(`/api/journal?tradeId=${tradeId}`)).json(),
  })

  const { data: analysis, isLoading: analysisLoading, refetch } = useQuery<TradeAnalysis>({
    queryKey: ['analysis', tradeId],
    queryFn: async () => {
      const res = await fetch(`/api/trades/${tradeId}/analysis`)
      if (!res.ok) throw new Error('Analysis failed')
      return res.json()
    },
    enabled: false,
  })

  const [journalContent, setJournalContent] = useState('')
  const [journalMood, setJournalMood] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Close trade state
  const [showClose, setShowClose] = useState(false)
  const [closeExit, setCloseExit] = useState('')
  const [closeAt, setCloseAt] = useState(nowLocal)
  const [closing, setClosing] = useState(false)

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 860 }}>
      {[130, 90, 200, 160].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
    </div>
  )
  if (!trade) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Trade not found.</div>

  const pnlClass = trade.pnl === null ? '' : trade.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadError('')
    try {
      const fd = new FormData()
      fd.append('screenshot', file)
      const res = await fetch(`/api/trades/${tradeId}/screenshot`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setUploadError(data.error ?? 'Upload failed')
        return
      }
      qc.invalidateQueries({ queryKey: ['trade', tradeId] })
    } finally { setUploading(false) }
  }

  const handleAddJournal = async () => {
    if (!journalContent.trim()) return
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId, content: journalContent, mood: journalMood || null }),
    })
    setJournalContent(''); setJournalMood('')
    qc.invalidateQueries({ queryKey: ['journal', tradeId] })
  }

  const handleCloseTrade = async () => {
    if (!closeExit) return
    setClosing(true)
    try {
      await updateTrade.mutateAsync({
        exitPrice: Number(closeExit),
        closedAt: closeAt || undefined,
      })
      setShowClose(false)
    } finally { setClosing(false) }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
          {trade.pair}
        </h1>
        <span className={`badge badge-${trade.direction === 'BUY' ? 'buy' : 'sell'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
          {trade.direction}
        </span>
        {trade.pnl !== null && (
          <span className={`mono ${pnlClass}`} style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {formatCurrency(trade.pnl)}
          </span>
        )}
        {!trade.closedAt && <span className="badge badge-open">OPEN</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {!trade.closedAt && (
            <button onClick={() => setShowClose(v => !v)} className="btn btn-primary" style={{ fontSize: '0.78rem' }}>
              <CheckCircle size={13} /> Close Trade
            </button>
          )}
          <Link href={`/trades/${tradeId}/edit`} className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </div>

      {/* Close Trade inline form */}
      {showClose && !trade.closedAt && (
        <div className="card" style={{ background: 'rgba(0,212,133,0.05)', border: '1px solid rgba(0,212,133,0.2)' }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Close This Trade</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Exit Price *</label>
              <input type="number" step="any" value={closeExit} onChange={e => setCloseExit(e.target.value)}
                className="input" placeholder="1.09200" autoFocus />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Closed At</label>
                <button type="button" onClick={() => setCloseAt(nowLocal())} style={{
                  display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem',
                  color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                  <Clock size={10} /> Now
                </button>
              </div>
              <input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} className="input" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCloseTrade} disabled={!closeExit || closing} className="btn btn-primary"
              style={{ opacity: closeExit && !closing ? 1 : 0.5 }}>
              {closing ? 'Closing...' : 'Confirm Close'}
            </button>
            <button onClick={() => setShowClose(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
        {[
          { label: 'Entry',       value: String(trade.entryPrice),                          mono: true },
          { label: 'Exit',        value: trade.exitPrice !== null ? String(trade.exitPrice) : '—', mono: true },
          { label: 'Lot Size',    value: String(trade.lotSize),                              mono: true },
          { label: 'R:R',         value: trade.rr !== null ? trade.rr.toFixed(2) : '—',     mono: true },
          { label: 'Stop Loss',   value: trade.sl !== null ? String(trade.sl) : '—',         mono: true },
          { label: 'Take Profit', value: trade.tp !== null ? String(trade.tp) : '—',         mono: true },
          { label: 'Opened',      value: formatDate(trade.openedAt),                         mono: false },
          { label: 'Closed',      value: trade.closedAt ? formatDate(trade.closedAt) : 'Open', mono: false },
        ].map(({ label, value, mono }) => (
          <div key={label} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.7rem 0.875rem',
          }}>
            <p className="stat-label" style={{ margin: '0 0 4px' }}>{label}</p>
            <p className={mono ? 'mono' : ''} style={{ fontWeight: 600, fontSize: '0.875rem', color: value === '—' ? 'var(--text-faint)' : 'var(--text)', margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tags */}
      {trade.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {trade.tags.map(tag => <span key={tag} className="badge badge-tag" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{tag}</span>)}
        </div>
      )}

      {/* Pre-trade Plan */}
      {trade.plan && (
        <div className="card" style={{ borderLeft: '2px solid rgba(139,92,246,0.5)' }}>
          <p className="section-label">Trade Plan</p>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{trade.plan}</p>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="card">
          <p className="section-label">Notes</p>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{trade.notes}</p>
        </div>
      )}

      {/* Screenshot */}
      <div className="card">
        <p className="section-label">Chart Screenshot</p>
        {trade.screenshotUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative', width: '100%', height: 320, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <Image src={trade.screenshotUrl} alt="Trade chart" fill style={{ objectFit: 'contain' }} />
            </div>
            <button
              onClick={async () => {
                await fetch(`/api/trades/${tradeId}/screenshot`, { method: 'DELETE' })
                qc.invalidateQueries({ queryKey: ['trade', tradeId] })
              }}
              className="btn btn-danger" style={{ alignSelf: 'flex-start', fontSize: '0.78rem' }}
            >
              <X size={13} /> Remove
            </button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 10, padding: '3rem', textAlign: 'center',
              transition: 'border-color 0.15s, background 0.15s',
              background: 'var(--bg-2)',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,196,238,0.4)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,196,238,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <ImagePlus size={24} color="var(--text-faint)" />
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>
                {uploading ? 'Uploading…' : 'Click to upload screenshot'}
              </p>
              <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>JPG, PNG, WebP · max 10 MB</p>
              {uploadError && <p style={{ color: 'var(--neg)', fontSize: '0.78rem', marginTop: 8 }}>{uploadError}</p>}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshot} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Claude AI Analysis */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,196,238,0.1)', border: '1px solid rgba(0,196,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="var(--cyan)" />
            </div>
            <p className="section-label" style={{ margin: 0 }}>Claude AI Analysis</p>
          </div>
          <button onClick={() => refetch()} disabled={analysisLoading} className="btn btn-primary" style={{ fontSize: '0.78rem', opacity: analysisLoading ? 0.6 : 1 }}>
            <Sparkles size={13} />
            {analysisLoading ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Analyze Trade'}
          </button>
        </div>

        {analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, borderLeft: '2px solid var(--cyan)', paddingLeft: 14, margin: 0, fontSize: '0.9rem' }}>
              {analysis.summary}
            </p>
            {analysis.patterns.length > 0 && (
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Patterns detected</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.patterns.map(p => (
                    <span key={p} style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', background: 'rgba(0,196,238,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,196,238,0.2)' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.suggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Suggestions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <ChevronRight size={14} color="var(--cyan)" style={{ marginTop: 3, flexShrink: 0 }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', margin: 0 }}>
            Click &quot;Analyze Trade&quot; for AI insights. Includes screenshot analysis if uploaded.
          </p>
        )}
      </div>

      {/* Journal */}
      <div className="card">
        <p className="section-label">Journal</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)}
            placeholder="Write a note about this trade…" rows={3} className="input" style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={journalMood} onChange={e => setJournalMood(e.target.value)} className="input" style={{ flex: 1 }}>
              <option value="">No mood</option>
              <option value="confident">Confident</option>
              <option value="uncertain">Uncertain</option>
              <option value="fearful">Fearful</option>
              <option value="greedy">Greedy</option>
            </select>
            <button onClick={handleAddJournal} disabled={!journalContent.trim()}
              className="btn btn-primary" style={{ opacity: journalContent.trim() ? 1 : 0.35, whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {journal.map(j => (
            <div key={j.id} style={{ borderLeft: `2px solid ${j.mood ? MOOD_COLOR[j.mood] ?? 'var(--border-mid)' : 'var(--border-mid)'}`, paddingLeft: 12 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 4px' }}>{j.content}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {j.mood && <span style={{ fontSize: '0.72rem', color: MOOD_COLOR[j.mood] ?? 'var(--text-faint)', textTransform: 'capitalize', fontWeight: 700 }}>{j.mood}</span>}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{formatDate(j.createdAt)}</span>
              </div>
            </div>
          ))}
          {journal.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', margin: 0 }}>No journal entries yet.</p>}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
}
