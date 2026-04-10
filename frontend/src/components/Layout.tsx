import { NavLink, Outlet } from 'react-router-dom'
import { useResponsive } from '@/hooks/useResponsive'
import OnlineIndicator from '@/components/OnlineIndicator'

const navItems = [
  { to: '/', label: '写入', icon: '✏' },
  { to: '/diary', label: '日记', icon: '📖' },
  { to: '/database', label: '数据库', icon: '🗄' },
  { to: '/search', label: '搜索', icon: '🔍' },
  { to: '/stats', label: '统计', icon: '📊' },
  { to: '/settings', label: '设置', icon: '⚙' },
]

export default function Layout() {
  const { isMobile } = useResponsive()

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <nav className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col gap-1">
          <h1 className="text-lg font-bold text-blue-600 mb-2 px-3">认知提纯</h1>
          <OnlineIndicator />
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {/* 主内容区 */}
      <main className="flex-1 pb-20 md:pb-0 overflow-auto">
        <Outlet />
      </main>

      {/* 移动端底部导航 */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs px-3 py-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
