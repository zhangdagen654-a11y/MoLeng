export default function SettingsPage() {
  const handleExport = (format: 'json' | 'csv') => {
    const link = document.createElement('a')
    link.href = `/api/export?format=${format}`
    link.click()
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">设置</h2>

      <div className="space-y-4">
        {/* API Key */}
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">API Key 配置</h3>
          <p className="text-xs text-gray-400 mb-2">API Key 通过服务端环境变量 ANTHROPIC_API_KEY 配置，无需在前端设置。</p>
        </div>

        {/* 数据导出 */}
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">数据导出</h3>
          <p className="text-xs text-gray-400 mb-3">导出全部数据，支持 JSON 和 CSV 格式。</p>
          <div className="flex gap-2">
            <button onClick={() => handleExport('json')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              导出 JSON
            </button>
            <button onClick={() => handleExport('csv')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
              导出 CSV (ZIP)
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">关于</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>认知提纯系统 v1.1.0</p>
            <p>设计哲学：AI 帮你发现值得思考的事，你自己思考，数据库帮你记住思考的结果。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
