import { useState } from 'react'
import { useCursor, type CursorStyle } from '../contexts/CursorContext'

const cursorStyles: { value: CursorStyle; label: string; icon: string }[] = [
  { value: 'default', label: '默认', icon: '●' },
  { value: 'glow', label: '霓虹', icon: '◉' },
  { value: 'ring', label: '光环', icon: '○' },
  { value: 'trail', label: '轨迹', icon: '◌' },
  { value: 'sparkle', label: '星光', icon: '✦' },
  { value: 'crosshair', label: '准星', icon: '⊕' },
]

export default function CursorSettings() {
  const { settings, updateSettings, presets } = useCursor()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="cursor-settings">
      <button
        className="cursor-settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="光标设置"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="cursor-settings-panel">
          <div className="cursor-settings-header">
            <h3>光标设置</h3>
            <button className="cursor-settings-close" onClick={() => setIsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="cursor-settings-body">
            <div className="cursor-settings-row">
              <label className="cursor-settings-label">启用自定义光标</label>
              <button
                className={`cursor-settings-toggle-switch ${settings.enabled ? 'active' : ''}`}
                onClick={() => updateSettings({ enabled: !settings.enabled })}
              >
                <span className="cursor-settings-toggle-knob" />
              </button>
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">光标样式</label>
              <div className="cursor-style-grid">
                {cursorStyles.map((style) => (
                  <button
                    key={style.value}
                    className={`cursor-style-option ${settings.style === style.value ? 'active' : ''}`}
                    onClick={() => updateSettings({ style: style.value })}
                  >
                    <span className="cursor-style-icon">{style.icon}</span>
                    <span className="cursor-style-name">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">大小: {settings.size}px</label>
              <input
                type="range"
                min="8"
                max="32"
                value={settings.size}
                onChange={(e) => updateSettings({ size: Number(e.target.value) })}
                className="cursor-settings-slider"
              />
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">颜色</label>
              <div className="cursor-color-row">
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => updateSettings({ color: e.target.value })}
                  className="cursor-color-picker"
                />
                <input
                  type="text"
                  value={settings.color}
                  onChange={(e) => updateSettings({ color: e.target.value })}
                  className="cursor-color-input"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">轨迹长度: {settings.trailLength}</label>
              <input
                type="range"
                min="5"
                max="20"
                value={settings.trailLength}
                onChange={(e) => updateSettings({ trailLength: Number(e.target.value) })}
                className="cursor-settings-slider"
              />
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">轨迹淡出: {settings.trailFade.toFixed(1)}</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.trailFade}
                onChange={(e) => updateSettings({ trailFade: Number(e.target.value) })}
                className="cursor-settings-slider"
              />
            </div>

            <div className="cursor-settings-row">
              <label className="cursor-settings-label">点击效果</label>
              <button
                className={`cursor-settings-toggle-switch ${settings.clickEffect ? 'active' : ''}`}
                onClick={() => updateSettings({ clickEffect: !settings.clickEffect })}
              >
                <span className="cursor-settings-toggle-knob" />
              </button>
            </div>

            <div className="cursor-settings-section">
              <label className="cursor-settings-label">预设</label>
              <div className="cursor-presets-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    className="cursor-preset-btn"
                    onClick={() => updateSettings(preset.settings)}
                  >
                    <span className="cursor-preset-icon">{preset.icon}</span>
                    <span className="cursor-preset-name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
