import { useEffect, useRef } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { getOfflineFragments, removeOfflineFragment } from '@/lib/offlineDb'
import { inboxApi } from '@/api/inbox'

export function useOfflineSync(onSynced?: () => void) {
  const isOnline = useOnlineStatus()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline || syncingRef.current) return

    const sync = async () => {
      syncingRef.current = true
      try {
        const fragments = await getOfflineFragments()
        for (const f of fragments) {
          try {
            await inboxApi.create(f.content)
            if (f.id) await removeOfflineFragment(f.id)
          } catch {
            // 同步失败，保留等下次
            break
          }
        }
        if (fragments.length > 0) onSynced?.()
      } finally {
        syncingRef.current = false
      }
    }

    sync()
  }, [isOnline, onSynced])
}
