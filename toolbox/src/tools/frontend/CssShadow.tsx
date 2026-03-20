// src/tools/frontend/CssShadow.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function CssShadow() {
  const [x, setX] = useState(0)
  const [y, setY] = useState(4)
  const [blur, setBlur] = useState(12)
  const [spread, setSpread] = useState(0)
  const [color, setColor] = useState('#00000040')
  const [inset, setInset] = useState(false)

  const shadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${color}`
  const css = `box-shadow: ${shadow};`

  return (
    <ToolLayout title="CSS 阴影生成器" description="可视化生成 box-shadow 代码">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label className="tool-label">水平偏移: {x}px</label>
          <input type="range" min={-30} max={30} value={x} onChange={(e) => setX(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <label className="tool-label">垂直偏移: {y}px</label>
          <input type="range" min={-30} max={30} value={y} onChange={(e) => setY(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <label className="tool-label">模糊半径: {blur}px</label>
          <input type="range" min={0} max={50} value={blur} onChange={(e) => setBlur(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <label className="tool-label">扩展半径: {spread}px</label>
          <input type="range" min={-20} max={20} value={spread} onChange={(e) => setSpread(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
      <div className="tool-row">
        <input type="color" value={color.slice(0, 7)} onChange={(e) => setColor(e.target.value + color.slice(7))} style={{ width: 50, height: 36, border: 'none', cursor: 'pointer' }} />
        <input className="input" value={color} onChange={(e) => setColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
        <button className={`btn ${inset ? '' : 'btn-outline'}`} onClick={() => setInset(!inset)}>Inset</button>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: 12, background: '#2a2a2a', boxShadow: shadow, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="tool-output-label">
            <span className="tool-label">生成代码</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(css)}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div className="tool-output" style={{ fontFamily: 'monospace' }}>{css}</div>
        </div>
      </div>
    </ToolLayout>
  )
}
