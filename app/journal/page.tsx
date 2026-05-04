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
  confident: { color: 'var(--pos)',    bg: 'rgba(0,212,133,0.08)',   border: 'rgba(0,212,133,0.2)',   borderL: 'var(--pos)' },
  uncertain: { color: 'var(--amber)',  bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.2)',  borderL: 'var(--amber)' },
  fearful:   { color: 'var(--neg)',    bg: 'rgba(255,53,83,0.08)',   border: 'rgba(255,53,83,0.2)',   borderL: 'var(--neg)' },
  greedy:    { color: 'var(--purple)', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  borderL: 'var(--purple)' },
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
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Journal</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', marginTop: 3 }}>Trading thoughts and reflections</p>
      </div>

      {/* Write */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={14} color="var(--text-faint)" />
          <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', fontWeight: 600, margin: 0 }}>New Entry</p>
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
                    background: active ? s.bg : 'var(--bg-2)',
                    color: active ? s.color : 'var(--text-faint)',
                    border: `1px solid ${active ? s.border : 'var(--border)'}`,
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
          <FilterBtn key={m} label={`${emoji} ${label}`} active={filterMood === m} onClick={() => setFilterMood(m)}
            color={MOOD_STYLE[m].color} activeBg={MOOD_STYLE[m].bg} activeBorder={MOOD_STYLE[m].border} />
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
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={20} color="var(--purple)" />
          </div>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>No journal entries yet. Write your first thought above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {entries.map(e => {
            const ms = e.mood ? MOOD_STYLE[e.mood] : null
            const moodData = e.mood ? MOODS.find(m => m.key === e.mood) : null
            return (
              <div key={e.id} className="card" style={{
                borderLeft: `3px solid ${ms ? ms.borderL : 'var(--border-mid)'}`,
                padding: '1rem 1.25rem',
              }}>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 10, fontSize: '0.88rem' }}>{e.content}</p>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{formatDate(e.createdAt)}</span>
                  {e.tradeId && (
                    <a href={`/trades/${e.tradeId}`} style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none', marginLeft: 'auto', fontWeight: 500 }}>
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
      background: active ? (activeBg ?? 'rgba(0,196,238,0.1)') : 'var(--bg-2)',
      color: active ? (color ?? 'var(--cyan)') : 'var(--text-faint)',
      border: `1px solid ${active ? (activeBorder ?? 'rgba(0,196,238,0.25)') : 'var(--border)'}`,
    }}>{label}</button>
  )
}
