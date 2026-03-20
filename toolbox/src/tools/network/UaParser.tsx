// src/tools/network/UaParser.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

function parseUA(ua: string) {
  const result: Record<string, string> = {}

  // Browser
  let m = ua.match(/(Firefox|Edg|Chrome|Safari|Opera|OPR)\/?([\d.]+)?/)
  if (m) {
    const browsers: Record<string, string> = { 'Edg': 'Microsoft Edge', 'OPR': 'Opera', 'Chrome': 'Chrome', 'Firefox': 'Firefox', 'Safari': 'Safari', 'Opera': 'Opera' }
    result['浏览器'] = browsers[m[1]] || m[1] + (m[2] ? ` ${m[2]}` : '')
  }

  // OS
  if (ua.includes('Windows NT 10')) result['操作系统'] = 'Windows 10/11'
  else if (ua.includes('Windows NT 6.3')) result['操作系统'] = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.1')) result['操作系统'] = 'Windows 7'
  else if (ua.includes('Mac OS X')) {
    const osm = ua.match(/Mac OS X ([\d_.]+)/)
    result['操作系统'] = 'macOS' + (osm ? ` ${osm[1].replace(/_/g, '.')}` : '')
  }
  else if (ua.includes('Linux')) result['操作系统'] = 'Linux'
  else if (ua.match(/iPhone|iPad/)) {
    const osm = ua.match(/OS ([\d_]+)/)
    result['操作系统'] = ua.includes('iPad') ? 'iPadOS' : 'iOS' + (osm ? ` ${osm[1].replace(/_/g, '.')}` : '')
  }
  else if (ua.includes('Android')) {
    const osm = ua.match(/Android ([\d.]+)/)
    result['操作系统'] = 'Android' + (osm ? ` ${osm[1]}` : '')
  }

  // Architecture
  if (ua.includes('x64') || ua.includes('WOW64') || ua.includes('Win64')) result['架构'] = 'x64'
  else if (ua.includes('x86') || ua.includes('i686')) result['架构'] = 'x86'
  else if (ua.includes('arm64') || ua.includes('aarch64')) result['架构'] = 'ARM64'

  // Mobile
  if (ua.match(/Mobile|Android|iPhone|iPod/)) result['设备类型'] = '移动端'
  else if (ua.match(/Tablet|iPad/)) result['设备类型'] = '平板'
  else result['设备类型'] = '桌面端'

  return result
}

export default function UaParser() {
  const [ua, setUa] = useState('')

  const parsed = ua ? parseUA(ua) : {}

  return (
    <ToolLayout title="User-Agent 解析" description="解析 UA 字符串，提取浏览器、系统、设备信息">
      <textarea className="textarea" value={ua} onChange={(e) => setUa(e.target.value)}
        placeholder="粘贴 User-Agent 字符串..." style={{ minHeight: 80, fontSize: 12 }} />
      {Object.keys(parsed).length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="tool-row" style={{ justifyContent: 'space-between' }}>
              <span className="tool-label">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-outline" onClick={() => setUa(navigator.userAgent)}>使用当前浏览器 UA</button>
      </div>
    </ToolLayout>
  )
}
