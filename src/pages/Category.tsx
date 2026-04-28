// src/pages/Category.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as Icons from 'lucide-react'
import { categories } from '../tools/categories'
import { getToolsByCategory } from '../tools/registry'
import ToolCard from '../components/ToolCard'

export default function Category() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const cat = categories.find((c) => c.id === categoryId)
  const tools = getToolsByCategory(categoryId || '')

  if (!cat) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Icons.HelpCircle size={32} />
        </div>
        <p>分类不存在</p>
        <button className="btn" onClick={() => navigate('/')}>返回首页</button>
      </div>
    )
  }

  const CatIcon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[cat.icon] || Icons.HelpCircle

  return (
    <div className="category-page">
      <div className="category-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>
        <div className="category-header-info" style={{ '--cat-color': cat.color } as React.CSSProperties}>
          <div className="category-header-icon">
            <CatIcon size={32} />
          </div>
          <div>
            <h1>{cat.name}</h1>
            <p>{cat.description} · {tools.length} 个工具</p>
          </div>
        </div>
      </div>
      <div className="tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}