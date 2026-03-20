// src/tools/common/UuidGenerator.tsx
import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

function generateUUID(): string {
  return crypto.randomUUID()
}

export default function UuidGenerator() {
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>(() => [generateUUID()])
  const [upper, setUpper] = useState(false)

  const regenerate = () => {
    const arr = Array.from({ length: count }, () => generateUUID())
    setUuids(upper ? arr.map((u) => u.toUpperCase()) : arr)
  }

  const copyAll = () => navigator.clipboard.writeText(uuids.join('\n'))

  return (
    <ToolLayout title="UUID 生成器" description="生成 UUID v4 唯一标识符">
      <div className="tool-row">
        <label className="tool-label">数量:</label>
        <input
          className="input"
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
          style={{ width: 80 }}
        />
        <button
          className={`btn ${upper ? '' : 'btn-outline'}`}
          onClick={() => {
            setUpper(!upper)
            setUuids(uuids.map((u) => (!upper ? u.toUpperCase() : u.toLowerCase())))
          }}
        >
          大写
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }}>
        {uuids.join('\n')}
      </div>
      <div className="btn-group" style={{ marginTop: 12 }}>
        <button className="btn" onClick={regenerate}>
          <RefreshCw size={16} /> 重新生成
        </button>
        <button className="btn btn-outline" onClick={copyAll}>
          <Copy size={16} /> 复制全部
        </button>
      </div>
    </ToolLayout>
  )
}
