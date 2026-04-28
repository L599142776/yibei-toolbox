import { useState } from 'react'
import { Copy, Check, ArrowRight, Loader2, AlertCircle, Link } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

interface RedirectStep {
  url: string
  status: number
  statusText: string
  location?: string
}

interface UnshortenResult {
  success: boolean
  steps: RedirectStep[]
  finalUrl?: string
  error?: string
}

async function unshortenUrl(url: string, maxRedirects = 20): Promise<UnshortenResult> {
  const steps: RedirectStep[] = []
  let currentUrl = url
  const visited = new Set<string>()

  for (let i = 0; i < maxRedirects; i++) {
    if (visited.has(currentUrl)) {
      return { success: false, steps, error: '检测到循环重定向' }
    }
    visited.add(currentUrl)

    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      })

      const status = response.status
      const step: RedirectStep = {
        url: currentUrl,
        status,
        statusText: response.statusText || getStatusText(status),
      }

      const location = response.headers.get('Location') || response.headers.get('location')
      
      if (location) {
        try {
          step.location = new URL(location, currentUrl).href
        } catch {
          step.location = location
        }
        steps.push(step)
        currentUrl = step.location
      } else {
        steps.push(step)
        break
      }
    } catch (err) {
      return {
        success: false,
        steps,
        error: err instanceof Error ? err.message : '网络请求失败'
      }
    }
  }

  const finalStep = steps[steps.length - 1]
  return { success: true, steps, finalUrl: finalStep?.url }
}

function getStatusText(status: number): string {
  const texts: Record<number, string> = {
    200: 'OK',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
  }
  return texts[status] || ''
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'var(--success, #10b981)'
  if (status >= 300 && status < 400) return 'var(--accent, #f59e0b)'
  if (status >= 400) return 'var(--error, #ef4444)'
  return 'var(--text-secondary)'
}

// Parse multiple URLs from input
function parseUrls(input: string): string[] {
  return input
    .split(/[\n,;]/)
    .map(u => u.trim())
    .filter(u => {
      try {
        new URL(u)
        return true
      } catch {
        return false
      }
    })
}

export default function UrlUnshortener() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Map<string, UnshortenResult>>(new Map())
  const [loading, setLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [isBatch, setIsBatch] = useState(false)

  const handleUnshorten = async () => {
    const urls = parseUrls(input)
    if (urls.length === 0) return

    setLoading(true)
    setResults(new Map())
    setIsBatch(urls.length > 1)

    const newResults = new Map<string, UnshortenResult>()

    // Process URLs concurrently with limit
    const batchSize = 5
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(url => unshortenUrl(url))
      )
      batch.forEach((url, idx) => {
        newResults.set(url, batchResults[idx])
      })
      setResults(new Map(newResults))
    }

    setLoading(false)
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedUrl(key)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleUnshorten()
    }
  }

  const urls = parseUrls(input)

  return (
    <ToolLayout 
      title="短链接还原" 
      description="追踪短链接重定向，显示完整跳转链和最终目标地址"
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBatch 
              ? "输入多个短链接（换行分隔）\nhttps://t.cn/abc123\nhttps://bit.ly/xyz789" 
              : "输入短链接，如 https://t.cn/abc123"
            }
            style={{ flex: 1, minHeight: isBatch ? 100 : 'auto', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className="btn btn-primary"
            onClick={handleUnshorten}
            disabled={loading || urls.length === 0}
            style={{ minWidth: 120 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>还原中...</span>
              </>
            ) : (
              <>
                <Link size={16} />
                <span>还原链接</span>
              </>
            )}
          </button>
          {urls.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {urls.length} 个链接 {urls.length > 1 && '(批量模式)'}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          支持: t.cn、url.cn、dwz.cn、bit.ly、tinyurl.com、goo.gl 等主流短链接服务
        </p>
      </div>

      {results.size > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from(results.entries()).map(([url, result], idx) => (
            <div key={url} className="card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                {isBatch && (
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                    #{idx + 1}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>原始链接:</span>
                  <code style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{url}</code>
                </div>
              </div>

              {!result.success && result.error && (
                <div style={{ 
                  padding: 12, 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--error, #ef4444)',
                  fontSize: 13
                }}>
                  <AlertCircle size={16} />
                  <span>{result.error}</span>
                </div>
              )}

              {result.steps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {result.steps.map((step, stepIdx) => {
                    const isFinal = stepIdx === result.steps.length - 1
                    return (
                      <div key={stepIdx}>
                        <div style={{ 
                          padding: '10px 12px',
                          background: isFinal ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10
                        }}>
                          <span style={{ 
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: getStatusColor(step.status) + '20',
                            color: getStatusColor(step.status),
                            minWidth: 40,
                            textAlign: 'center',
                            flexShrink: 0
                          }}>
                            {step.status}
                          </span>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: 13, 
                              wordBreak: 'break-all',
                              color: isFinal ? 'var(--success, #10b981)' : 'var(--text)'
                            }}>
                              {step.url}
                            </div>
                            {step.location && stepIdx === stepIdx && (
                              <div style={{ 
                                fontSize: 11, 
                                color: 'var(--text-secondary)',
                                marginTop: 4 
                              }}>
                                → {step.location}
                              </div>
                            )}
                            {isFinal && (
                              <span style={{ 
                                fontSize: 11, 
                                color: 'var(--success, #10b981)',
                                fontWeight: 500,
                                marginTop: 4,
                                display: 'block'
                              }}>
                                最终地址
                              </span>
                            )}
                          </div>

                          {isFinal && result.finalUrl && (
                            <button
                              className="btn btn-outline"
                              onClick={() => copyToClipboard(result.finalUrl!, url)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0
                              }}
                            >
                              {copiedUrl === url ? (
                                <>
                                  <Check size={12} />
                                  <span>已复制</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>复制</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {!isFinal && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            padding: '4px 0'
                          }}>
                            <ArrowRight 
                              size={14} 
                              style={{ 
                                color: 'var(--text-secondary)',
                                transform: 'rotate(-45deg)'
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {result.success && result.finalUrl && (
                <div style={{ 
                  marginTop: 12,
                  padding: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    目标地址:
                  </span>
                  <a 
                    href={result.finalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: 13, 
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                      flex: 1
                    }}
                  >
                    {result.finalUrl}
                  </a>
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(result.finalUrl!, url)}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0
                    }}
                  >
                    {copiedUrl === url ? (
                      <>
                        <Check size={12} />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'var(--bg-secondary)', 
        borderRadius: 8,
        fontSize: 13 
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
          💡 使用提示
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <li>支持批量处理多个短链接，每行一个</li>
          <li>可检测常见的短链接服务 (t.cn、bit.ly、tinyurl 等)</li>
          <li>显示完整的重定向链和每步的 HTTP 状态码</li>
          <li>200 状态码表示已到达最终页面</li>
          <li>部分短链接可能因跨域限制无法完全还原</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </ToolLayout>
  )
}
