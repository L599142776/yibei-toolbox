// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import * as Icons from 'lucide-react'
import { categories } from '../tools/categories'
import { allTools } from '../tools/registry'
import { useFavorites } from '../contexts/FavoritesContext'
import ToolCard from '../components/ToolCard'

export default function Home() {
  const navigate = useNavigate()
  const { favorites } = useFavorites()
  const favTools = allTools.filter((t) => favorites.includes(t.id))

  return (
    <div className="home">
      {/* 收藏区 */}
      {favTools.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <Star size={20} /> 我的收藏
          </h2>
          <div className="tool-grid">
            {favTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* 分类区 */}
      <section className="section">
        <h2 className="section-title">全部分类</h2>
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
                <CatIcon size={32} />
                <h3>{cat.name}</h3>
                <p>{count} 个工具</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* 全部工具 */}
      <section className="section">
        <h2 className="section-title">全部工具 ({allTools.length})</h2>
        <div className="tool-grid">
          {allTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  )
}
