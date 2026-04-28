// src/components/ThemeToggle.tsx
import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const themes = [
    { value: 'light' as const, label: '浅色模式', icon: Sun },
    { value: 'dark' as const, label: '深色模式', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ]

  const current = themes.find(t => t.value === theme) || themes[2]
  const CurrentIcon = current.icon

  return (
    <div ref={ref} className="theme-toggle">
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen(!open)}
        aria-label="切换主题"
      >
        <CurrentIcon size={18} />
        <span>{current.label}</span>
        <ChevronDown size={14} className={`theme-toggle-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="theme-toggle-menu">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={`theme-toggle-item ${theme === value ? 'active' : ''}`}
              onClick={() => { setTheme(value); setOpen(false) }}
            >
              <Icon size={16} />
              <span>{label}</span>
              {theme === value && <span className="theme-toggle-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}