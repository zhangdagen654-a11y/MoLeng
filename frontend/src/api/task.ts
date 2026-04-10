import client from './client'

export interface TaskStatus {
  task_id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result: unknown
  error: string | null
  created_at: string
}

export const taskApi = {
  getStatus: (taskId: string) => client.get<unknown, TaskStatus>(`/tasks/${taskId}`),
}
