import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useInsightStore } from '@/stores/insightStore'
import InsightTimeline from '@/components/InsightTimeline'

export default function InsightPage() {
  const { id } = useParams<{ id: string }>()
  const { current, chain, fetchById, fetchChain, update, confirm } = useInsightStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ knowledge: '', action: '' })

  const insightId = Number(id)

  useEffect(() => {
    if (insightId) {
      fetchById(insightId)
      fetchChain(insightId)
    }
  }, [insightId, fetchById, fetchChain])

  useEffect(() => {
    if (current) {
      setForm({ knowledge: current.knowledge || '', action: current.action || '' })
    }
  }, [current])

  const handleSave = async () => {
    await update(insightId, form)
    setEditing(false)
  }

  const handleConfirm = async () => {
    if (!window.confirm('确认心得后将存入数据库。继续？')) return
    await confirm(insightId)
  }

  if (!current) return <div className="p-4 text-center text-gray-400">加载中...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">心得终审</h2>

      <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4">
        {current.confirmed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">已入库</span>
        )}

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">知（认知/道理）</label>
              <textarea
                value={form.knowledge}
                onChange={(e) => setForm({ ...form, knowledge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">行（SOP/可执行操作）</label>
              <textarea
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="如果没有可执行的 SOP，可留空"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">保存</button>
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">知</p>
              <p className="text-sm text-gray-700">{current.knowledge || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">行</p>
              <p className="text-sm text-gray-700">{current.action || '（无 SOP）'}</p>
            </div>
          </div>
        )}
      </div>

      {!current.confirmed && !editing && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => setEditing(true)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">编辑</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium">确认入库</button>
        </div>
      )}

      {/* 迭代链 */}
      {chain.length > 1 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">认知迭代链</h3>
          <InsightTimeline chain={chain} currentId={insightId} />
        </div>
      )}
    </div>
  )
}
