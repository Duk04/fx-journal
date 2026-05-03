// Approximate USD pip-value per 1.00 lot (standard).
// For JPY pairs (quote = JPY) ~ 1000 / USDJPY  => ~9.1 at price ~110.
// For non-USD-quote pairs we use ~10 and accept slight inaccuracy.
const PIP_VALUES: Record<string, number> = {
  // Majors (USD quote)
  EURUSD: 10,
  GBPUSD: 10,
  AUDUSD: 10,
  NZDUSD: 10,
  // USD base
  USDJPY: 9.1,
  USDCHF: 11,
  USDCAD: 7.5,
  // JPY crosses
  EURJPY: 9.1,
  GBPJPY: 9.1,
  AUDJPY: 9.1,
  // Other crosses
  EURGBP: 13,
  EURAUD: 6.5,
  // Metals
  XAUUSD: 1,    // 1.00 = $1 per 0.01 move with 1 lot (varies by broker)
  XAGUSD: 50,
  // Crypto (approx — depends on broker contract size)
  BTCUSD: 1,
  ETHUSD: 1,
}

interface TradeForCalc {
  pair: string
  direction: string
  entryPrice: number
  exitPrice: number
  lotSize: number
  sl?: number | null
}

export function calcPnl(trade: TradeForCalc): number {
  const pipValue = PIP_VALUES[trade.pair] ?? 10
  const pips =
    trade.direction === 'BUY'
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice
  return pips * pipValue * trade.lotSize
}

export function calcRR(trade: TradeForCalc): number {
  if (!trade.sl) return 0
  const risk = Math.abs(trade.entryPrice - trade.sl)
  const reward = Math.abs(trade.exitPrice - trade.entryPrice)
  if (risk === 0) return 0
  return reward / risk
}
