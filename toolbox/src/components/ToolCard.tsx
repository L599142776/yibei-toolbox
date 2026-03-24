// src/components/ToolCard.tsx
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useFavorites } from '../contexts/FavoritesContext'
import type { ToolManifest } from '../types/tool'
import * as Icons from 'lucide-react'

interface Props {
  tool: ToolManifest
}

export default function ToolCard({ tool }: Props) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(tool.id)

  // 动态获取 Lucide 图标
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[tool.icon] || Icons.HelpCircle

  return (
    <div className="tool-card" onClick={() => navigate(tool.path)}>
      <button
        className={`tool-card-fav ${fav ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id) }}
        title={fav ? '取消收藏' : '收藏'}
      >
        <Star size={18} fill={fav ? 'currentColor' : 'none'} />
      </button>
      <div className="tool-card-icon">
        <IconComponent size={24} />
      </div>
      <h3 className="tool-card-name">{tool.name}</h3>
      <p className="tool-card-desc">{tool.description}</p>
    </div>
  )
}
