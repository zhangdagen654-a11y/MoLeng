import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '@/api/client'

interface TraceData {
  diary: {
    id: number
    date: string
    content: string
    confirmed: boolean
  }
  reviews: Array<{
    id: number
    event: string
    decision: string
    deviation: string
    attribution: string
    tags: string
    confirmed: boolean
    insights: Array<{
      id: number
      knowledge: string
      action: string
      confirmed: boolean
    }>
  }>
}

export default function TracePage() {
  const { date } = useParams<{ date: string }>()
  const [data, setData] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!date) return
    setLoading(true)
    client.get<unknown, TraceData>(`/trace/${date}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [date])

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  if (loading) return <div className="p-4 text-center text-gray-400">加载中...</div>
  if (!data) return <div className="p-4 text-center text-gray-400">该日期没有数据</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">溯源视图 - {date}</h2>

      {/* 第一层：日记 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">日记</span>
          <Link to={`/diary/${date}`} className="text-xs text-blue-600">查看详情</Link>
        </div>
        <p className="text-sm text-gray-700 line-clamp-3">{data.diary.content}</p>
      </div>

      {/* 第二层：复盘 */}
      {data.reviews.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">暂无复盘</div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review, idx) => {
            const rKey = `r-${review.id}`
            const tags = review.tags ? review.tags.split(',') : []
            const tagColors: Record<string, string> = {
              '成功': 'bg-green-100 text-green-700',
              '失败': 'bg-red-100 text-red-700',
              '认知迭代': 'bg-purple-100 text-purple-700',
            }
            return (
              <div key={review.id}>
                <div
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer"
                  onClick={() => toggle(rKey)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-yellow-800">复盘 #{idx + 1}</span>
                    {tags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                    ))}
                    <Link to={`/review/${review.id}`} className="text-xs text-blue-600 ml-auto" onClick={(e) => e.stopPropagation()}>编辑</Link>
                  </div>
                  <p className="text-sm text-gray-700">{review.event}</p>
                  {expanded[rKey] && (
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p><span className="text-gray-400">决策：</span>{review.decision}</p>
                      <p><span className="text-gray-400">偏差：</span>{review.deviation}</p>
                      <p><span className="text-gray-400">归因：</span>{review.attribution}</p>
                    </div>
                  )}
                </div>

                {/* 第三层：心得 */}
                {review.insights.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {review.insights.map((insight) => (
                      <Link
                        key={insight.id}
                        to={`/insight/${insight.id}`}
                        className="block bg-green-50 border border-green-200 rounded-lg p-3 hover:border-green-300 transition-colors"
                      >
                        <span className="text-xs font-medium text-green-800 mb-1 block">心得</span>
                        <p className="text-sm text-gray-700"><span className="text-gray-400">知：</span>{insight.knowledge}</p>
                        {insight.action && (
                          <p className="text-sm text-gray-700 mt-1"><span className="text-gray-400">行：</span>{insight.action}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
