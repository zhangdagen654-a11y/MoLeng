import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDiaryStore } from '@/stores/diaryStore'
import { diaryApi } from '@/api/diary'
import { reviewApi, type ReviewCreateData } from '@/api/review'
import { fetchSSE } from '@/api/stream'

interface Suggestion {
  event: string
  decision: string
  deviation: string
  suggested_attribution: string
  suggested_tags: string[]
  suggested_knowledge: string
  suggested_action: string | null
}

interface AnalysisResult {
  has_reviewable_events: boolean
  suggestions: Suggestion[]
}

const ALLOWED_TAGS = ['成功', '失败', '认知迭代']
const tagColors: Record<string, string> = {
  '成功': 'bg-green-100 text-green-700',
  '失败': 'bg-red-100 text-red-700',
  '认知迭代': 'bg-purple-100 text-purple-700',
}

export default function DiaryDetail() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { current, loading, fetchByDate, update } = useDiaryStore()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')

  // AI 分析相关
  const [analyzing, setAnalyzing] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  // 手写复盘表单
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    event: '', decision: '', deviation: '', attribution: '', tags: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (date) fetchByDate(date)
  }, [date, fetchByDate])

  useEffect(() => {
    if (current) setContent(current.content)
  }, [current])

  const handleSave = async () => {
    if (date) {
      await update(date, content)
      setEditing(false)
    }
  }

  const handleConfirm = async () => {
    if (!date) return
    if (!window.confirm('确认日记后可获取 AI 分析建议，然后自己写复盘。继续？')) return
    await diaryApi.confirm(date)
    fetchByDate(date)
  }

  const handleAnalyze = async () => {
    if (!date) return
    setAnalyzing(true)
    setStreamText('')
    setAnalysis(null)
    await fetchSSE(`/diary/${date}/analyze`, {}, {
      onToken: (text) => setStreamText((prev) => prev + text),
      onDone: (result) => {
        const res = result as { analysis: AnalysisResult }
        setAnalysis(res.analysis)
        setAnalyzing(false)
      },
      onError: (msg) => {
        alert('分析失败：' + msg)
        setAnalyzing(false)
      },
    })
  }

  const openReviewForm = (suggestion?: Suggestion) => {
    setReviewForm({
      event: suggestion?.event || '',
      decision: suggestion?.decision || '',
      deviation: suggestion?.deviation || '',
      attribution: '',
      tags: [],
    })
    setShowReviewForm(true)
  }

  const toggleTag = (tag: string) => {
    setReviewForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleSubmitReview = async () => {
    if (!current) return
    if (!reviewForm.event.trim()) return alert('请填写事件')
    setSubmitting(true)
    try {
      const data: ReviewCreateData = {
        diary_id: current.id,
        event: reviewForm.event,
        decision: reviewForm.decision,
        deviation: reviewForm.deviation,
        attribution: reviewForm.attribution,
        tags: reviewForm.tags.join(','),
      }
      await reviewApi.create(data)
      setShowReviewForm(false)
      navigate(`/trace/${date}`)
    } catch {
      alert('创建复盘失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4 text-center text-gray-400">加载中...</div>
  if (!current) return <div className="p-4 text-center text-gray-400">该日期没有日记</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">{current.date}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          current.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {current.confirmed ? '已确认' : '草稿'}
        </span>
      </div>

      {/* 日记内容 */}
      {editing ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">保存</button>
            <button onClick={() => { setEditing(false); setContent(current.content) }} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {current.content}
          </div>
          <div className="flex gap-2 mt-4">
            {!current.confirmed && (
              <>
                <button onClick={() => setEditing(true)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">编辑</button>
                <button onClick={handleConfirm} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium">确认日记</button>
              </>
            )}
            {current.confirmed && !analysis && !analyzing && (
              <button onClick={handleAnalyze} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium">获取 AI 分析建议</button>
            )}
            <button onClick={() => navigate(`/trace/${date}`)} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">查看溯源</button>
          </div>
        </div>
      )}

      {/* AI 分析流式输出 */}
      {analyzing && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-purple-600 font-medium">AI 分析建议中</span>
            <span className="animate-pulse text-purple-400">...</span>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{streamText || '思考中...'}</pre>
        </div>
      )}
      {/* AI 分析结果 */}
      {analysis && !analyzing && (
        <div className="mt-4 space-y-3">
          {!analysis.has_reviewable_events ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-500 mb-3">今天没有需要复盘的事件</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => openReviewForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">手动添加复盘</button>
                <button onClick={() => navigate(`/trace/${date}`)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">跳过</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">AI 分析建议（仅供参考）</h3>
                <button onClick={() => openReviewForm()} className="text-xs text-blue-600 px-3 py-1 border border-blue-200 rounded-full">手动添加复盘</button>
              </div>
              {analysis.suggestions.map((s, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">建议 #{idx + 1}</span>
                    {s.suggested_tags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-gray-400">事件：</span><span className="text-gray-700">{s.event}</span></p>
                    <p><span className="text-gray-400">决策：</span><span className="text-gray-700">{s.decision}</span></p>
                    <p><span className="text-gray-400">偏差：</span><span className="text-gray-700">{s.deviation}</span></p>
                    <p><span className="text-gray-400">建议归因：</span><span className="text-gray-500 italic">{s.suggested_attribution}</span></p>
                    <p><span className="text-gray-400">建议认知：</span><span className="text-gray-500 italic">{s.suggested_knowledge}</span></p>
                    {s.suggested_action && <p><span className="text-gray-400">建议SOP：</span><span className="text-gray-500 italic">{s.suggested_action}</span></p>}
                  </div>
                  <button onClick={() => openReviewForm(s)} className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">基于此写复盘</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* 手写复盘表单 */}
      {showReviewForm && (
        <div className="mt-4 bg-white border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">写复盘</h3>
          <div className="space-y-3">
            {(['event', 'decision', 'deviation', 'attribution'] as const).map((field) => {
              const labels = { event: '事件', decision: '决策', deviation: '结果偏差', attribution: '归因（用自己的话写）' }
              return (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block">{labels[field]}</label>
                  <textarea
                    value={reviewForm[field]}
                    onChange={(e) => setReviewForm({ ...reviewForm, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={field === 'attribution' ? 4 : 2}
                  />
                </div>
              )
            })}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标签</label>
              <div className="flex gap-2">
                {ALLOWED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      reviewForm.tags.includes(tag)
                        ? tagColors[tag] + ' border-current font-medium'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >{tag}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmitReview} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {submitting ? '提交中...' : '提交复盘'}
              </button>
              <button onClick={() => setShowReviewForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
