// src/tools/datetime/Timestamp.tsx
import { useState, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

export default function Timestamp() {
  const [now, setNow] = useState(0)
  const [tsInput, setTsInput] = useState('')
  const [tsUnit, setTsUnit] = useState<'s' | 'ms'>('s')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const nowDate = new Date(now)
  const tsSec = Math.floor(now / 1000)
  const tsMs = now

  // 时间戳 → 日期
  let parsedDate = ''
  if (tsInput) {
    const num = Number(tsInput)
    if (!isNaN(num)) {
      const d = new Date(tsUnit === 's' ? num * 1000 : num)
      parsedDate = d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }
  }

  return (
    <ToolLayout title="时间戳转换" description="Unix 时间戳与日期时间互转">
      {/* 当前时间 */}
      <div className="tool-output" style={{ textAlign: 'center', marginBottom: 20, fontSize: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>{nowDate.toLocaleTimeString('zh-CN')}</div>
        <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>{nowDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <span>
            秒: <code style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(String(tsSec))}>{tsSec}</code>
          </span>
          <span>
            毫秒: <code style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(String(tsMs))}>{tsMs}</code>
          </span>
        </div>
      </div>

      <hr className="tool-divider" />

      {/* 时间戳 → 日期 */}
      <span className="tool-label">时间戳 → 日期时间</span>
      <div className="tool-row" style={{ marginTop: 8 }}>
        <input className="input" value={tsInput} onChange={(e) => setTsInput(e.target.value)} placeholder="输入时间戳..." style={{ flex: 1 }} />
        <Select
          value={tsUnit}
          onChange={v => setTsUnit(v as 's' | 'ms')}
          options={[
            { value: 's', label: '秒' },
            { value: 'ms', label: '毫秒' },
          ]}
        />
      </div>
      {parsedDate && <div className="tool-output" style={{ marginTop: 8, textAlign: 'center', fontSize: 16 }}>{parsedDate}</div>}

      <hr className="tool-divider" />

      {/* 日期 → 时间戳 */}
      <span className="tool-label">日期时间 → 时间戳</span>
      <input
        className="input"
        type="datetime-local"
        style={{ marginTop: 8, width: '100%' }}
        onChange={(e) => {
          const d = new Date(e.target.value)
          setTsInput(String(Math.floor(d.getTime() / 1000)))
          setTsUnit('s')
        }}
      />
    </ToolLayout>
  )
}
