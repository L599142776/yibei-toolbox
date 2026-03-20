// src/components/ToolLayout.tsx
// 每个工具页面共用的布局：返回按钮 + 标题 + 内容区

import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  description: string
  children: React.ReactNode
}

export default function ToolLayout({ title, description, children }: Props) {
  const navigate = useNavigate()

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <div>
          <h1 className="tool-title">{title}</h1>
          <p className="tool-desc">{description}</p>
        </div>
      </div>
      <div className="tool-content">
        {children}
      </div>
    </div>
  )
}
