import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Trade } from '@/types'

async function fetchTrades(params?: Record<string, string>): Promise<Trade[]> {
  const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`/api/trades${qs}`)
  if (!res.ok) throw new Error('Failed to fetch trades')
  return res.json()
}

async function fetchTrade(id: number): Promise<Trade> {
  const res = await fetch(`/api/trades/${id}`)
  if (!res.ok) throw new Error('Failed to fetch trade')
  return res.json()
}

export function useTrades(params?: Record<string, string>) {
  return useQuery({ queryKey: ['trades', params], queryFn: () => fetchTrades(params) })
}

export function useTrade(id: number) {
  return useQuery({ queryKey: ['trade', id], queryFn: () => fetchTrade(id) })
}

export function useCreateTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Trade>) => {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create trade')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  })
}

export function useUpdateTrade(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Trade>) => {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update trade')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] })
      qc.invalidateQueries({ queryKey: ['trade', id] })
    },
  })
}

export function useDeleteTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete trade')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  })
}
