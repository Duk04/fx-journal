import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TradeTemplate } from '@/types'

export function useTemplates() {
  return useQuery<TradeTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => (await fetch('/api/templates')).json(),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TradeTemplate> & { name: string }) => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create template')
      return res.json() as Promise<TradeTemplate>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete template')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}
