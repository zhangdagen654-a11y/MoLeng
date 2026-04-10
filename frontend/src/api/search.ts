import client from './client'

export interface SearchResult {
  source_type: string
  source_id: string
  title_snippet: string
  body_snippet: string
  rank: number
}

export const searchApi = {
  search: (q: string, type?: string, limit = 20, offset = 0) =>
    client.get<unknown, SearchResult[]>('/search', { params: { q, type, limit, offset } }),
}
