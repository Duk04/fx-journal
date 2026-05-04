'use client'
import { useState, useMemo } from 'react'
import { Copy, Check, Calculator } from 'lucide-react'

const PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD',
]

const PIP_SIZE: Record<string, number> = {
  EURUSD: 0.0001, GBPUSD: 0.0001, AUDUSD: 0.0001, NZDUSD: 0.0001,
  USDJPY: 0.01,   USDCHF: 0.0001, USDCAD: 0.0001,
  EURJPY: 0.01,   GBPJPY: 0.01,   AUDJPY: 0.01,
  EURGBP: 0.0001, EURAUD: 0.0001,
  XAUUSD: 0.1,    XAGUSD: 0.01,
  BTCUSD: 1,      ETHUSD: 0.1,
}

const PIP_VALUE: Record<string, number> = {
  EURUSD: 10,   GBPUSD: 10,   AUDUSD: 10,   NZDUSD: 10,
  USDJPY: 9.1,  USDCHF: 11,   USDCAD: 7.5,
  EURJPY: 9.1,  GBPJPY: 9.1,  AUDJPY: 9.1,
  EURGBP: 13,   EURAUD: 6.5,
  XAUUSD: 1,    XAGUSD: 50,
  BTCUSD: 1,    ETHUSD: 1,
}

const RISK_PRESETS = [0.5, 1, 1.5, 2, 3]
const BALANCE_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000]

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function LotSizePage() {
  const [pair, setPair] = useState('EURUSD')
  const [balance, setBalance] = useState('10000')
  const [riskPct, setRiskPct] = useState('1')
  const [mode, setMode] = useState<'price' | 'pips'>('price')
  const [entry, setEntry] = useState('')
  const [slPrice, setSlPrice] = useState('')
  const [slPipsInput, setSlPipsInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const bal = parseFloat(balance)
    const risk = parseFloat(riskPct)
    if (!bal || !risk || bal <= 0 || risk <= 0) return null

    const riskAmount = bal * risk / 100
    const pipValue = PIP_VALUE[pair] ?? 10
    const pipSize  = PIP_SIZE[pair]  ?? 0.0001

    let slPips: number
    if (mode === 'pips') {
      slPips = parseFloat(slPipsInput)
    } else {
      const e = parseFloat(entry)
      const s = parseFloat(slPrice)
      if (!e || !s || e <= 0 || s <= 0 || e === s) return null
      slPips = Math.abs(e - s) / pipSize
    }

    if (!slPips || slPips <= 0) return null

    const lotSize = riskAmount / (slPips * pipValue)

    return {
      lotSize,
      miniLots: lotSize * 10,
      microLots: lotSize * 100,
      riskAmount,
      slPips,
      pipValueAtLot: pipValue * lotSize,
    }
  }, [pair, balance, riskPct, mode, entry, slPrice, slPipsInput])

  function copyLot() {
    if (!result) return
    navigator.clipboard.writeText(result.lotSize.toFixed(2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const hasResult = result !== null

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(79,70,229,0.6))',
          border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(139,92,246,0.25)',
        }}>
          <Calculator size={18} color="#c4b5fd" strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Lot Size Calculator</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', marginTop: 2 }}>Risk-based position sizing</p>
        </div>
      </div>

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
                background: pair === p ? 'rgba(139,92,246,0.12)' : 'var(--bg-2)',
                color: pair === p ? '#c4b5fd' : 'var(--text-faint)',
                borderColor: pair === p ? 'rgba(139,92,246,0.3)' : 'var(--border)',
              }}>{p}</button>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* Account balance */}
        <div>
          <label style={labelStyle}>Account Balance (USD)</label>
          <input
            type="number" step="any" value={balance}
            onChange={e => setBalance(e.target.value)}
            className="input" placeholder="10000"
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {BALANCE_PRESETS.map(b => (
              <button key={b} type="button" onClick={() => setBalance(String(b))} style={{
                padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.7rem', fontWeight: 500,
                cursor: 'pointer', border: '1px solid',
                background: balance === String(b) ? 'rgba(139,92,246,0.12)' : 'var(--bg-2)',
                color: balance === String(b) ? '#c4b5fd' : 'var(--text-faint)',
                borderColor: balance === String(b) ? 'rgba(139,92,246,0.3)' : 'var(--border)',
              }}>
                {b >= 1000 ? `$${b / 1000}k` : `$${b}`}
              </button>
            ))}
          </div>
        </div>

        {/* Risk % */}
        <div>
          <label style={labelStyle}>Risk Per Trade</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number" step="0.1" min="0.1" max="100" value={riskPct}
              onChange={e => setRiskPct(e.target.value)}
              className="input" style={{ maxWidth: 120 }} placeholder="1"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>%</span>
            <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
              {RISK_PRESETS.map(r => (
                <button key={r} type="button" onClick={() => setRiskPct(String(r))} style={{
                  padding: '0.3rem 0.55rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: riskPct === String(r) ? 'rgba(139,92,246,0.12)' : 'var(--bg-2)',
                  color: riskPct === String(r) ? '#c4b5fd' : 'var(--text-faint)',
                  borderColor: riskPct === String(r) ? 'rgba(139,92,246,0.3)' : 'var(--border)',
                }}>{r}%</button>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* SL mode toggle */}
        <div>
          <label style={labelStyle}>Stop Loss Input</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
            {(['price', 'pips'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                padding: '0.38rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.12s',
                background: mode === m ? 'rgba(0,196,238,0.1)' : 'var(--bg-2)',
                color: mode === m ? 'var(--cyan)' : 'var(--text-faint)',
                borderColor: mode === m ? 'rgba(0,196,238,0.25)' : 'var(--border)',
              }}>{m === 'price' ? 'Price levels' : 'Pips directly'}</button>
            ))}
          </div>

          {mode === 'price' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={subLabelStyle}>Entry Price</label>
                <input type="number" step="any" value={entry}
                  onChange={e => setEntry(e.target.value)}
                  className="input" placeholder={pair.includes('JPY') ? '150.000' : '1.08500'} />
              </div>
              <div>
                <label style={subLabelStyle}>Stop Loss Price</label>
                <input type="number" step="any" value={slPrice}
                  onChange={e => setSlPrice(e.target.value)}
                  className="input" placeholder={pair.includes('JPY') ? '149.500' : '1.08000'} />
              </div>
            </div>
          ) : (
            <div>
              <label style={subLabelStyle}>Stop Loss (pips)</label>
              <input type="number" step="any" min="0.1" value={slPipsInput}
                onChange={e => setSlPipsInput(e.target.value)}
                className="input" style={{ maxWidth: 180 }} placeholder="20" />
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="card" style={{
        marginTop: '1rem',
        background: hasResult ? 'rgba(139,92,246,0.06)' : 'var(--surface)',
        borderColor: hasResult ? 'rgba(139,92,246,0.25)' : 'var(--border)',
      }}>
        {!hasResult ? (
          <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.875rem', margin: '0.5rem 0' }}>
            Fill in all fields above to see your position size.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Main result */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Recommended Lot Size
                </p>
                <p className="mono" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text)', margin: '4px 0 0', letterSpacing: '-0.03em' }}>
                  {result.lotSize.toFixed(2)}
                </p>
              </div>
              <button onClick={copyLot} className="btn btn-ghost" style={{ gap: 6 }}>
                {copied ? <Check size={14} color="var(--pos)" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <Stat label="Risk Amount" value={`$${fmt(result.riskAmount)}`} />
              <Stat label="SL Distance" value={`${fmt(result.slPips, 1)} pips`} />
              <Stat label="Pip Value" value={`$${fmt(result.pipValueAtLot, 2)}`} />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '0.6rem 0.85rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Mini lots</p>
                <p className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  {fmt(result.miniLots, 1)}
                </p>
              </div>
              <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '0.6rem 0.85rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Micro lots</p>
                <p className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  {fmt(result.microLots, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--text-faint)', fontSize: '0.72rem', textAlign: 'center', marginTop: '0.75rem' }}>
        Pip values are approximate. Verify with your broker&apos;s contract specs.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{label}</p>
      <p className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: '4px 0 0' }}>{value}</p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
}

const subLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: 'var(--text-faint)', marginBottom: 5, letterSpacing: '0.02em',
}
