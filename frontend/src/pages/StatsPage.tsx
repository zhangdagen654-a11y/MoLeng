import { useEffect, useState } from 'react'
import { statsApi, type StatsData } from '@/api/stats'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const PIE_COLORS = ['#22c55e', '#ef4444', '#a855f7']

export default function StatsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    statsApi.get(period).then(setData).finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return <div className="p-4 text-center text-gray-400">加载中...</div>

  const successCount = data.tag_distribution['成功'] || 0
  const totalTagged = successCount + (data.tag_distribution['失败'] || 0)
  const successRate = totalTagged > 0 ? Math.round((successCount / totalTagged) * 100) : 0

  const pieData = Object.entries(data.tag_distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">统计</h2>
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                period === p ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-500'
              }`}
            >
              {p === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* 数字卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.review_count}</p>
          <p className="text-xs text-gray-400 mt-1">复盘</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{data.insight_count}</p>
          <p className="text-xs text-gray-400 mt-1">心得</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
          <p className="text-xs text-gray-400 mt-1">成功率</p>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">每日产出趋势</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.daily_counts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => `日期: ${v}`} />
            <Area type="monotone" dataKey="reviews" name="复盘" stroke="#3b82f6" fill="#dbeafe" />
            <Area type="monotone" dataKey="insights" name="心得" stroke="#22c55e" fill="#dcfce7" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 标签分布 */}
      {pieData.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">标签分布</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={false}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{item.name}</span>
                  <span className="text-gray-400 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
