// src/tools/datetime/WorkdayCalc.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

function isWorkday(d: Date): boolean {
  const day = d.getDay()
  return day !== 0 && day !== 6
}

function countWorkdays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  const dir = start <= end ? 1 : -1
  while ((dir > 0 && cur <= end) || (dir < 0 && cur >= end)) {
    if (isWorkday(cur)) count++
    cur.setDate(cur.getDate() + dir)
  }
  return dir > 0 ? count : -count
}

function addWorkdays(start: Date, days: number): Date {
  const cur = new Date(start)
  let remaining = Math.abs(days)
  const dir = days >= 0 ? 1 : -1
  while (remaining > 0) {
    cur.setDate(cur.getDate() + dir)
    if (isWorkday(cur)) remaining--
  }
  return cur
}

export default function WorkdayCalc() {
  const [mode, setMode] = useState<'count' | 'add'>('count')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [workdays, setWorkdays] = useState(1)

  let result = ''
  if (mode === 'count' && startDate && endDate) {
    const s = new Date(startDate)
    const e = new Date(endDate)
    const days = countWorkdays(s, e)
    const total = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
    const weekends = total - Math.abs(days)
    result = `共 ${Math.abs(days)} 个工作日 (${total} 天，含 ${weekends} 天周末)`
  } else if (mode === 'add' && startDate) {
    const s = new Date(startDate)
    const r = addWorkdays(s, workdays)
    result = r.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  return (
    <ToolLayout title="工作日计算" description="计算两个日期间的工作日数，或给日期加减工作日">
      <div className="btn-group">
        <button className={`btn ${mode === 'count' ? '' : 'btn-outline'}`} onClick={() => setMode('count')}>计算工作日差</button>
        <button className={`btn ${mode === 'add' ? '' : 'btn-outline'}`} onClick={() => setMode('add')}>加减工作日</button>
      </div>
      {mode === 'count' ? (
        <div className="tool-row">
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-dim)' }}>至</span>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ flex: 1 }} />
        </div>
      ) : (
        <div className="tool-row">
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-dim)' }}>+</span>
          <input className="input" type="number" value={workdays} onChange={(e) => setWorkdays(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ color: 'var(--text-dim)' }}>个工作日</span>
        </div>
      )}
      {result && <div className="tool-output" style={{ marginTop: 16, textAlign: 'center', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{result}</div>}
    </ToolLayout>
  )
}
