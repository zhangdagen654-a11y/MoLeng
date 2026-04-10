import { create } from 'zustand'
import { inboxApi, type InboxItem } from '@/api/inbox'
import { saveOfflineFragment, getOfflineFragments, type OfflineFragment } from '@/lib/offlineDb'

interface InboxStore {
  items: InboxItem[]
  offlineItems: OfflineFragment[]
  loading: boolean
  fetchPending: (date?: string) => Promise<void>
  fetchOffline: () => Promise<void>
  add: (content: string) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  items: [],
  offlineItems: [],
  loading: false,
  fetchPending: async (date) => {
    set({ loading: true })
    try {
      const items = await inboxApi.getPending(date)
      set({ items })
    } finally {
      set({ loading: false })
    }
  },
  fetchOffline: async () => {
    const offlineItems = await getOfflineFragments()
    set({ offlineItems })
  },
  add: async (content) => {
    if (navigator.onLine) {
      const item = await inboxApi.create(content)
      set({ items: [...get().items, item] })
    } else {
      const offline = await saveOfflineFragment(content)
      set({ offlineItems: [...get().offlineItems, offline] })
    }
  },
  remove: async (id) => {
    await inboxApi.delete(id)
    set({ items: get().items.filter((i) => i.id !== id) })
  },
}))
