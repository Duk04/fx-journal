export type Direction = 'BUY' | 'SELL'
export type TradePair =
  | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'USDCHF' | 'USDCAD' | 'AUDUSD' | 'NZDUSD'
  | 'EURJPY' | 'GBPJPY' | 'EURGBP' | 'AUDJPY' | 'EURAUD'
  | 'XAUUSD' | 'XAGUSD' | 'BTCUSD' | 'ETHUSD'
  | string
export type Mood = 'confident' | 'uncertain' | 'fearful' | 'greedy'

export interface Trade {
  id: number
  pair: TradePair
  direction: Direction
  entryPrice: number
  exitPrice: number | null
  lotSize: number
  sl: number | null
  tp: number | null
  openedAt: string
  closedAt: string | null
  pnl: number | null
  rr: number | null
  notes: string | null
  plan: string | null
  tags: string[]
  screenshotUrl: string | null
  createdAt: string
}

export interface JournalEntry {
  id: number
  tradeId: number | null
  content: string
  mood: Mood | null
  createdAt: string
}

export interface TradeAnalysis {
  tradeId: number
  summary: string
  patterns: string[]
  suggestions: string[]
  cachedAt: string
}

export interface Stats {
  totalTrades: number
  winRate: number
  totalPnl: number
  avgRR: number
  maxDrawdown: number
  profitFactor: number
  expectancy: number
  avgWin: number
  avgLoss: number
  bestTrade: Trade | null
  worstTrade: Trade | null
  streaks: { current: number; best: number }
}

export interface PairStats {
  pair: TradePair
  totalTrades: number
  winRate: number
  totalPnl: number
  avgRR: number
}

export interface MonthlyStats {
  month: string
  totalTrades: number
  winRate: number
  totalPnl: number
}

export interface TagStats {
  tag: string
  totalTrades: number
  winRate: number
  totalPnl: number
}

export interface SessionStats {
  session: string
  totalTrades: number
  winRate: number
  totalPnl: number
  avgRR: number
}

export interface HourlyStats {
  hour: number
  totalTrades: number
  winRate: number
  totalPnl: number
}

export interface DailyPnl {
  date: string
  pnl: number
  trades: number
}

export interface TradeTemplate {
  id: number
  name: string
  pair: string
  direction: string
  lotSize: number | null
  sl: number | null
  tp: number | null
  tags: string[]
  notes: string | null
  createdAt: string
}
