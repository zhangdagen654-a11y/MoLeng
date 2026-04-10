import { Link } from 'react-router-dom'

interface TimelineItem {
  id: number
  knowledge: string | null
  action: string | null
  created_at: string
}

interface Props {
  chain: TimelineItem[]
  currentId?: number
  compact?: boolean
}

export default function InsightTimeline({ chain, currentId, compact = false }: Props) {
  if (chain.length <= 1 && compact) return null

  return (
    <div className="relative">
      {/* 垂直线 */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {chain.map((item, idx) => {
          const isCurrent = item.id === currentId
          return (
            <div key={item.id} className="relative flex items-start gap-3">
              {/* 圆点 */}
              <div className={`relative z-10 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 ${
                isCurrent
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {idx + 1}
              </div>

              {/* 内容 */}
              <Link
                to={`/insight/${item.id}`}
                className={`flex-1 rounded-lg p-3 transition-colors ${
                  compact ? 'p-2' : 'p-3'
                } ${
                  isCurrent
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-white border border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                    v{idx + 1}
                  </span>
                  <span className="text-xs text-gray-400">{item.created_at?.split('T')[0]}</span>
                  {isCurrent && <span className="text-xs text-blue-600">当前</span>}
                </div>
                <p className={`text-gray-700 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {item.knowledge || '—'}
                </p>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
