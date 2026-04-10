import { useCallback, useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'

export function useTaskPolling(taskId: string | null, onComplete?: (result: unknown) => void) {
  const { tasks, poll, stopPolling } = useTaskStore()

  useEffect(() => {
    if (!taskId) return
    poll(taskId, onComplete)
    return () => stopPolling(taskId)
  }, [taskId, onComplete, poll, stopPolling])

  const task = taskId ? tasks[taskId] : null
  const isLoading = task?.status === 'pending' || task?.status === 'running'
  const isCompleted = task?.status === 'completed'
  const isFailed = task?.status === 'failed'

  return { task, isLoading, isCompleted, isFailed }
}
