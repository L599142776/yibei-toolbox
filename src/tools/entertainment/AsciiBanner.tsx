import { useState, useEffect, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'

const FONTS = [
  'Standard',
  'Ghost',
  'Big',
  'Mini',
  'Small',
  'Slant',
  'Shadow',
  'Banner',
  'Block',
  'Bubble',
  'Digital',
  'Lean',
  'Script',
]

export default function AsciiBanner() {
  const [text, setText] = useState('Hello')
  const [font, setFont] = useState('Standard')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateBanner = useCallback(async () => {
    if (!text.trim()) {
      setOutput('')
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const figlet = (await import('figlet')).default
      const result = await figlet(text, {
        font: font as string,
      })
      setOutput(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setOutput('')
    } finally {
      setLoading(false)
    }
  }, [text, font])

  useEffect(() => {
    const timer = setTimeout(() => {
      generateBanner()
    }, 300)
    return () => clearTimeout(timer)
  }, [generateBanner])

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'banner.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setText('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout
      title="ASCII Banner 生成器"
      description="将文本转换为ASCII艺术字，支持多种字体样式"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              输入文本
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入要转换的文本"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              字体样式
            </label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={generateBanner}
            disabled={loading || !text.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              background: 'var(--gradient-accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '生成中...' : '生成'}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(255, 77, 79, 0.1)',
              border: '1px solid rgba(255, 77, 79, 0.2)',
              borderRadius: 'var(--radius)',
              color: '#ff4d4f',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {output && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label style={{ fontWeight: 500 }}>生成结果</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  复制
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  下载
                </button>
              </div>
            </div>

            <pre
              style={{
                padding: '16px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.4,
                overflowX: 'auto',
                whiteSpace: 'pre',
                color: 'var(--text)',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {output}
            </pre>
          </div>
        )}

        <div
          style={{
            padding: '12px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            color: 'var(--text-dim)',
          }}
        >
          <strong>提示：</strong>此工具对中文支持有限，建议输入英文、数字或符号。
          <br />
          示例：Hello, World! | 123456 | @#$%^&*
        </div>
      </div>
    </ToolLayout>
  )
}
