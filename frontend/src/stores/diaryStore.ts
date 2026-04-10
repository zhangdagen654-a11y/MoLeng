import { create } from 'zustand'
import { diaryApi, type DiaryItem } from '@/api/diary'

interface DiaryStore {
  diaries: DiaryItem[]
  current: DiaryItem | null
  loading: boolean
  fetchList: (startDate?: string, endDate?: string) => Promise<void>
  fetchByDate: (date: string) => Promise<void>
  create: (date: string, content: string) => Promise<void>
  update: (date: string, content: string) => Promise<void>
  confirm: (date: string) => Promise<void>
  merge: (date?: string, extraContent?: string) => Promise<string>
}

export const useDiaryStore = create<DiaryStore>((set) => ({
  diaries: [],
  current: null,
  loading: false,
  fetchList: async (startDate, endDate) => {
    set({ loading: true })
    try {
      const diaries = await diaryApi.getList(startDate, endDate)
      set({ diaries })
    } finally {
      set({ loading: false })
    }
  },
  fetchByDate: async (date) => {
    set({ loading: true })
    try {
      const diary = await diaryApi.getByDate(date)
      set({ current: diary })
    } catch {
      set({ current: null })
    } finally {
      set({ loading: false })
    }
  },
  create: async (date, content) => {
    await diaryApi.create(date, content)
  },
  update: async (date, content) => {
    const updated = await diaryApi.update(date, content)
    set({ current: updated })
  },
  confirm: async (date) => {
    await diaryApi.confirm(date)
  },
  merge: async (date, extraContent) => {
    const res = await diaryApi.merge(date, extraContent)
    return res.task_id
  },
}))
