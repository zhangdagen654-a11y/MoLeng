import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSearchStore } from '@/stores/searchStore'

const TYPE_TABS = [
  { key: undefined, label: '全部' },
  { key: 'diary', label: '日记' },
  { key: 'review', label: '复盘' },
  { key: 'insight', label: '心得' },
] as const

const TYPE_ICONS: Record<string, string> = {
  diary: '📖',
  review: '🔄',
  insight: '💡',
}

function getLink(type: string, id: string) {
  if (type === 'diary') return `/diary/${id}`
  if (type === 'review') return `/review/${id}`
  return `/insight/${id}`
}

export default function SearchPage() {
  const { query, type, results, loading, setQuery, setType, search } = useSearchStore()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { search() }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query, type, search])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">搜索</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入关键词搜索..."
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
      />

      {/* 类型筛选 */}
      <div className="flex gap-2 mb-4">
        {TYPE_TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setType(t.key)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              type === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-400">搜索中...</div>}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">没有找到相关结果</div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, idx) => (
            <Link
              key={idx}
              to={getLink(r.source_type, r.source_id)}
              className="block bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{TYPE_ICONS[r.source_type] || '📄'}</span>
                <span className="text-xs text-gray-400">{r.source_type === 'diary' ? '日记' : r.source_type === 'review' ? '复盘' : '心得'}</span>
              </div>
              <p
                className="text-sm text-gray-700 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: r.body_snippet }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
