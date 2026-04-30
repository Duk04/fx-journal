'use client'
import { use, useState } from 'react'
import { useTrade } from '@/hooks/use-trades'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { JournalEntry, TradeAnalysis } from '@/types'
import Image from 'next/image'

const MOOD_COLOR: Record<string, string> = {
  confident: '#4ade80', uncertain: '#fbbf24', fearful: '#f87171', greedy: '#c084fc',
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tradeId = Number(id)
  const { data: trade, isLoading } = useTrade(tradeId)
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

  if (isLoading) return <div style={{ color: 'rgba(226,232,240,0.4)', padding: '2rem' }}>Loading...</div>
  if (!trade) return <div style={{ color: 'rgba(226,232,240,0.4)', padding: '2rem' }}>Trade not found.</div>

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('screenshot', file)
    await fetch(`/api/trades/${tradeId}/screenshot`, { method: 'POST', body: fd })
    qc.invalidateQueries({ queryKey: ['trade', tradeId] })
    setUploading(false)
  }

  const handleAddJournal = async () => {
    if (!journalContent.trim()) return
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId, content: journalContent, mood: journalMood || null }),
    })
    setJournalContent('')
    setJournalMood('')
    qc.invalidateQueries({ queryKey: ['journal', tradeId] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{trade.pair}</h1>
        <span style={{
          padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700,
          background: trade.direction === 'BUY' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: trade.direction === 'BUY' ? '#4ade80' : '#f87171',
          border: `1px solid ${trade.direction === 'BUY' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>{trade.direction}</span>
        {trade.pnl !== null && (
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: trade.pnl >= 0 ? '#4ade80' : '#f87171' }}>
            {formatCurrency(trade.pnl)}
          </span>
        )}
        {!trade.closedAt && (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            OPEN
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <InfoCard label="Entry" value={String(trade.entryPrice)} mono />
        <InfoCard label="Exit" value={trade.exitPrice !== null ? String(trade.exitPrice) : '—'} mono />
        <InfoCard label="Lot Size" value={String(trade.lotSize)} mono />
        <InfoCard label="R:R" value={trade.rr !== null ? trade.rr.toFixed(2) : '—'} mono />
        <InfoCard label="Stop Loss" value={trade.sl !== null ? String(trade.sl) : '—'} mono />
        <InfoCard label="Take Profit" value={trade.tp !== null ? String(trade.tp) : '—'} mono />
        <InfoCard label="Opened" value={formatDate(trade.openedAt)} />
        <InfoCard label="Closed" value={trade.closedAt ? formatDate(trade.closedAt) : 'Open'} />
      </div>

      {/* Tags */}
      {trade.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {trade.tags.map(tag => (
            <span key={tag} style={{ padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="card">
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', marginBottom: 10, fontWeight: 600 }}>Notes</p>
          <p style={{ color: 'rgba(226,232,240,0.85)', lineHeight: 1.65 }}>{trade.notes}</p>
        </div>
      )}

      {/* Screenshot */}
      <div className="card">
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', marginBottom: 12, fontWeight: 600 }}>Chart Screenshot</p>
        {trade.screenshotUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', width: '100%', height: 320, borderRadius: 8, overflow: 'hidden', background: '#0a0e1a' }}>
              <Image src={trade.screenshotUrl} alt="Trade chart" fill style={{ objectFit: 'contain' }} />
            </div>
            <button onClick={async () => { await fetch(`/api/trades/${tradeId}/screenshot`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['trade', tradeId] }) }}
              style={{ alignSelf: 'flex-start', padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 10, padding: '3rem', textAlign: 'center', transition: 'border-color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.4)')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)')}>
              <p style={{ color: 'rgba(226,232,240,0.4)', marginBottom: 6 }}>{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
              <p style={{ color: 'rgba(226,232,240,0.2)', fontSize: '0.8rem' }}>JPG, PNG, WebP · max 10 MB</p>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshot} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Claude Analysis */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', fontWeight: 600 }}>Claude AI Analysis</p>
          <button onClick={() => refetch()} disabled={analysisLoading}
            style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s', opacity: analysisLoading ? 0.5 : 1, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none' }}>
            {analysisLoading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze Trade'}
          </button>
        </div>
        {analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'rgba(226,232,240,0.85)', lineHeight: 1.7, borderLeft: '3px solid rgba(59,130,246,0.4)', paddingLeft: 12 }}>{analysis.summary}</p>
            {analysis.patterns.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patterns detected</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.patterns.map(p => (
                    <span key={p} style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.8rem', background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.suggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#60a5fa', marginTop: 2, fontSize: '0.75rem' }}>▸</span>
                      <p style={{ color: 'rgba(226,232,240,0.75)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '0.875rem' }}>
            Click &quot;Analyze Trade&quot; for AI insights. Includes screenshot analysis if uploaded.
          </p>
        )}
      </div>

      {/* Journal */}
      <div className="card">
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', marginBottom: 14, fontWeight: 600 }}>Journal</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)}
            placeholder="Write a note about this trade..." rows={3} className="input" style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={journalMood} onChange={e => setJournalMood(e.target.value)} className="input" style={{ flex: 1 }}>
              <option value="">No mood</option>
              <option value="confident">Confident</option>
              <option value="uncertain">Uncertain</option>
              <option value="fearful">Fearful</option>
              <option value="greedy">Greedy</option>
            </select>
            <button onClick={handleAddJournal} disabled={!journalContent.trim()}
              style={{ padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', opacity: journalContent.trim() ? 1 : 0.4, whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {journal.map(j => (
            <div key={j.id} style={{ borderLeft: `3px solid ${j.mood ? MOOD_COLOR[j.mood] ?? '#6b7280' : 'rgba(255,255,255,0.15)'}`, paddingLeft: 12 }}>
              <p style={{ color: 'rgba(226,232,240,0.85)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 4px' }}>{j.content}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {j.mood && <span style={{ fontSize: '0.75rem', color: MOOD_COLOR[j.mood] ?? '#6b7280', textTransform: 'capitalize', fontWeight: 500 }}>{j.mood}</span>}
                <span style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.3)' }}>{formatDate(j.createdAt)}</span>
              </div>
            </div>
          ))}
          {journal.length === 0 && <p style={{ color: 'rgba(226,232,240,0.25)', fontSize: '0.875rem' }}>No journal entries yet.</p>}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem' }}>
      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(226,232,240,0.35)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      <p style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, fontSize: '0.9rem' }}>{value}</p>
    </div>
  )
}
