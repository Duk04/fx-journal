import { useQuery } from '@tanstack/react-query'
import type { Stats, PairStats, MonthlyStats, TagStats, SessionStats, HourlyStats, DailyPnl } from '@/types'

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
    queryFn: async () => (await fetch('/api/stats/pairs')).json(),
  })
}

export function useMonthlyStats() {
  return useQuery<MonthlyStats[]>({
    queryKey: ['stats', 'monthly'],
    queryFn: async () => (await fetch('/api/stats/monthly')).json(),
  })
}

export function useTagStats() {
  return useQuery<TagStats[]>({
    queryKey: ['stats', 'tags'],
    queryFn: async () => (await fetch('/api/stats/tags')).json(),
  })
}

export function useSessionStats() {
  return useQuery<SessionStats[]>({
    queryKey: ['stats', 'sessions'],
    queryFn: async () => (await fetch('/api/stats/sessions')).json(),
  })
}

export function useHourlyStats() {
  return useQuery<(HourlyStats & { label: string })[]>({
    queryKey: ['stats', 'hourly'],
    queryFn: async () => (await fetch('/api/stats/hourly')).json(),
  })
}

export function useDailyStats() {
  return useQuery<DailyPnl[]>({
    queryKey: ['stats', 'daily'],
    queryFn: async () => (await fetch('/api/stats/daily')).json(),
  })
}
