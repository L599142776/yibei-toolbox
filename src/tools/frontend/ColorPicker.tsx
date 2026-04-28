// src/tools/frontend/ColorPicker.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  if (h.length !== 6 && h.length !== 3) return null
  let r: string, g: string, b: string
  if (h.length === 3) {
    r = h[0] + h[0]; g = h[1] + h[1]; b = h[2] + h[2]
  } else {
    r = h.slice(0, 2); g = h.slice(2, 4); b = h.slice(4, 6)
  }
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function contrastRatio(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const lum = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  const l1 = lum(r1, g1, b1), l2 = lum(r2, g2, b2)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2)
}

export default function ColorPicker() {
  const [color, setColor] = useState('#6366f1')
  const rgb = hexToRgb(color)
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null
  const whiteContrast = rgb ? contrastRatio(rgb.r, rgb.g, rgb.b, 255, 255, 255) : '—'
  const blackContrast = rgb ? contrastRatio(rgb.r, rgb.g, rgb.b, 0, 0, 0) : '—'

  const formats = rgb && hsl ? [
    ['HEX', color],
    ['RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ['RGBA', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`],
    ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
    ['HSLA', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`],
  ] : []

  return (
    <ToolLayout title="颜色工具" description="颜色选择、格式转换、对比度检查">
      <div className="tool-row">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 60, height: 40, border: 'none', cursor: 'pointer' }} />
        <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#000000" style={{ flex: 1, fontFamily: 'monospace' }} />
      </div>
      {rgb && (
        <>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ flex: 1, height: 80, borderRadius: 8, background: color }} />
            <div style={{ flex: 1, display: 'grid', gap: 6 }}>
              <div className="tool-output" style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>
                <span>白底对比度: </span>
                <span style={{ color: Number(whiteContrast) >= 4.5 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{whiteContrast}:1</span>
                <span style={{ marginLeft: 4, fontSize: 11 }}>{Number(whiteContrast) >= 4.5 ? '✓ AA' : '✗ 不达标'}</span>
              </div>
              <div className="tool-output" style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>
                <span>黑底对比度: </span>
                <span style={{ color: Number(blackContrast) >= 4.5 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{blackContrast}:1</span>
                <span style={{ marginLeft: 4, fontSize: 11 }}>{Number(blackContrast) >= 4.5 ? '✓ AA' : '✗ 不达标'}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="tool-label">颜色格式</span>
            {formats.map(([label, val]) => (
              <div key={label} className="tool-row" style={{ justifyContent: 'space-between' }}>
                <span className="tool-label" style={{ width: 60 }}>{label}</span>
                <div className="tool-output" style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}>{val}</div>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigator.clipboard.writeText(val)}>
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </ToolLayout>
  )
}
