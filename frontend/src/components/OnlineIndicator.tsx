import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function OnlineIndicator() {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-400'}`} />
      <span className="text-xs text-gray-400">{isOnline ? '在线' : '离线'}</span>
    </div>
  )
}
