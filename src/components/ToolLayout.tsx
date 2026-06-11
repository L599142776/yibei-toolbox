// src/components/ToolLayout.tsx
// 每个工具页面共用的布局：返回按钮 + 标题 + 内容区

import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Pin } from 'lucide-react'
import { isElectron, isWidget, widgetAPI } from '../utils/platform'
import { getToolByPath } from '../tools/registry'

interface Props {
  title: string
  description: string
  children: React.ReactNode
}

export default function ToolLayout({ title, description, children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const tool = getToolByPath(location.pathname)

  const handlePinToDesktop = async () => {
    if (!tool || !isElectron) return
    await widgetAPI.create(tool.id, tool.name, tool.path)
  }

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <div className="tool-header-info">
          <h1 className="tool-title">{title}</h1>
          <p className="tool-desc">{description}</p>
        </div>
        {isElectron && !isWidget && (
          <button className="pin-btn" onClick={handlePinToDesktop} title="钉到桌面">
            <Pin size={16} />
          </button>
        )}
      </div>
      <div className="tool-content">
        {children}
      </div>
    </div>
  )
}
