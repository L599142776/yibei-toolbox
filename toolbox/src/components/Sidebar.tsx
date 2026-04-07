// src/components/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, List, Star } from 'lucide-react'
import * as Icons from 'lucide-react'
import { categories } from '../tools/categories'
import { allTools } from '../tools/registry'
import { useFavorites } from '../contexts/FavoritesContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { favorites } = useFavorites()

  const navItems = [
    { id: 'home', label: '首页', icon: Home, path: '/' },
    { id: 'all', label: '全部工具', icon: List, path: '/?tab=all' },
    { id: 'favorites', label: '我的收藏', icon: Star, path: '/?tab=favorites', badge: favorites.length },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.search
    if (path.includes('?tab=')) {
      const tab = path.split('?tab=')[1]
      return location.search.includes(`tab=${tab}`)
    }
    return location.pathname === path
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {/* 导航菜单 */}
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <div className="sidebar-section-title">导航</div>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar-badge">{item.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 分类列表 */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">分类</div>
              {categories.map((cat) => {
                const count = allTools.filter((t) => t.category === cat.id).length
                const CatIcon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[cat.icon] || Icons.HelpCircle
                return (
                  <button
                    key={cat.id}
                    className={`sidebar-item ${location.pathname === `/${cat.id}` ? 'active' : ''}`}
                    onClick={() => handleNavClick(`/${cat.id}`)}
                  >
                    <span style={{ color: cat.color, display: 'inline-flex' }}><CatIcon size={18} /></span>
                    <span>{cat.name}</span>
                    <span className="sidebar-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* 底部信息 */}
          <div className="sidebar-footer">
            <div className="sidebar-stats">
              <div className="sidebar-stat">
                <span className="sidebar-stat-value">{allTools.length}</span>
                <span className="sidebar-stat-label">工具</span>
              </div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-value">{categories.length}</span>
                <span className="sidebar-stat-label">分类</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}