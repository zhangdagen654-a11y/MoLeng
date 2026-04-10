import client from './client'

export interface InboxItem {
  id: number
  content: string
  created_at: string
  status: string
  processed_date: string | null
}

export const inboxApi = {
  create: (content: string) => client.post<unknown, InboxItem>('/inbox', { content }),
  getPending: (date?: string) => client.get<unknown, InboxItem[]>('/inbox', { params: { date } }),
  delete: (id: number) => client.delete(`/inbox/${id}`),
}
