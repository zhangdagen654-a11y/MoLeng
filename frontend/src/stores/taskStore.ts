import { create } from 'zustand'
import { taskApi, type TaskStatus } from '@/api/task'

interface TaskStore {
  tasks: Record<string, TaskStatus>
  poll: (taskId: string, onComplete?: (result: unknown) => void) => void
  stopPolling: (taskId: string) => void
}

const pollingTimers: Record<string, ReturnType<typeof setInterval>> = {}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  poll: (taskId, onComplete) => {
    const check = async () => {
      try {
        const status = await taskApi.getStatus(taskId)
        set({ tasks: { ...get().tasks, [taskId]: status } })
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollingTimers[taskId])
          delete pollingTimers[taskId]
          if (status.status === 'completed' && onComplete) {
            onComplete(status.result)
          }
        }
      } catch {
        clearInterval(pollingTimers[taskId])
        delete pollingTimers[taskId]
      }
    }
    check()
    pollingTimers[taskId] = setInterval(check, 2000)
  },
  stopPolling: (taskId) => {
    if (pollingTimers[taskId]) {
      clearInterval(pollingTimers[taskId])
      delete pollingTimers[taskId]
    }
  },
}))
