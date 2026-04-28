// src/tools/code/CodeFormatter.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type Lang = 'json' | 'html' | 'css' | 'js'

const langLabels: Record<Lang, string> = {
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
}

function formatCode(code: string, lang: Lang): string {
  switch (lang) {
    case 'json': {
      return JSON.stringify(JSON.parse(code), null, 2)
    }
    case 'html': {
      // 简易 HTML 格式化
      let indent = 0
      const pad = '  '
      return code
        .replace(/>\s*</g, '>\n<')
        .split('\n')
        .map((line) => {
          const trimmed = line.trim()
          if (trimmed.match(/^<\//)) indent = Math.max(0, indent - 1)
          const result = pad.repeat(indent) + trimmed
          if (trimmed.match(/^<[^/!][^>]*[^/]>$/) && !trimmed.match(/^<(br|hr|img|input|meta|link)/i)) indent++
          return result
        })
        .join('\n')
    }
    case 'css': {
      return code
        .replace(/\s*{\s*/g, ' {\n')
        .replace(/;\s*/g, ';\n')
        .replace(/\s*}\s*/g, '\n}\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => (l === '}' ? l : l.endsWith('{') ? l : '  ' + l))
        .join('\n')
    }
    case 'js': {
      // 简易 JS 格式化 (基于缩进)
      let indent = 0
      const pad = '  '
      const tokens = code.replace(/\s*([{}();,])\s*/g, '$1').split(/([{}();])/)
      return tokens
        .map((t) => {
          if (t === '{' || t === '(') { const r = pad.repeat(indent) + t; indent++; return r }
          if (t === '}' || t === ')') { indent = Math.max(0, indent - 1); return pad.repeat(indent) + t }
          if (t === ';') return t
          return t.trim() ? pad.repeat(indent) + t.trim() : ''
        })
        .filter(Boolean)
        .join('\n')
    }
  }
}

export default function CodeFormatter() {
  const [input, setInput] = useState('')
  const [lang, setLang] = useState<Lang>('json')

  let output = ''
  let error = ''
  try {
    if (input.trim()) output = formatCode(input, lang)
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : '格式化失败'
  }

  return (
    <ToolLayout title="代码格式化" description="JSON / HTML / CSS / JS 代码美化">
      <div className="btn-group">
        {(Object.keys(langLabels) as Lang[]).map((l) => (
          <button key={l} className={`btn ${lang === l ? '' : 'btn-outline'}`} onClick={() => setLang(l)}>
            {langLabels[l]}
          </button>
        ))}
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={`粘贴 ${langLabels[lang]} 代码...`} style={{ minHeight: 200 }} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      {output && (
        <>
          <div className="tool-output-label" style={{ marginTop: 16 }}>
            <span className="tool-label" style={{ color: '#10b981' }}>✓ 格式化结果</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div className="tool-output" style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>{output}</div>
        </>
      )}
    </ToolLayout>
  )
}
