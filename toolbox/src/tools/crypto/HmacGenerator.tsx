// src/tools/crypto/HmacGenerator.tsx
import { useState, useCallback } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'

const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

async function hmac(algo: string, key: string, data: string): Promise<string> {
  const keyData = new TextEncoder().encode(key)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: algo }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function HmacGenerator() {
  const [key, setKey] = useState('')
  const [data, setData] = useState('')
  const [algo, setAlgo] = useState<string>('SHA-256')
  const [result, setResult] = useState('')

  const compute = useCallback(async () => {
    if (!key || !data) return
    setResult(await hmac(algo, key, data))
  }, [algo, key, data])

  return (
    <ToolLayout title="HMAC 生成器" description="使用密钥计算 HMAC 哈希值">
      <div className="tool-row">
        <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="密钥 (secret key)" style={{ flex: 1 }} />
        <Select
          value={algo}
          onChange={v => setAlgo(v)}
          options={algos.map(a => ({ value: a, label: a }))}
        />
      </div>
      <textarea className="textarea" value={data} onChange={(e) => setData(e.target.value)} placeholder="输入数据..." style={{ minHeight: 80, marginTop: 12 }} />
      <div className="btn-group" style={{ marginTop: 12 }}>
        <button className="btn" onClick={compute}>计算 HMAC</button>
      </div>
      {result && (
        <div>
          <div className="tool-output-label" style={{ marginTop: 12 }}>
            <span className="tool-label">{algo} HMAC</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(result)}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div className="tool-output" style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{result}</div>
        </div>
      )}
    </ToolLayout>
  )
}
