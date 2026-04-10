import client from './client'

export interface ReviewItem {
  id: number
  diary_id: number
  event: string | null
  decision: string | null
  deviation: string | null
  attribution: string | null
  tags: string | null
  confirmed: boolean
  created_at: string
  updated_at: string
}

export interface ReviewCreateData {
  diary_id: number
  event: string
  decision: string
  deviation: string
  attribution: string
  tags: string
}

export const reviewApi = {
  getList: (tag?: string) => client.get<unknown, ReviewItem[]>('/reviews', { params: { tag } }),
  getById: (id: number) => client.get<unknown, ReviewItem>(`/reviews/${id}`),
  create: (data: ReviewCreateData) => client.post<unknown, ReviewItem>('/reviews', data),
  update: (id: number, data: Partial<ReviewItem>) => client.put<unknown, ReviewItem>(`/reviews/${id}`, data),
  delete: (id: number) => client.delete(`/reviews/${id}`),
  confirm: (id: number) => client.post<unknown, { ok: boolean; review_id: number }>(`/reviews/${id}/confirm`),
}
