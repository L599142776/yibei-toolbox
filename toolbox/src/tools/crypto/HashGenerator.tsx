// src/tools/crypto/HashGenerator.tsx
import { useState, useCallback } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { md5 } from 'js-md5'

const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

async function hash(algo: string, text: string): Promise<string> {
  if (algo === 'MD5') {
    return md5(text)
  }
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function HashGenerator() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})

  const compute = useCallback(async () => {
    const r: Record<string, string> = {}
    for (const algo of algorithms) {
      r[algo] = await hash(algo, input)
    }
    setResults(r)
  }, [input])

  return (
    <ToolLayout title="哈希生成器" description="MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 哈希计算">
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入要计算哈希的文本..." style={{ minHeight: 100 }} />
      <div className="btn-group" style={{ marginTop: 12 }}>
        <button className="btn" onClick={compute}>计算哈希</button>
      </div>
      {Object.keys(results).length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {algorithms.map((algo) => (
            <div key={algo}>
              <div className="tool-output-label">
                <span className="tool-label">{algo}</span>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(results[algo])}>
                  <Copy size={12} /> 复制
                </button>
              </div>
              <div className="tool-output" style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {results[algo]}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
