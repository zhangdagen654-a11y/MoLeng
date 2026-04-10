import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReviewStore } from '@/stores/reviewStore'
import { reviewApi } from '@/api/review'
import { insightApi, type InsightCreateData } from '@/api/insight'
import { fetchSSE } from '@/api/stream'

interface InsightSuggestion {
  suggested_knowledge: string
  suggested_action: string | null
  suggested_related_insight_id: number | null
}

const ALLOWED_TAGS = ['成功', '失败', '认知迭代']
const tagColors: Record<string, string> = {
  '成功': 'bg-green-100 text-green-700',
  '失败': 'bg-red-100 text-red-700',
  '认知迭代': 'bg-purple-100 text-purple-700',
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { current, fetchById, update } = useReviewStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ event: '', decision: '', deviation: '', attribution: '', tags: [] as string[] })

  // AI 建议相关
  const [suggesting, setSuggesting] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [suggestion, setSuggestion] = useState<InsightSuggestion | null>(null)

  // 手写心得表单
  const [showInsightForm, setShowInsightForm] = useState(false)
  const [insightForm, setInsightForm] = useState({ knowledge: '', action: '' })
  const [submitting, setSubmitting] = useState(false)

  const reviewId = Number(id)

  useEffect(() => {
    if (reviewId) fetchById(reviewId)
  }, [reviewId, fetchById])

  useEffect(() => {
    if (current) {
      const tags = current.tags ? current.tags.split(',') : []
      setForm({
        event: current.event || '',
        decision: current.decision || '',
        deviation: current.deviation || '',
        attribution: current.attribution || '',
        tags,
      })
    }
  }, [current])

  const handleSave = async () => {
    await update(reviewId, { ...form, tags: form.tags.join(',') })
    setEditing(false)
  }

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleConfirm = async () => {
    if (!window.confirm('确认复盘后可获取 AI 心得建议，然后自己写心得。继续？')) return
    await reviewApi.confirm(reviewId)
    fetchById(reviewId)
  }

  const handleSuggestInsight = async () => {
    setSuggesting(true)
    setStreamText('')
    setSuggestion(null)
    await fetchSSE(`/reviews/${reviewId}/suggest-insight`, {}, {
      onToken: (text) => setStreamText((prev) => prev + text),
      onDone: (result) => {
        const res = result as { suggestion: InsightSuggestion }
        setSuggestion(res.suggestion)
        setSuggesting(false)
      },
      onError: (msg) => {
        alert('获取建议失败：' + msg)
        setSuggesting(false)
      },
    })
  }

  const openInsightForm = () => {
    setInsightForm({ knowledge: '', action: '' })
    setShowInsightForm(true)
  }

  const handleSubmitInsight = async () => {
    if (!insightForm.knowledge.trim()) return alert('请填写认知')
    setSubmitting(true)
    try {
      const data: InsightCreateData = {
        review_id: reviewId,
        knowledge: insightForm.knowledge,
        action: insightForm.action || null,
      }
      const insight = await insightApi.create(data)
      setShowInsightForm(false)
      navigate(`/insight/${insight.id}`)
    } catch {
      alert('创建心得失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!current) return <div className="p-4 text-center text-gray-400">加载中...</div>

  const tagList = current.tags ? current.tags.split(',') : []

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">复盘详情</h2>

      <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4">
        {/* 标签 */}
        <div className="flex gap-2 flex-wrap">
          {tagList.map((tag) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
          ))}
          {current.confirmed && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">已确认</span>}
        </div>

        {editing ? (
          <div className="space-y-3">
            {(['event', 'decision', 'deviation', 'attribution'] as const).map((field) => {
              const labels = { event: '事件', decision: '决策', deviation: '结果偏差', attribution: '归因' }
              return (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block">{labels[field]}</label>
                  <textarea
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
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
                      form.tags.includes(tag)
                        ? tagColors[tag] + ' border-current font-medium'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >{tag}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">保存</button>
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: '事件', value: current.event },
              { label: '决策', value: current.decision },
              { label: '结果偏差', value: current.deviation },
              { label: '归因', value: current.attribution },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm text-gray-700">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!current.confirmed && !editing && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => setEditing(true)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">编辑</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium">确认复盘</button>
        </div>
      )}

      {current.confirmed && !suggestion && !suggesting && (
        <div className="flex gap-2 mt-4">
          <button onClick={handleSuggestInsight} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium">获取 AI 心得建议</button>
          <button onClick={openInsightForm} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">直接写心得</button>
        </div>
      )}
      {/* AI 建议流式输出 */}
      {suggesting && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-purple-600 font-medium">AI 心得建议中</span>
            <span className="animate-pulse text-purple-400">...</span>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{streamText || '思考中...'}</pre>
        </div>
      )}

      {/* AI 建议结果 */}
      {suggestion && !suggesting && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-600">AI 心得建议（仅供参考）</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
            <p><span className="text-gray-400">建议认知：</span><span className="text-gray-500 italic">{suggestion.suggested_knowledge}</span></p>
            {suggestion.suggested_action && (
              <p><span className="text-gray-400">建议SOP：</span><span className="text-gray-500 italic">{suggestion.suggested_action}</span></p>
            )}
          </div>
          {!showInsightForm && (
            <button onClick={openInsightForm} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">写心得</button>
          )}
        </div>
      )}

      {/* 手写心得表单 */}
      {showInsightForm && (
        <div className="mt-4 bg-white border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">写心得</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">知（认知/道理，用自己的话写）</label>
              <textarea
                value={insightForm.knowledge}
                onChange={(e) => setInsightForm({ ...insightForm, knowledge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">行（SOP/可执行操作，可留空）</label>
              <textarea
                value={insightForm.action}
                onChange={(e) => setInsightForm({ ...insightForm, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmitInsight} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {submitting ? '提交中...' : '提交心得'}
              </button>
              <button onClick={() => setShowInsightForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
