import { create } from 'zustand'
import { reviewApi, type ReviewItem } from '@/api/review'

interface ReviewStore {
  reviews: ReviewItem[]
  current: ReviewItem | null
  loading: boolean
  fetchList: (tag?: string) => Promise<void>
  fetchById: (id: number) => Promise<void>
  update: (id: number, data: Partial<ReviewItem>) => Promise<void>
  remove: (id: number) => Promise<void>
  confirm: (id: number) => Promise<void>
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  current: null,
  loading: false,
  fetchList: async (tag) => {
    set({ loading: true })
    try {
      const reviews = await reviewApi.getList(tag)
      set({ reviews })
    } finally {
      set({ loading: false })
    }
  },
  fetchById: async (id) => {
    const review = await reviewApi.getById(id)
    set({ current: review })
  },
  update: async (id, data) => {
    const updated = await reviewApi.update(id, data)
    set({
      current: updated,
      reviews: get().reviews.map((r) => (r.id === id ? updated : r)),
    })
  },
  remove: async (id) => {
    await reviewApi.delete(id)
    set({ reviews: get().reviews.filter((r) => r.id !== id) })
  },
  confirm: async (id) => {
    await reviewApi.confirm(id)
  },
}))
