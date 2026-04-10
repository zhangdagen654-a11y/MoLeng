import { create } from 'zustand'
import { insightApi, type InsightItem } from '@/api/insight'

interface InsightStore {
  insights: InsightItem[]
  current: InsightItem | null
  chain: InsightItem[]
  loading: boolean
  fetchList: (type?: string) => Promise<void>
  fetchById: (id: number) => Promise<void>
  fetchChain: (id: number) => Promise<void>
  update: (id: number, data: Partial<InsightItem>) => Promise<void>
  confirm: (id: number) => Promise<void>
}

export const useInsightStore = create<InsightStore>((set, get) => ({
  insights: [],
  current: null,
  chain: [],
  loading: false,
  fetchList: async (type) => {
    set({ loading: true })
    try {
      const insights = await insightApi.getList(type)
      set({ insights })
    } finally {
      set({ loading: false })
    }
  },
  fetchById: async (id) => {
    const insight = await insightApi.getById(id)
    set({ current: insight })
  },
  fetchChain: async (id) => {
    const chain = await insightApi.getChain(id)
    set({ chain })
  },
  update: async (id, data) => {
    const updated = await insightApi.update(id, data)
    set({
      current: updated,
      insights: get().insights.map((i) => (i.id === id ? updated : i)),
    })
  },
  confirm: async (id) => {
    const confirmed = await insightApi.confirm(id)
    set({
      current: confirmed,
      insights: get().insights.map((i) => (i.id === id ? confirmed : i)),
    })
  },
}))
