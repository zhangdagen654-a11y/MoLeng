import { create } from 'zustand'
import { searchApi, type SearchResult } from '@/api/search'

interface SearchStore {
  query: string
  type: string | undefined
  results: SearchResult[]
  loading: boolean
  setQuery: (q: string) => void
  setType: (t: string | undefined) => void
  search: () => Promise<void>
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  type: undefined,
  results: [],
  loading: false,
  setQuery: (q) => set({ query: q }),
  setType: (t) => set({ type: t }),
  search: async () => {
    const { query, type } = get()
    if (!query.trim()) {
      set({ results: [] })
      return
    }
    set({ loading: true })
    try {
      const results = await searchApi.search(query.trim(), type)
      set({ results })
    } finally {
      set({ loading: false })
    }
  },
}))
