// src/contexts/CursorContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type CursorStyle = 'default' | 'glow' | 'ring' | 'trail' | 'sparkle' | 'crosshair'

export interface CursorSettings {
  enabled: boolean
  style: CursorStyle
  size: number
  color: string
  trailLength: number
  trailFade: number
  clickEffect: boolean
}

export interface CursorPreset {
  name: string
  icon: string
  settings: Partial<CursorSettings>
}

interface CursorContextType {
  settings: CursorSettings
  updateSettings: (settings: Partial<CursorSettings>) => void
  presets: CursorPreset[]
}

const defaultSettings: CursorSettings = {
  enabled: false,
  style: 'default',
  size: 12,
  color: '#6366f1',
  trailLength: 10,
  trailFade: 0.5,
  clickEffect: true,
}

const defaultPresets: CursorPreset[] = [
  {
    name: '默认',
    icon: '●',
    settings: { style: 'default', size: 12, color: '#6366f1', trailLength: 10, trailFade: 0.5, clickEffect: true },
  },
  {
    name: '霓虹',
    icon: '◉',
    settings: { style: 'glow', size: 16, color: '#22d3ee', trailLength: 8, trailFade: 0.6, clickEffect: true },
  },
  {
    name: '极简',
    icon: '○',
    settings: { style: 'ring', size: 20, color: '#f5f5f5', trailLength: 5, trailFade: 0.3, clickEffect: true },
  },
  {
    name: '幽灵',
    icon: '◌',
    settings: { style: 'trail', size: 10, color: '#a78bfa', trailLength: 15, trailFade: 0.7, clickEffect: false },
  },
  {
    name: '星光',
    icon: '✦',
    settings: { style: 'sparkle', size: 14, color: '#fbbf24', trailLength: 12, trailFade: 0.5, clickEffect: true },
  },
  {
    name: '瞄准',
    icon: '⊕',
    settings: { style: 'crosshair', size: 24, color: '#ef4444', trailLength: 5, trailFade: 0.2, clickEffect: true },
  },
]

const CursorContext = createContext<CursorContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  presets: defaultPresets,
})

export function CursorProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CursorSettings>(() => {
    try {
      const saved = localStorage.getItem('toolbox-cursor-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultSettings, ...parsed, enabled: false }
      }
    } catch {
      void 0
    }
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('toolbox-cursor-settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<CursorSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <CursorContext.Provider value={{ settings, updateSettings, presets: defaultPresets }}>
      {children}
    </CursorContext.Provider>
  )
}

export function useCursor() {
  const context = useContext(CursorContext)
  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider')
  }
  return context
}
