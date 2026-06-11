import { X, Minus } from 'lucide-react'
import { isMac, isElectron, widgetAPI } from '../utils/platform'
import { useLocation } from 'react-router-dom'
import { getToolByPath } from '../tools/registry'

export default function WidgetTitleBar() {
  const location = useLocation()
  const tool = getToolByPath(location.pathname)
  const toolName = tool?.name ?? '工具箱'
  const toolId = tool?.id ?? ''

  const handleClose = async () => {
    if (toolId) {
      await widgetAPI.close(toolId)
    }
  }

  if (!isElectron) return null

  return (
    <div className="widget-titlebar">
      <div className="widget-titlebar-drag">
        <span className="widget-titlebar-name">{toolName}</span>
      </div>
      <div className="widget-titlebar-controls">
        {!isMac && (
          <button className="titlebar-btn minimize" onClick={() => window.__WINDOW__?.minimize()}>
            <Minus size={12} />
          </button>
        )}
        <button className="titlebar-btn close" onClick={handleClose}>
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
