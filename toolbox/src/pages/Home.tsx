// src/pages/Home.tsx
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Star, Sparkles, Zap, Shield, Clock, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { categories } from '../tools/categories'
import { allTools } from '../tools/registry'
import { useFavorites } from '../contexts/FavoritesContext'
import ToolCard from '../components/ToolCard'

export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { favorites } = useFavorites()
  const favTools = allTools.filter((t) => favorites.includes(t.id))
  
  const activeTab = searchParams.get('tab') || 'home'

  const quickActions = [
    { icon: Zap, title: 'Base64编码', desc: '快速编解码', path: '/common/base64', color: '#f59e0b' },
    { icon: Shield, title: '哈希生成', desc: 'MD5/SHA256', path: '/crypto/hash', color: '#ef4444' },
    { icon: Clock, title: '时间戳', desc: '时间转换', path: '/datetime/timestamp', color: '#10b981' },
    { icon: Sparkles, title: 'JSON格式化', desc: '美化/压缩', path: '/data/json', color: '#8b5cf6' },
  ]

  // 首页
  if (activeTab === 'home') {
    return (
      <div className="home">
        {/* 英雄区域 */}
        <section className="hero-section">
          <h1 className="hero-title">开发者工具箱</h1>
          <p className="hero-subtitle">
            纯前端实现的在线工具集，无需后端服务，所有数据本地处理
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{allTools.length}</div>
              <div className="hero-stat-label">个工具</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{categories.length}</div>
              <div className="hero-stat-label">个分类</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">本地处理</div>
            </div>
          </div>
        </section>

        {/* 快速访问 */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <Zap size={20} /> 快速访问
            </h2>
          </div>
          <div className="quick-actions">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  className="quick-action"
                  onClick={() => navigate(action.path)}
                >
                  <div className="quick-action-icon" style={{ '--action-color': action.color } as React.CSSProperties}>
                    <Icon size={22} />
                  </div>
                  <div className="quick-action-text">
                    <h4>{action.title}</h4>
                    <p>{action.desc}</p>
                  </div>
                  <ArrowRight size={16} className="quick-action-arrow" />
                </button>
              )
            })}
          </div>
        </section>

        {/* 收藏工具 */}
        {favTools.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">
                <Star size={20} /> 我的收藏
              </h2>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/?tab=favorites')}
              >
                查看全部
              </button>
            </div>
            <div className="tool-grid">
              {favTools.slice(0, 4).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )}

        {/* 热门分类 */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">热门分类</h2>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/?tab=categories')}
            >
              查看全部
            </button>
          </div>
          <div className="category-grid">
            {categories.slice(0, 6).map((cat) => {
              const count = allTools.filter((t) => t.category === cat.id).length
              const CatIcon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[cat.icon] || Icons.HelpCircle
              return (
                <button
                  key={cat.id}
                  className="category-card"
                  onClick={() => navigate(`/${cat.id}`)}
                  style={{ '--cat-color': cat.color } as React.CSSProperties}
                >
                  <div className="category-card-icon">
                    <CatIcon size={26} />
                  </div>
                  <h3>{cat.name}</h3>
                  <p>{count} 个工具</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* 最新工具 */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">全部工具</h2>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/?tab=all')}
            >
              查看全部
            </button>
          </div>
          <div className="tool-grid">
            {allTools.slice(0, 8).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // 全部工具
  if (activeTab === 'all') {
    return (
      <div className="home">
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">全部工具</h2>
            <span className="section-subtitle">{allTools.length} 个工具</span>
          </div>
          <div className="tool-grid">
            {allTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // 收藏
  if (activeTab === 'favorites') {
    return (
      <div className="home">
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <Star size={20} /> 我的收藏
            </h2>
            <span className="section-subtitle">{favTools.length} 个收藏</span>
          </div>
          {favTools.length > 0 ? (
            <div className="tool-grid">
              {favTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Star size={32} />
              </div>
              <p>还没有收藏任何工具</p>
              <button 
                className="btn"
                onClick={() => navigate('/?tab=all')}
              >
                浏览全部工具
              </button>
            </div>
          )}
        </section>
      </div>
    )
  }

  // 分类
  return (
    <div className="home">
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">全部分类</h2>
          <span className="section-subtitle">{categories.length} 个分类</span>
        </div>
        <div className="category-grid">
          {categories.map((cat) => {
            const count = allTools.filter((t) => t.category === cat.id).length
            const CatIcon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[cat.icon] || Icons.HelpCircle
            return (
              <button
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/${cat.id}`)}
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <div className="category-card-icon">
                  <CatIcon size={26} />
                </div>
                <h3>{cat.name}</h3>
                <p>{count} 个工具</p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}