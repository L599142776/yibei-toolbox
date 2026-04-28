// src/tools/frontend/FlexboxPlayground.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse'
type Justify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
type Align = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline'
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse'

export default function FlexboxPlayground() {
  const [direction, setDirection] = useState<Direction>('row')
  const [justify, setJustify] = useState<Justify>('flex-start')
  const [align, setAlign] = useState<Align>('stretch')
  const [wrap, setWrap] = useState<Wrap>('nowrap')
  const [gap, setGap] = useState(8)
  const [itemCount, setItemCount] = useState(5)

  const css = `display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\nflex-wrap: ${wrap};\ngap: ${gap}px;`

  return (
    <ToolLayout title="Flexbox 布局生成器" description="可视化调整 Flexbox 属性，实时预览并生成代码">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <span className="tool-label">flex-direction</span>
          <Select
            value={direction}
            onChange={v => setDirection(v as Direction)}
            options={[
              { value: 'row', label: 'row' },
              { value: 'row-reverse', label: 'row-reverse' },
              { value: 'column', label: 'column' },
              { value: 'column-reverse', label: 'column-reverse' },
            ]}
            width="100%"
          />
        </div>
        <div>
          <span className="tool-label">justify-content</span>
          <Select
            value={justify}
            onChange={v => setJustify(v as Justify)}
            options={[
              { value: 'flex-start', label: 'flex-start' },
              { value: 'center', label: 'center' },
              { value: 'flex-end', label: 'flex-end' },
              { value: 'space-between', label: 'space-between' },
              { value: 'space-around', label: 'space-around' },
              { value: 'space-evenly', label: 'space-evenly' },
            ]}
            width="100%"
          />
        </div>
        <div>
          <span className="tool-label">align-items</span>
          <Select
            value={align}
            onChange={v => setAlign(v as Align)}
            options={[
              { value: 'stretch', label: 'stretch' },
              { value: 'flex-start', label: 'flex-start' },
              { value: 'center', label: 'center' },
              { value: 'flex-end', label: 'flex-end' },
              { value: 'baseline', label: 'baseline' },
            ]}
            width="100%"
          />
        </div>
        <div>
          <span className="tool-label">flex-wrap</span>
          <Select
            value={wrap}
            onChange={v => setWrap(v as Wrap)}
            options={[
              { value: 'nowrap', label: 'nowrap' },
              { value: 'wrap', label: 'wrap' },
              { value: 'wrap-reverse', label: 'wrap-reverse' },
            ]}
            width="100%"
          />
        </div>
        <div>
          <span className="tool-label">gap: {gap}px</span>
          <input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span className="tool-label">子元素数: {itemCount}</span>
          <input type="range" min={1} max={12} value={itemCount} onChange={(e) => setItemCount(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
      <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, display: 'flex', flexDirection: direction, justifyContent: justify, alignItems: align, flexWrap: wrap, gap, minHeight: 200 }}>
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} style={{ background: `hsl(${(i * 60) % 360}, 70%, 50%)`, borderRadius: 6, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#fff', minWidth: 40, textAlign: 'center' }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">CSS 代码</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(css)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{css}</div>
    </ToolLayout>
  )
}
