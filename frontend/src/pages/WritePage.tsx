import { useState, useEffect, useCallback } from 'react'
import { useInboxStore } from '@/stores/inboxStore'
import { useDiaryStore } from '@/stores/diaryStore'
import { fetchSSE } from '@/api/stream'
import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export default function WritePage() {
  const [mode, setMode] = useState<'quick' | 'diary'>('quick')
  const [input, setInput] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const navigate = useNavigate()

  const { items, offlineItems, fetchPending, fetchOffline, add, remove } = useInboxStore()
  const { create: createDiary } = useDiaryStore()
  const isOnline = useOnlineStatus()

  const today = new Date().toISOString().split('T')[0]

  const onSynced = useCallback(() => {
    fetchPending()
    fetchOffline()
  }, [fetchPending, fetchOffline])

  useOfflineSync(onSynced)

  useEffect(() => {
    fetchPending()
    fetchOffline()
  }, [fetchPending, fetchOffline])

  const handleQuickAdd = async () => {
    if (!input.trim()) return
    await add(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'quick') {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  const handleMerge = async () => {
    setStreaming(true)
    setStreamText('')
    await fetchSSE('/diary/merge', { body: { date: today } }, {
      onToken: (text) => setStreamText((prev) => prev + text),
      onDone: () => {
        setTimeout(() => navigate(`/diary/${today}`), 1500)
      },
      onError: (msg) => {
        alert('整合失败：' + msg)
        setStreaming(false)
      },
    })
  }

  const handleSaveDiary = async () => {
    if (!diaryContent.trim()) return
    try {
      await createDiary(today, diaryContent.trim())
      navigate(`/diary/${today}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 模式切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('quick')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          随手记
        </button>
        <button
          onClick={() => setMode('diary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'diary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          写日记
        </button>
      </div>

      {/* 随手记模式 */}
      {mode === 'quick' && (
        <>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="记下此刻的想法..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <button
              onClick={handleQuickAdd}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              发送
            </button>
          </div>

          {/* 流式输出区域 */}
          {streaming && (
            <div className="mb-4 bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-blue-600 font-medium">AI 整合中</span>
                <span className="animate-pulse text-blue-400">...</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{streamText || '思考中...'}</p>
            </div>
          )}

          {/* 碎片列表 */}
          {!streaming && (items.length > 0 || offlineItems.length > 0) && (
            <div className="space-y-2 mb-4">
              <h3 className="text-sm text-gray-500 mb-2">今日碎片 ({items.length + offlineItems.length})</h3>
              {offlineItems.map((item) => (
                <div key={`offline-${item.id}`} className="flex items-start justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700 flex-1">{item.content}</p>
                  <span className="ml-2 text-xs text-yellow-600 whitespace-nowrap">待同步</span>
                </div>
              ))}
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 flex-1">{item.content}</p>
                  <button
                    onClick={() => remove(item.id)}
                    className="ml-2 text-gray-300 hover:text-red-400 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {isOnline && items.length > 0 && (
                <button
                  onClick={handleMerge}
                  className="w-full mt-3 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  整合成日记
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 写日记模式 */}
      {mode === 'diary' && (
        <div>
          <textarea
            value={diaryContent}
            onChange={(e) => setDiaryContent(e.target.value)}
            placeholder="写下今天的日记..."
            className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            autoFocus
          />
          <button
            onClick={handleSaveDiary}
            className="w-full mt-3 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            保存日记
          </button>
        </div>
      )}
    </div>
  )
}
