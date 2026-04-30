'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { JournalEntry, Mood } from '@/types'
import { formatDate } from '@/lib/utils'

const MOODS: Mood[] = ['confident', 'uncertain', 'fearful', 'greedy']
const MOOD_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  confident: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  uncertain: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  fearful:   { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
  greedy:    { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
}

export default function JournalPage() {
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [filterMood, setFilterMood] = useState('')

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-all', filterMood],
    queryFn: async () => {
      const qs = filterMood ? `?mood=${filterMood}` : ''
      return (await fetch(`/api/journal${qs}`)).json()
    },
  })

  const addEntry = useMutation({
    mutationFn: async () => {
      return (await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mood: mood || null }),
      })).json()
    },
    onSuccess: () => { setContent(''); setMood(''); qc.invalidateQueries({ queryKey: ['journal-all'] }) },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Journal</h1>
        <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Trading thoughts and reflections</p>
      </div>

      {/* Write */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(226,232,240,0.35)', fontWeight: 600 }}>New Entry</p>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Write your thoughts, lessons, market observations..." rows={4}
          className="input" style={{ resize: 'vertical', lineHeight: 1.65 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {MOODS.map(m => {
              const s = MOOD_STYLE[m]
              const active = mood === m
              return (
                <button key={m} type="button" onClick={() => setMood(active ? '' : m)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    background: active ? s.bg : 'transparent',
                    color: active ? s.color : 'rgba(226,232,240,0.4)',
                    border: `1px solid ${active ? s.border : 'rgba(255,255,255,0.08)'}`,
                  }}>{m}</button>
              )
            })}
          </div>
          <button onClick={() => addEntry.mutate()} disabled={!content.trim() || addEntry.isPending}
            style={{
              marginLeft: 'auto', padding: '0.4rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none',
              cursor: 'pointer', opacity: content.trim() && !addEntry.isPending ? 1 : 0.4,
            }}>
            {addEntry.isPending ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8 }}>
        <FilterBtn label="All" active={filterMood === ''} onClick={() => setFilterMood('')} />
        {MOODS.map(m => <FilterBtn key={m} label={m} active={filterMood === m} onClick={() => setFilterMood(m)} color={MOOD_STYLE[m].color} />)}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📓</p>
          <p style={{ color: 'rgba(226,232,240,0.4)' }}>No journal entries yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map(e => {
            const ms = e.mood ? MOOD_STYLE[e.mood] : null
            return (
              <div key={e.id} className="card" style={{ borderLeft: `3px solid ${ms ? ms.color : 'rgba(255,255,255,0.12)'}` }}>
                <p style={{ color: 'rgba(226,232,240,0.85)', lineHeight: 1.7, marginBottom: 10, fontSize: '0.9rem' }}>{e.content}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {e.mood && ms && (
                    <span style={{ padding: '0.15rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize', background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>{e.mood}</span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.3)' }}>{formatDate(e.createdAt)}</span>
                  {e.tradeId && (
                    <a href={`/trades/${e.tradeId}`} style={{ fontSize: '0.78rem', color: '#60a5fa', textDecoration: 'none', marginLeft: 'auto' }}>
                      Trade #{e.tradeId} →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
      color: active ? (color ?? '#60a5fa') : 'rgba(226,232,240,0.4)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
    }}>{label}</button>
  )
}
