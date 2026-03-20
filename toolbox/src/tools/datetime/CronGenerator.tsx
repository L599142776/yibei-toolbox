// src/tools/datetime/CronGenerator.tsx
import { useState, useMemo } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

function parseCron(expr: string): string[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return ['⚠ Cron 表达式需要 5 个字段']
  const [min, hour, day, month, weekday] = parts

  const desc: string[] = []
  if (min === '*') desc.push('每分钟')
  else desc.push(`第 ${min} 分钟`)

  if (hour === '*') desc.push('每小时')
  else desc.push(`${hour} 时`)

  if (day === '*') desc.push('每天')
  else desc.push(`${day} 日`)

  if (month === '*') desc.push('每月')
  else desc.push(`${month} 月`)

  if (weekday === '*') desc.push('不限星期')
  else desc.push(`星期 ${weekday}`)

  return desc
}

function nextRuns(expr: string, count = 5): string[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const runs: string[] = []
  const now = new Date()
  let cur = new Date(now)

  while (runs.length < count && runs.length < 10000) {
    cur = new Date(cur.getTime() + 60000) // +1 min
    const [minP, hourP, dayP, monthP, weekdayP] = parts

    const matchField = (val: number, pattern: string): boolean => {
      if (pattern === '*') return true
      if (pattern.includes(',')) return pattern.split(',').some((p) => matchField(val, p.trim()))
      if (pattern.includes('/')) {
        const [, step] = pattern.split('/')
        return val % Number(step) === 0
      }
      if (pattern.includes('-')) {
        const [a, b] = pattern.split('-').map(Number)
        return val >= a && val <= b
      }
      return val === Number(pattern)
    }

    if (
      matchField(cur.getMinutes(), minP) &&
      matchField(cur.getHours(), hourP) &&
      matchField(cur.getDate(), dayP) &&
      matchField(cur.getMonth() + 1, monthP) &&
      matchField(cur.getDay(), weekdayP)
    ) {
      runs.push(cur.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))
    }
  }
  return runs
}

const presets = [
  { label: '每分钟', cron: '* * * * *' },
  { label: '每小时', cron: '0 * * * *' },
  { label: '每天 0 点', cron: '0 0 * * *' },
  { label: '每周一 9 点', cron: '0 9 * * 1' },
  { label: '每月 1 号', cron: '0 0 1 * *' },
  { label: '工作日 9 点', cron: '0 9 * * 1-5' },
]

export default function CronGenerator() {
  const [cron, setCron] = useState('0 9 * * 1-5')

  const desc = useMemo(() => parseCron(cron), [cron])
  const runs = useMemo(() => nextRuns(cron), [cron])

  return (
    <ToolLayout title="Cron 表达式生成器" description="解析 Cron 表达式，预览最近执行时间">
      <div className="btn-group">
        {presets.map((p) => (
          <button key={p.cron} className="btn btn-outline" onClick={() => setCron(p.cron)}>{p.label}</button>
        ))}
      </div>
      <div className="tool-row">
        <input className="input" value={cron} onChange={(e) => setCron(e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: 18, textAlign: 'center' }} />
        <button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(cron)}><Copy size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '16px 0', textAlign: 'center' }}>
        {['分钟', '小时', '日', '月', '星期'].map((label, i) => (
          <div key={label} className="tool-output" style={{ padding: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</div>
            <div style={{ fontFamily: 'monospace' }}>{cron.split(' ')[i] || '*'}</div>
          </div>
        ))}
      </div>
      <div className="tool-output" style={{ marginBottom: 16, textAlign: 'center' }}>
        {desc.join(' · ')}
      </div>
      {runs.length > 0 && (
        <>
          <span className="tool-label">最近 5 次执行时间</span>
          <div className="tool-output">
            {runs.map((r, i) => <div key={i} style={{ padding: '4px 0' }}>{i + 1}. {r}</div>)}
          </div>
        </>
      )}
    </ToolLayout>
  )
}
