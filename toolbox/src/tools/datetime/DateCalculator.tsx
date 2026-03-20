// src/tools/datetime/DateCalculator.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function DateCalculator() {
  const [mode, setMode] = useState<'diff' | 'add'>('diff')
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [baseDate, setBaseDate] = useState('')
  const [days, setDays] = useState(0)

  let result = ''
  if (mode === 'diff' && date1 && date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffMs = Math.abs(d2.getTime() - d1.getTime())
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const remainDays = diffDays % 7
    result = `${diffDays} 天 (${diffWeeks} 周 ${remainDays} 天)`
  } else if (mode === 'add' && baseDate) {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + days)
    result = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  return (
    <ToolLayout title="日期计算器" description="计算日期差值或给日期加减天数">
      <div className="btn-group">
        <button className={`btn ${mode === 'diff' ? '' : 'btn-outline'}`} onClick={() => setMode('diff')}>计算日期差</button>
        <button className={`btn ${mode === 'add' ? '' : 'btn-outline'}`} onClick={() => setMode('add')}>日期加减</button>
      </div>

      {mode === 'diff' ? (
        <>
          <div className="tool-row">
            <input className="input" type="date" value={date1} onChange={(e) => setDate1(e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: 'var(--text-dim)' }}>至</span>
            <input className="input" type="date" value={date2} onChange={(e) => setDate2(e.target.value)} style={{ flex: 1 }} />
          </div>
        </>
      ) : (
        <>
          <div className="tool-row">
            <input className="input" type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: 'var(--text-dim)' }}>+</span>
            <input className="input" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 80 }} />
            <span style={{ color: 'var(--text-dim)' }}>天</span>
          </div>
        </>
      )}

      {result && (
        <div className="tool-output" style={{ marginTop: 16, textAlign: 'center', fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>
          {result}
        </div>
      )}
    </ToolLayout>
  )
}
