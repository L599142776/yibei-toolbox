// src/components/TitleBar.tsx
import { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { isElectron, isMac, windowControl } from '../utils/platform'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isElectron) return

    const checkMaximized = async () => {
      const maximized = await windowControl.isMaximized()
      setIsMaximized(maximized)
    }

    checkMaximized()

    // 监听窗口大小变化
    const handleResize = () => {
      checkMaximized()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 非 Electron 环境不渲染
  if (!isElectron) return null

  // macOS 使用系统自带的交通灯按钮
  if (isMac) {
    return (
      <div className="titlebar titlebar-mac" />
    )
  }

  // Windows 和 Linux 显示自定义按钮
  const handleMinimize = () => {
    windowControl.minimize()
  }

  const handleMaximize = async () => {
    await windowControl.maximize()
    const maximized = await windowControl.isMaximized()
    setIsMaximized(maximized)
  }

  const handleClose = () => {
    windowControl.close()
  }

  return (
    <div className="titlebar">
      <div className="titlebar-drag" />
      <div className="titlebar-controls">
        <button 
          className="titlebar-btn minimize" 
          onClick={handleMinimize}
          aria-label="最小化"
        >
          <Minus size={14} />
        </button>
        <button 
          className="titlebar-btn maximize" 
          onClick={handleMaximize}
          aria-label={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
        </button>
        <button 
          className="titlebar-btn close" 
          onClick={handleClose}
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}