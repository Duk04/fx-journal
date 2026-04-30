const PIP_VALUES: Record<string, number> = {
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 9.1,
  XAUUSD: 1,
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
