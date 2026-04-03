// src/tools/datetime/Timezone.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

const timezones = [
  { id: 'Asia/Shanghai', label: '北京/上海 (UTC+8)' },
  { id: 'Asia/Tokyo', label: '东京 (UTC+9)' },
  { id: 'America/New_York', label: '纽约 (UTC-5)' },
  { id: 'America/Los_Angeles', label: '洛杉矶 (UTC-8)' },
  { id: 'Europe/London', label: '伦敦 (UTC+0)' },
  { id: 'Europe/Paris', label: '巴黎 (UTC+1)' },
  { id: 'Europe/Berlin', label: '柏林 (UTC+1)' },
  { id: 'Australia/Sydney', label: '悉尼 (UTC+11)' },
  { id: 'Asia/Dubai', label: '迪拜 (UTC+4)' },
  { id: 'Asia/Singapore', label: '新加坡 (UTC+8)' },
  { id: 'Asia/Kolkata', label: '新德里 (UTC+5:30)' },
  { id: 'Pacific/Auckland', label: '奥克兰 (UTC+12)' },
  { id: 'UTC', label: 'UTC' },
]

export default function Timezone() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [fromTz, setFromTz] = useState('Asia/Shanghai')

  let results: { tz: string; label: string; time: string }[] = []

  if (date && time) {
    try {
      const dt = new Date(`${date}T${time}`)
      results = timezones.map((tz) => {
        try {
          return {
            tz: tz.id,
            label: tz.label,
            time: dt.toLocaleString('zh-CN', { timeZone: tz.id, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }),
          }
        } catch {
          return { tz: tz.id, label: tz.label, time: '—' }
        }
      })
    } catch {}
  }

  return (
    <ToolLayout title="时区转换" description="在不同时区之间转换时间">
      <div className="tool-row">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} step={1} />
        <Select
          value={fromTz}
          onChange={v => setFromTz(v)}
          options={timezones.map(tz => ({ value: tz.id, label: tz.label }))}
        />
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <span className="tool-label">各时区时间</span>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {results.map((r) => (
              <div key={r.tz} className="tool-row" style={{ justifyContent: 'space-between' }}>
                <span className="tool-label" style={{ width: 180 }}>{r.label}</span>
                <div className="tool-output" style={{ flex: 1, fontSize: 13 }}>{r.time}</div>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigator.clipboard.writeText(r.time)}>
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
