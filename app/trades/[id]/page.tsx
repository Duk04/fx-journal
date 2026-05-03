'use client'
import { use, useState } from 'react'
import { useTrade } from '@/hooks/use-trades'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { JournalEntry, TradeAnalysis } from '@/types'
import Image from 'next/image'

const MOOD_COLOR: Record<string, string> = {
  confident: '#16a34a', uncertain: '#d97706', fearful: '#dc2626', greedy: '#9333ea',
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
  const [uploadError, setUploadError] = useState('')

  if (isLoading) return <div style={{ color: '#64748b', padding: '2rem' }}>Loading...</div>
  if (!trade) return <div style={{ color: '#64748b', padding: '2rem' }}>Trade not found.</div>

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
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
    } finally {
      setUploading(false)
    }
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>{trade.pair}</h1>
        <span style={{
          padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700,
          background: trade.direction === 'BUY' ? '#dcfce7' : '#fee2e2',
          color: trade.direction === 'BUY' ? '#15803d' : '#b91c1c',
          border: `1px solid ${trade.direction === 'BUY' ? '#bbf7d0' : '#fecaca'}`,
        }}>{trade.direction}</span>
        {trade.pnl !== null && (
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: trade.pnl >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatCurrency(trade.pnl)}
          </span>
        )}
        {!trade.closedAt && (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
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
            <span key={tag} style={{ padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="card">
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 10, fontWeight: 600 }}>Notes</p>
          <p style={{ color: '#334155', lineHeight: 1.65 }}>{trade.notes}</p>
        </div>
      )}

      {/* Screenshot */}
      <div className="card">
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 12, fontWeight: 600 }}>Chart Screenshot</p>
        {trade.screenshotUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', width: '100%', height: 320, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
              <Image src={trade.screenshotUrl} alt="Trade chart" fill style={{ objectFit: 'contain' }} />
            </div>
            <button onClick={async () => { await fetch(`/api/trades/${tradeId}/screenshot`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['trade', tradeId] }) }}
              style={{ alignSelf: 'flex-start', padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: '3rem', textAlign: 'center', transition: 'border-color 0.15s', background: '#f8fafc' }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#cbd5e1')}>
              <p style={{ color: '#475569', marginBottom: 6, fontWeight: 500 }}>{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>JPG, PNG, WebP · max 10 MB</p>
              {uploadError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 6 }}>{uploadError}</p>}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshot} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Claude Analysis */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 600 }}>Claude AI Analysis</p>
          <button onClick={() => refetch()} disabled={analysisLoading}
            style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s', opacity: analysisLoading ? 0.5 : 1, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            {analysisLoading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze Trade'}
          </button>
        </div>
        {analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: '#334155', lineHeight: 1.7, borderLeft: '3px solid #3b82f6', paddingLeft: 12 }}>{analysis.summary}</p>
            {analysis.patterns.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Patterns detected</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.patterns.map(p => (
                    <span key={p} style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.8rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.suggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Suggestions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#2563eb', marginTop: 2, fontSize: '0.75rem' }}>▸</span>
                      <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Click &quot;Analyze Trade&quot; for AI insights. Includes screenshot analysis if uploaded.
          </p>
        )}
      </div>

      {/* Journal */}
      <div className="card">
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 14, fontWeight: 600 }}>Journal</p>
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
              style={{ padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', opacity: journalContent.trim() ? 1 : 0.4, whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {journal.map(j => (
            <div key={j.id} style={{ borderLeft: `3px solid ${j.mood ? MOOD_COLOR[j.mood] ?? '#cbd5e1' : '#cbd5e1'}`, paddingLeft: 12 }}>
              <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 4px' }}>{j.content}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {j.mood && <span style={{ fontSize: '0.75rem', color: MOOD_COLOR[j.mood] ?? '#64748b', textTransform: 'capitalize', fontWeight: 600 }}>{j.mood}</span>}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(j.createdAt)}</span>
              </div>
            </div>
          ))}
          {journal.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No journal entries yet.</p>}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem' }}>
      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      <p style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, fontSize: '0.9rem', color: '#0f172a' }}>{value}</p>
    </div>
  )
}
