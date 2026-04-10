import client from './client'

export interface InsightItem {
  id: number
  review_id: number
  knowledge: string | null
  action: string | null
  related_insight_id: number | null
  confirmed: boolean
  created_at: string
  updated_at: string
}

export interface InsightCreateData {
  review_id: number
  knowledge: string
  action?: string | null
}

export const insightApi = {
  getList: (type?: string) => client.get<unknown, InsightItem[]>('/insights', { params: { type } }),
  getById: (id: number) => client.get<unknown, InsightItem>(`/insights/${id}`),
  getChain: (id: number) => client.get<unknown, InsightItem[]>(`/insights/${id}/chain`),
  create: (data: InsightCreateData) => client.post<unknown, InsightItem>('/insights', data),
  update: (id: number, data: Partial<InsightItem>) => client.put<unknown, InsightItem>(`/insights/${id}`, data),
  confirm: (id: number) => client.post<unknown, InsightItem>(`/insights/${id}/confirm`),
}
