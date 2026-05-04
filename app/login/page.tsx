'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) { setError('Invalid username or password'); return }
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
    }}>
      {/* Decorative background rings */}
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        borderRadius: '50%',
        border: '1px solid rgba(0,196,238,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 400,
        borderRadius: '50%',
        border: '1px solid rgba(0,196,238,0.09)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }} className="fade-in">

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #00c4ee, #0ea5c9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(0,196,238,0.35), 0 0 64px rgba(0,196,238,0.15)',
          }}>
            <TrendingUp size={26} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.75rem', fontWeight: 800,
            letterSpacing: '-0.03em', color: '#e2eaf2', margin: 0,
          }}>
            FX Journal
          </h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', marginTop: 6 }}>
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{
          background: 'rgba(14,21,32,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(0,196,238,0.2)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,196,238,0.06)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Username</label>
              <input
                type="text" required autoFocus autoComplete="username"
                value={username} onChange={e => setUsername(e.target.value)}
                className="input" placeholder="trader1"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="••••••••"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-faint)', display: 'flex', alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                fontSize: '0.8rem', color: 'var(--neg)',
                background: 'rgba(255,53,83,0.08)',
                border: '1px solid rgba(255,53,83,0.2)',
                borderRadius: 6, padding: '0.5rem 0.75rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', padding: '0.65rem', fontSize: '0.875rem', marginTop: 4, opacity: loading ? 0.65 : 1 }}
            >
              <LogIn size={15} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          FX Trading Journal · AI-powered analysis
        </p>
      </div>
    </div>
  )
}
