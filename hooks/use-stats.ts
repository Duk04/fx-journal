import { useQuery } from '@tanstack/react-query'
import type { Stats, PairStats, MonthlyStats, TagStats } from '@/types'

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })
}

export function usePairStats() {
  return useQuery<PairStats[]>({
    queryKey: ['stats', 'pairs'],
    queryFn: async () => {
      const res = await fetch('/api/stats/pairs')
      if (!res.ok) throw new Error('Failed to fetch pair stats')
      return res.json()
    },
  })
}

export function useMonthlyStats() {
  return useQuery<MonthlyStats[]>({
    queryKey: ['stats', 'monthly'],
    queryFn: async () => {
      const res = await fetch('/api/stats/monthly')
      if (!res.ok) throw new Error('Failed to fetch monthly stats')
      return res.json()
    },
  })
}

export function useTagStats() {
  return useQuery<TagStats[]>({
    queryKey: ['stats', 'tags'],
    queryFn: async () => {
      const res = await fetch('/api/stats/tags')
      if (!res.ok) throw new Error('Failed to fetch tag stats')
      return res.json()
    },
  })
}
