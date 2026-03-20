// src/tools/common/PasswordGenerator.tsx
import { useState, useCallback } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

function generate(length: number, flags: Record<string, boolean>): string {
  let chars = ''
  if (flags.lowercase) chars += CHARSETS.lowercase
  if (flags.uppercase) chars += CHARSETS.uppercase
  if (flags.numbers) chars += CHARSETS.numbers
  if (flags.symbols) chars += CHARSETS.symbols
  if (!chars) chars = CHARSETS.lowercase + CHARSETS.uppercase + CHARSETS.numbers

  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (v) => chars[v % chars.length]).join('')
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [flags, setFlags] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  })
  const [password, setPassword] = useState(() => generate(16, { lowercase: true, uppercase: true, numbers: true, symbols: true }))

  const regenerate = useCallback(() => {
    setPassword(generate(length, flags))
  }, [length, flags])

  const copy = () => navigator.clipboard.writeText(password)

  const toggle = (key: string) => {
    const next = { ...flags, [key]: !flags[key as keyof typeof flags] }
    setFlags(next)
    setPassword(generate(length, next))
  }

  return (
    <ToolLayout title="随机密码生成" description="自定义字符集和长度，使用加密安全随机数生成密码">
      <div className="tool-row">
        <label className="tool-label">长度: {length}</label>
        <input
          type="range"
          min={4}
          max={64}
          value={length}
          onChange={(e) => {
            const v = Number(e.target.value)
            setLength(v)
            setPassword(generate(v, flags))
          }}
          style={{ flex: 1 }}
        />
      </div>
      <div className="btn-group">
        {Object.entries(flags).map(([key, val]) => (
          <button
            key={key}
            className={`btn ${val ? '' : 'btn-outline'}`}
            onClick={() => toggle(key)}
          >
            {{ lowercase: 'a-z', uppercase: 'A-Z', numbers: '0-9', symbols: '!@#' }[key]}
          </button>
        ))}
      </div>
      <div className="tool-output" style={{ fontSize: 18, textAlign: 'center', padding: 20 }}>
        {password}
      </div>
      <div className="btn-group" style={{ marginTop: 12 }}>
        <button className="btn" onClick={regenerate}>
          <RefreshCw size={16} /> 重新生成
        </button>
        <button className="btn btn-outline" onClick={copy}>
          <Copy size={16} /> 复制
        </button>
      </div>
    </ToolLayout>
  )
}
