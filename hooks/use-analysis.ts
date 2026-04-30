import { useQuery } from '@tanstack/react-query'
import type { TradeAnalysis } from '@/types'

export function useAnalysis(tradeId: number, enabled = false) {
  return useQuery<TradeAnalysis>({
    queryKey: ['analysis', tradeId],
    queryFn: async () => {
      const res = await fetch(`/api/trades/${tradeId}/analysis`)
      if (!res.ok) throw new Error('Failed to fetch analysis')
      return res.json()
    },
    enabled,
  })
}
