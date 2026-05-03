'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { JournalEntry, Mood } from '@/types'
import { formatDate } from '@/lib/utils'
import { BookOpen, Send } from 'lucide-react'

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'confident', emoji: '💪', label: 'Confident' },
  { key: 'uncertain', emoji: '🤔', label: 'Uncertain' },
  { key: 'fearful',   emoji: '😰', label: 'Fearful' },
  { key: 'greedy',    emoji: '🤑', label: 'Greedy' },
]

const MOOD_STYLE: Record<string, { color: string; bg: string; border: string; borderL: string }> = {
  confident: { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', borderL: '#16a34a' },
  uncertain: { color: '#92400e', bg: '#fef3c7', border: '#fde68a', borderL: '#d97706' },
  fearful:   { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', borderL: '#dc2626' },
  greedy:    { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', borderL: '#7c3aed' },
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
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 740 }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Journal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 3 }}>Trading thoughts and reflections</p>
      </div>

      {/* Write */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={14} color="#64748b" />
          <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', fontWeight: 600, margin: 0 }}>New Entry</p>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your thoughts, lessons, market observations..."
          rows={4}
          className="input"
          style={{ resize: 'vertical', lineHeight: 1.7, minHeight: 100 }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {MOODS.map(({ key: m, emoji, label }) => {
              const s = MOOD_STYLE[m]
              const active = mood === m
              return (
                <button key={m} type="button" onClick={() => setMood(active ? '' : m)}
                  style={{
                    padding: '0.3rem 0.7rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                    background: active ? s.bg : '#f8fafc',
                    color: active ? s.color : '#64748b',
                    border: `1px solid ${active ? s.border : '#e2e8f0'}`,
                  }}>
                  {emoji} {label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => addEntry.mutate()}
            disabled={!content.trim() || addEntry.isPending}
            className="btn btn-primary"
            style={{ marginLeft: 'auto', opacity: content.trim() && !addEntry.isPending ? 1 : 0.4 }}
          >
            <Send size={13} />
            {addEntry.isPending ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <FilterBtn label="All" active={filterMood === ''} onClick={() => setFilterMood('')} />
        {MOODS.map(({ key: m, emoji, label }) => (
          <FilterBtn key={m} label={`${emoji} ${label}`} active={filterMood === m} onClick={() => setFilterMood(m)} color={MOOD_STYLE[m].color} activeBg={MOOD_STYLE[m].bg} activeBorder={MOOD_STYLE[m].border} />
        ))}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
            background: '#ede9fe', border: '1px solid #ddd6fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={20} color="#7c3aed" />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No journal entries yet. Write your first thought above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {entries.map(e => {
            const ms = e.mood ? MOOD_STYLE[e.mood] : null
            const moodData = e.mood ? MOODS.find(m => m.key === e.mood) : null
            return (
              <div key={e.id} className="card" style={{
                borderLeft: `3px solid ${ms ? ms.borderL : '#e2e8f0'}`,
                padding: '1rem 1.25rem',
              }}>
                <p style={{ color: '#1e293b', lineHeight: 1.75, marginBottom: 10, fontSize: '0.88rem' }}>{e.content}</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {e.mood && ms && moodData && (
                    <span style={{
                      padding: '0.18rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                      background: ms.bg, color: ms.color, border: `1px solid ${ms.border}`,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {moodData.emoji} {e.mood}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(e.createdAt)}</span>
                  {e.tradeId && (
                    <a href={`/trades/${e.tradeId}`} style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', marginLeft: 'auto', fontWeight: 500 }}>
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

function FilterBtn({ label, active, onClick, color, activeBg, activeBorder }: {
  label: string; active: boolean; onClick: () => void; color?: string; activeBg?: string; activeBorder?: string
}) {
  return (
    <button onClick={onClick} style={{
      padding: '0.32rem 0.85rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s',
      background: active ? (activeBg ?? '#eff6ff') : '#f8fafc',
      color: active ? (color ?? '#2563eb') : '#64748b',
      border: `1px solid ${active ? (activeBorder ?? '#bfdbfe') : '#e2e8f0'}`,
    }}>{label}</button>
  )
}
