import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReviewStore } from '@/stores/reviewStore'
import { useInsightStore } from '@/stores/insightStore'
import { insightApi, type InsightItem } from '@/api/insight'
import InsightTimeline from '@/components/InsightTimeline'

type Tab = 'reviews' | 'knowledge' | 'action'

const TAG_FILTERS = ['全部', '成功', '失败', '认知迭代']

export default function DatabasePage() {
  const [tab, setTab] = useState<Tab>('reviews')
  const [tagFilter, setTagFilter] = useState('全部')
  const [expandedChain, setExpandedChain] = useState<Record<number, InsightItem[]>>({})

  const { reviews, loading: reviewLoading, fetchList: fetchReviews } = useReviewStore()
  const { insights, loading: insightLoading, fetchList: fetchInsights } = useInsightStore()

  useEffect(() => {
    if (tab === 'reviews') {
      fetchReviews(tagFilter === '全部' ? undefined : tagFilter)
    } else if (tab === 'knowledge') {
      fetchInsights('knowledge')
    } else {
      fetchInsights('action')
    }
  }, [tab, tagFilter, fetchReviews, fetchInsights])

  const tagColors: Record<string, string> = {
    '成功': 'bg-green-100 text-green-700',
    '失败': 'bg-red-100 text-red-700',
    '认知迭代': 'bg-purple-100 text-purple-700',
  }

  const loading = tab === 'reviews' ? reviewLoading : insightLoading

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">数据库</h2>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
        {([
          { key: 'reviews' as Tab, label: '复盘库' },
          { key: 'knowledge' as Tab, label: '心得（知）' },
          { key: 'action' as Tab, label: '心得（行）' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              tab === t.key ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 标签筛选（仅复盘库） */}
      {tab === 'reviews' && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TAG_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                tagFilter === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-center py-8 text-gray-400">加载中...</div>}

      {/* 复盘列表 */}
      {tab === 'reviews' && !loading && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无复盘记录</div>
          ) : (
            reviews.map((r) => {
              const tags = r.tags ? r.tags.split(',') : []
              return (
                <Link
                  key={r.id}
                  to={`/review/${r.id}`}
                  className="block bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {tags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}>
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400 ml-auto">{r.created_at?.split('T')[0]}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{r.event}</p>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* 心得列表 */}
      {(tab === 'knowledge' || tab === 'action') && !loading && (
        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无心得记录</div>
          ) : (
            insights.map((i) => (
              <div key={i.id}>
                <Link
                  to={`/insight/${i.id}`}
                  className="block bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{i.created_at?.split('T')[0]}</span>
                    {i.related_insight_id && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          if (expandedChain[i.id]) {
                            setExpandedChain((prev) => { const next = { ...prev }; delete next[i.id]; return next })
                          } else {
                            insightApi.getChain(i.id).then((chain) => setExpandedChain((prev) => ({ ...prev, [i.id]: chain })))
                          }
                        }}
                        className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        {expandedChain[i.id] ? '收起迭代' : '有迭代'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {tab === 'knowledge' ? i.knowledge : i.action}
                  </p>
                </Link>
                {expandedChain[i.id] && (
                  <div className="ml-4 mt-2 mb-1">
                    <InsightTimeline chain={expandedChain[i.id]} currentId={i.id} compact />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
