/**
 * 天地图图层配置工具
 * 用户需自行到 https://console.tianditu.gov.cn/ 申请 TK
 */

export interface TiandituConfig {
  tk: string
  mapType: TiandituMapType
}

export type TiandituMapType =
  | 'vec'    // 矢量底图
  | 'cva'    // 矢量注记
  | 'img'    // 影像底图
  | 'cia'    // 影像注记
  | 'ter'    // 地形底图
  | 'cta'    // 地形注记
  | 'osm'    // OpenStreetMap (默认)

const STORAGE_KEY = 'tianditu_config'

/** 天地图图层元信息 */
export const TIANDITU_LAYERS: Record<string, { label: string; subdomains: string[] }> = {
  vec: { label: '矢量底图', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
  cva: { label: '矢量注记', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
  img: { label: '影像底图', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
  cia: { label: '影像注记', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
  ter: { label: '地形底图', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
  cta: { label: '地形注记', subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] },
}

/** 默认配置 */
const DEFAULT_CONFIG: TiandituConfig = {
  tk: '',
  mapType: 'osm',
}

/** 从 localStorage 读取配置 */
export function loadTiandituConfig(): TiandituConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

/** 保存配置到 localStorage */
export function saveTiandituConfig(config: TiandituConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** 构建天地图瓦片 URL */
export function getTiandituTileUrl(mapType: string, tk: string): string {
  const layer = TIANDITU_LAYERS[mapType]
  if (!layer) return ''
  return `https://{s}.tianditu.gov.cn/DataServer?T=${mapType}_w&x={x}&y={y}&l={z}&tk=${encodeURIComponent(tk)}`
}

/** 获取天地图图层的 subdomains */
export function getTiandituSubdomains(mapType: string): string[] {
  return TIANDITU_LAYERS[mapType]?.subdomains ?? ['t0']
}

/** OSM 默认瓦片 URL */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** 根据配置获取当前瓦片 URL */
export function getCurrentTileUrl(config: TiandituConfig): string {
  if (config.mapType === 'osm' || !config.tk) {
    return OSM_TILE_URL
  }
  return getTiandituTileUrl(config.mapType, config.tk)
}

/** 获取当前图层 subdomains */
export function getCurrentSubdomains(config: TiandituConfig): string[] {
  if (config.mapType === 'osm' || !config.tk) {
    return ['a', 'b', 'c']
  }
  return getTiandituSubdomains(config.mapType)
}

/** 获取当前图层 attribution */
export function getCurrentAttribution(config: TiandituConfig): string {
  if (config.mapType === 'osm' || !config.tk) {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
  return '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>'
}
