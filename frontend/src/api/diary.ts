import client from './client'

export interface DiaryItem {
  id: number
  date: string
  content: string
  source: string | null
  confirmed: boolean
  created_at: string
  updated_at: string
}

export const diaryApi = {
  getList: (startDate?: string, endDate?: string) =>
    client.get<unknown, DiaryItem[]>('/diary', { params: { start_date: startDate, end_date: endDate } }),
  getByDate: (date: string) => client.get<unknown, DiaryItem>(`/diary/${date}`),
  create: (date: string, content: string, source = 'manual') =>
    client.post<unknown, DiaryItem>('/diary', { date, content, source }),
  update: (date: string, content: string) => client.put<unknown, DiaryItem>(`/diary/${date}`, { content }),
  confirm: (date: string) => client.post<unknown, { ok: boolean; date: string }>(`/diary/${date}/confirm`),
  merge: (date?: string, extraContent?: string) =>
    client.post<unknown, { task_id: string }>('/diary/merge', { date, extra_content: extraContent }),
}
