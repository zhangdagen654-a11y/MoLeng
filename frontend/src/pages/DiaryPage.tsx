import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDiaryStore } from '@/stores/diaryStore'

export default function DiaryPage() {
  const { diaries, loading, fetchList } = useDiaryStore()

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const getStatusLabel = (diary: typeof diaries[0]) => {
    if (diary.confirmed) return { text: '已确认', color: 'bg-green-100 text-green-700' }
    return { text: '草稿', color: 'bg-yellow-100 text-yellow-700' }
  }

  if (loading) return <div className="p-4 text-center text-gray-400">加载中...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">日记</h2>
      {diaries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>还没有日记</p>
          <Link to="/" className="text-blue-500 text-sm mt-2 inline-block">去写一篇</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {diaries.map((diary) => {
            const status = getStatusLabel(diary)
            return (
              <Link
                key={diary.id}
                to={`/diary/${diary.date}`}
                className="block bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{diary.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{diary.content}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
