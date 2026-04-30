import Anthropic from '@anthropic-ai/sdk'
import type { Trade, JournalEntry, TradeAnalysis } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(): string {
  return `You are an expert FX trading coach and analyst. Analyze forex trades and provide actionable insights.

Focus on:
1. Trade setup quality (entry, exit, risk management)
2. Risk:Reward ratio assessment
3. Pattern recognition (breakout, trend, reversal, etc.)
4. Emotional/psychological factors based on notes and mood
5. Specific, actionable improvement suggestions

Always respond in JSON format with exactly these fields:
{
  "summary": "2-3 sentence overview of the trade",
  "patterns": ["pattern1", "pattern2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`
}

function buildTradeHistoryContext(recentTrades: Trade[]): string {
  if (recentTrades.length === 0) return 'No recent trade history available.'
  const summary = recentTrades.map((t) => ({
    pair: t.pair,
    direction: t.direction,
    pnl: t.pnl,
    rr: t.rr,
    tags: t.tags,
    result: t.pnl !== null ? (t.pnl >= 0 ? 'WIN' : 'LOSS') : 'OPEN',
  }))
  return `Recent trades context:\n${JSON.stringify(summary, null, 2)}`
}

function buildTradePrompt(trade: Trade, journalEntries: JournalEntry[]): string {
  return `Analyze this trade:
Pair: ${trade.pair}
Direction: ${trade.direction}
Entry: ${trade.entryPrice}
Exit: ${trade.exitPrice ?? 'Open'}
Lot Size: ${trade.lotSize}
SL: ${trade.sl ?? 'None'}
TP: ${trade.tp ?? 'None'}
P&L: ${trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : 'Open'}
R:R: ${trade.rr !== null ? trade.rr.toFixed(2) : 'N/A'}
Tags: ${trade.tags.join(', ') || 'None'}
Notes: ${trade.notes ?? 'None'}

Journal entries:
${journalEntries.length > 0 ? journalEntries.map((j) => `[${j.mood ?? 'no mood'}] ${j.content}`).join('\n') : 'None'}

Respond with JSON only.`
}

export async function analyzeTradeWithClaude(
  trade: Trade,
  journalEntries: JournalEntry[],
  recentTrades: Trade[],
  screenshotBase64?: string,
  screenshotMimeType?: string
): Promise<TradeAnalysis> {
  const systemPrompt = buildSystemPrompt()
  const tradeHistoryContext = buildTradeHistoryContext(recentTrades)
  const tradePrompt = buildTradePrompt(trade, journalEntries)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentBlocks: any[] = [
    { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: tradeHistoryContext, cache_control: { type: 'ephemeral' } },
  ]

  if (screenshotBase64 && screenshotMimeType) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: screenshotMimeType,
        data: screenshotBase64,
      },
    })
  }

  contentBlocks.push({ type: 'text', text: tradePrompt })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = JSON.parse(text)

  return {
    tradeId: trade.id,
    summary: parsed.summary ?? '',
    patterns: parsed.patterns ?? [],
    suggestions: parsed.suggestions ?? [],
    cachedAt: new Date().toISOString(),
  }
}
