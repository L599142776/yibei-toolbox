// src/tools/text/RegexTester.tsx
import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as RegExpMatchArray[], error: '' }
    try {
      const re = new RegExp(pattern, flags)
      const all = [...text.matchAll(re)]
      return { matches: all, error: '' }
    } catch (err: unknown) {
      return { matches: [], error: err instanceof Error ? err.message : '正则表达式错误' }
    }
  }, [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!pattern || error) return text
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      return text.replace(re, '<mark style="background:#6366f144;color:var(--accent);border-radius:2px;padding:0 2px">$&</mark>')
    } catch {
      return text
    }
  }, [pattern, flags, text, error])

  return (
    <ToolLayout title="正则表达式测试" description="实时验证正则匹配效果，高亮匹配结果">
      <div className="tool-row">
        <span style={{ fontSize: 18, color: 'var(--text-dim)' }}>/</span>
        <input className="input" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="正则表达式" style={{ flex: 1, fontFamily: 'monospace' }} />
        <span style={{ fontSize: 18, color: 'var(--text-dim)' }}>/</span>
        <input className="input" value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="flags" style={{ width: 60, fontFamily: 'monospace' }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
      <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="测试文本..." />
      <div style={{ marginTop: 16 }}>
        <span className="tool-label">高亮结果 ({matches.length} 个匹配)</span>
        <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: highlighted || '—' }} />
      </div>
      {matches.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <span className="tool-label">匹配详情</span>
          <div className="tool-output" style={{ maxHeight: 200, overflow: 'auto' }}>
            {matches.map((m, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-dim)' }}>#{i + 1}</span> index: {m.index} → <span style={{ color: 'var(--accent)' }}>"{m[0]}"</span>
                {m.length > 1 && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>({m.slice(1).join(', ')})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
