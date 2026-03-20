import { useState, useEffect, useCallback } from 'react'
import {
  loadTiandituConfig,
  saveTiandituConfig,
  TIANDITU_LAYERS,
  getCurrentTileUrl,
  getCurrentSubdomains,
  getCurrentAttribution,
} from './tianditu'
import type { TiandituConfig, TiandituMapType } from './tianditu'

interface TileLayerSelectorProps {
  onConfigChange: (config: {
    url: string
    subdomains: string[]
    attribution: string
    config: TiandituConfig
  }) => void
}

export default function TileLayerSelector({ onConfigChange }: TileLayerSelectorProps) {
  const [config, setConfig] = useState<TiandituConfig>(() => loadTiandituConfig())
  const [showSettings, setShowSettings] = useState(false)
  const [tkInput, setTkInput] = useState('')
  const [tkSaved, setTkSaved] = useState(false)

  // Notify parent when config changes
  const notifyChange = useCallback((cfg: TiandituConfig) => {
    onConfigChange({
      url: getCurrentTileUrl(cfg),
      subdomains: getCurrentSubdomains(cfg),
      attribution: getCurrentAttribution(cfg),
      config: cfg,
    })
  }, [onConfigChange])

  useEffect(() => {
    notifyChange(config)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapTypeChange = (mapType: TiandituMapType | 'osm') => {
    const newConfig = { ...config, mapType }
    setConfig(newConfig)
    saveTiandituConfig(newConfig)
    notifyChange(newConfig)
  }

  const handleSaveTk = () => {
    const trimmed = tkInput.trim()
    if (!trimmed) return
    const newConfig = { ...config, tk: trimmed }
    setConfig(newConfig)
    saveTiandituConfig(newConfig)
    setTkSaved(true)
    notifyChange(newConfig)
    setTimeout(() => setTkSaved(false), 2000)
  }

  const handleClearTk = () => {
    const newConfig = { ...config, tk: '', mapType: 'osm' as const }
    setConfig(newConfig)
    setTkInput('')
    saveTiandituConfig(newConfig)
    notifyChange(newConfig)
  }

  const hasTk = !!config.tk

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8,
      marginBottom: 12, fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>底图：</span>

      {/* OSM */}
      <button
        className={`btn ${config.mapType === 'osm' ? '' : 'btn-outline'}`}
        onClick={() => handleMapTypeChange('osm')}
        style={{ fontSize: 12, padding: '4px 10px' }}
      >
        OSM
      </button>

      {/* 天地图图层按钮 */}
      {Object.entries(TIANDITU_LAYERS).map(([key, layer]) => (
        <button
          key={key}
          className={`btn ${config.mapType === key ? '' : 'btn-outline'}`}
          onClick={() => {
            if (!hasTk) {
              setShowSettings(true)
              return
            }
            handleMapTypeChange(key as TiandituMapType)
          }}
          style={{
            fontSize: 12, padding: '4px 10px',
            opacity: hasTk ? 1 : 0.5,
          }}
          title={hasTk ? layer.label : '请先设置天地图 TK'}
        >
          {layer.label}
        </button>
      ))}

      {/* 设置按钮 */}
      <button
        className="btn btn-outline"
        onClick={() => setShowSettings(!showSettings)}
        style={{ fontSize: 12, padding: '4px 10px', marginLeft: 'auto' }}
        title="天地图 TK 设置"
      >
        ⚙️ TK
        {hasTk && <span style={{ color: '#10b981', marginLeft: 4 }}>✓</span>}
      </button>

      {/* TK 设置面板 */}
      {showSettings && (
        <div style={{
          width: '100%', marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-dim)' }}>天地图 TK：</span>
            <input
              className="input"
              type="password"
              value={tkInput}
              onChange={e => setTkInput(e.target.value)}
              placeholder={hasTk ? '已设置（输入新值可替换）' : '请输入天地图开发者 TK'}
              style={{ flex: 1, minWidth: 200, fontSize: 13 }}
              onKeyDown={e => e.key === 'Enter' && handleSaveTk()}
            />
            <button className="btn" onClick={handleSaveTk} style={{ fontSize: 12, padding: '4px 12px' }}>
              {tkSaved ? '✅ 已保存' : '保存'}
            </button>
            {hasTk && (
              <button className="btn btn-outline" onClick={handleClearTk} style={{ fontSize: 12, padding: '4px 12px' }}>
                清除
              </button>
            )}
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>
            到 <a href="https://console.tianditu.gov.cn/" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}>天地图控制台</a> 申请开发者密钥，
            在「应用管理」中创建应用后获取 TK。TK 仅保存在浏览器本地。
          </div>
        </div>
      )}
    </div>
  )
}
