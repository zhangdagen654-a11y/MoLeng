import client from './client'

export interface StatsData {
  review_count: number
  insight_count: number
  tag_distribution: Record<string, number>
  daily_counts: Array<{ date: string; reviews: number; insights: number }>
}

export const statsApi = {
  get: (period: string = 'week') =>
    client.get<unknown, StatsData>('/stats', { params: { period } }),
}
