// src/tools/network/WebSocketTester.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, Send, Trash2, Download, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

interface LogEntry {
  id: number
  time: Date
  direction: 'sent' | 'received'
  content: string
  type: 'text' | 'json' | 'close' | 'error' | 'info'
}

const CLOSE_CODES: Record<number, string> = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1004: 'Reserved',
  1005: 'No Status Received',
  1006: 'Abnormal Closure',
  1007: 'Invalid Frame Payload',
  1008: 'Policy Violation',
  1009: 'Message Too Big',
  1010: 'Required Extension',
  1011: 'Internal Error',
  1012: 'Service Restart',
  1013: 'Try Again Later',
  1014: 'Bad Gateway',
  1015: 'TLS Handshake',
}

export default function WebSocketTester() {
  const [url, setUrl] = useState('wss://echo.websocket.org')
  const [headers, setHeaders] = useState('')
  const [subprotocol, setSubprotocol] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoReconnect, setAutoReconnect] = useState(false)
  const [reconnectInterval, setReconnectInterval] = useState(3000)
  const [autoSendInterval, setAutoSendInterval] = useState(0)
  const [formatJson, setFormatJson] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [showConfig, setShowConfig] = useState(true)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logIdRef = useRef(0)

  const addLog = useCallback((direction: 'sent' | 'received', content: string, type: LogEntry['type'] = 'text') => {
    const entry: LogEntry = {
      id: ++logIdRef.current,
      time: new Date(),
      direction,
      content,
      type,
    }
    setLogs((prev) => [...prev, entry])
  }, [])

  const clearLogs = () => {
    setLogs([])
    setExpandedLogs(new Set())
  }

  const exportLogs = () => {
    const content = logs
      .map((log) => {
        const time = log.time.toLocaleTimeString('zh-CN', { hour12: false })
        const dir = log.direction === 'sent' ? '↑ SENT' : '↓ RECEIVED'
        const preview = log.content.length > 200 ? log.content.slice(0, 200) + '...' : log.content
        return `[${time}] ${dir} [${log.type.toUpperCase()}]\n${preview}\n`
      })
      .join('\n' + '-'.repeat(60) + '\n\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `websocket-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleExpand = (id: number) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Mutable connect function that can reference itself via ref
  const connectFnRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setConnecting(true)
    addLog('received', `Connecting to ${url}...`, 'info')

    try {
      // Parse headers
      const hdrs: Record<string, string> = {}
      if (headers.trim()) {
        headers.split('\n').forEach((line) => {
          const [k, ...v] = line.split(':')
          if (k && v.length) hdrs[k.trim()] = v.join(':').trim()
        })
      }

      // Create WebSocket
      const protocols = subprotocol.trim() ? [subprotocol.trim()] : undefined
      const ws = new WebSocket(url, protocols)
      wsRef.current = ws

      // Connection timeout
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          addLog('received', 'Connection timeout', 'error')
          setConnecting(false)
        }
      }, 10000)

      ws.onopen = () => {
        clearTimeout(timeout)
        setConnected(true)
        setConnecting(false)
        addLog('received', `Connected to ${url}`, 'info')
        
        // Set up auto-reconnect if enabled
        if (autoReconnect) {
          addLog('received', `Auto-reconnect enabled (${reconnectInterval}ms)`, 'info')
        }
      }

      ws.onmessage = (event) => {
        let content = event.data
        let type: LogEntry['type'] = 'text'
        
        // Try to detect JSON
        if (formatJson) {
          try {
            const parsed = JSON.parse(content)
            content = JSON.stringify(parsed, null, 2)
            type = 'json'
          } catch {
            // Not JSON, keep as text
          }
        }
        
        addLog('received', content, type)
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        addLog('received', 'WebSocket error occurred', 'error')
      }

      ws.onclose = (event) => {
        clearTimeout(timeout)
        setConnected(false)
        setConnecting(false)
        
        const codeInfo = CLOSE_CODES[event.code] || 'Unknown'
        addLog('received', `Connection closed: ${event.code} (${codeInfo})${event.reason ? ` - ${event.reason}` : ''}`, 'close')
        
        // Auto-reconnect
        if (autoReconnect && event.code !== 1000) {
          addLog('received', `Reconnecting in ${reconnectInterval}ms...`, 'info')
          reconnectTimerRef.current = setTimeout(() => {
            connectFnRef.current()
          }, reconnectInterval)
        }
      }
    } catch (err: unknown) {
      setConnecting(false)
      const message = err instanceof Error ? err.message : String(err)
      addLog('received', `Failed to connect: ${message}`, 'error')
    }
  }, [url, headers, subprotocol, autoReconnect, reconnectInterval, formatJson, addLog])

  // Keep the ref in sync with the latest connect function
  useEffect(() => {
    connectFnRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }
    setConnected(false)
    setConnecting(false)
  }, [])

  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('sent', 'Cannot send: not connected', 'error')
      return
    }

    let content = message.trim()
    if (!content) return

    // Format JSON if enabled
    let type: LogEntry['type'] = 'text'
    if (formatJson) {
      try {
        const parsed = JSON.parse(content)
        content = JSON.stringify(parsed, null, 2)
        type = 'json'
      } catch {
        // Not JSON, keep as text
      }
    }

    wsRef.current.send(message)
    addLog('sent', content, type)
    setMessage('')
  }, [message, formatJson, addLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (autoSendTimerRef.current) clearInterval(autoSendTimerRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // Auto-send timer
  useEffect(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current)
      autoSendTimerRef.current = null
    }
    
    if (autoSendInterval > 0 && connected) {
      autoSendTimerRef.current = setInterval(() => {
        if (message.trim()) sendMessage()
      }, autoSendInterval)
    }
    
    return () => {
      if (autoSendTimerRef.current) {
        clearInterval(autoSendTimerRef.current)
        autoSendTimerRef.current = null
      }
    }
  }, [autoSendInterval, connected, message, sendMessage])

  // Filter logs by search query
  const filteredLogs = searchQuery
    ? logs.filter((log) => log.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : logs

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  return (
    <ToolLayout title="WebSocket 测试器" description="调试 WebSocket 连接，实时发送和接收消息">
      {/* Connection Config */}
      <div className="tool-section">
        <button className="tool-section-toggle" onClick={() => setShowConfig(!showConfig)}>
          <span>连接配置</span>
          {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showConfig && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="wss://echo.websocket.org"
                style={{ flex: 1 }}
              />
            </div>
            
            <div>
              <span className="tool-label">请求头 (每行一个 key: value)</span>
              <textarea
                className="textarea"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder="Authorization: Bearer xxx"
                style={{ minHeight: 50, fontSize: 12 }}
              />
            </div>
            
            <div>
              <span className="tool-label">Subprotocol (可选)</span>
              <input
                className="input"
                value={subprotocol}
                onChange={(e) => setSubprotocol(e.target.value)}
                placeholder="graphql-ws"
              />
            </div>
          </div>
        )}
      </div>

      {/* Connection Controls */}
      <div className="tool-row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {!connected ? (
          <button
            className="btn btn-primary"
            onClick={connect}
            disabled={connecting || !url.trim()}
          >
            <Wifi size={16} />
            {connecting ? '连接中...' : '连接'}
          </button>
        ) : (
          <button className="btn btn-danger" onClick={disconnect}>
            <WifiOff size={16} />
            断开
          </button>
        )}
        
        <div className="status-indicator">
          <span className={`status-dot ${connected ? 'status-connected' : connecting ? 'status-connecting' : 'status-disconnected'}`} />
          <span>{connected ? '已连接' : connecting ? '连接中...' : '未连接'}</span>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
            />
            自动重连
          </label>
          {autoReconnect && (
            <select
              className="select"
              value={reconnectInterval}
              onChange={(e) => setReconnectInterval(Number(e.target.value))}
              style={{ width: 80 }}
            >
              <option value={1000}>1s</option>
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
            </select>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div style={{ marginTop: 12 }}>
        <div className="tool-row" style={{ gap: 8 }}>
          <textarea
            className="textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='{"type": "ping"}'
            style={{ flex: 1, minHeight: 60, fontSize: 13 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={!connected || !message.trim()}
            >
              <Send size={16} />
              发送
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={formatJson}
                onChange={(e) => setFormatJson(e.target.checked)}
              />
              JSON
            </label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoSendInterval > 0}
              onChange={(e) => setAutoSendInterval(e.target.checked ? 1000 : 0)}
              disabled={!connected}
            />
            自动发送
          </label>
          {autoSendInterval > 0 && (
            <select
              className="select"
              value={autoSendInterval}
              onChange={(e) => setAutoSendInterval(Number(e.target.value))}
              style={{ width: 80 }}
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>
            Ctrl+Enter 快速发送
          </span>
        </div>
      </div>

      {/* Message Log */}
      <div style={{ marginTop: 16 }}>
        <div className="tool-row" style={{ marginBottom: 8 }}>
          <span className="tool-label" style={{ margin: 0 }}>
            消息日志 ({filteredLogs.length}/{logs.length})
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索消息..."
                style={{ paddingLeft: 28, width: 140, height: 30, fontSize: 12 }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="btn-icon" onClick={exportLogs} title="导出日志">
              <Download size={16} />
            </button>
            <button className="btn-icon" onClick={clearLogs} title="清空日志">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="tool-output" style={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
              {searchQuery ? '没有找到匹配的消息' : '暂无消息日志'}
            </div>
          ) : (
            <div style={{ fontSize: 12 }}>
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id)
                const isLong = log.content.length > 300
                const displayContent = isExpanded || !isLong ? log.content : log.content.slice(0, 300) + '...'
                
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: log.direction === 'sent' ? '3px solid #3b82f6' : '3px solid #10b981',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                        {formatTime(log.time)}
                      </span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 600,
                          background:
                            log.direction === 'sent'
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          color: log.direction === 'sent' ? '#3b82f6' : '#10b981',
                        }}
                      >
                        {log.direction === 'sent' ? '↑ 发送' : '↓ 接收'}
                      </span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontSize: 10,
                          background:
                            log.type === 'json'
                              ? 'rgba(168, 85, 247, 0.2)'
                              : log.type === 'error'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : log.type === 'close'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(107, 114, 128, 0.2)',
                          color:
                            log.type === 'json'
                              ? '#a855f7'
                              : log.type === 'error'
                              ? '#ef4444'
                              : log.type === 'close'
                              ? '#f59e0b'
                              : '#6b7280',
                        }}
                      >
                        {log.type.toUpperCase()}
                      </span>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: log.type === 'json' ? 'monospace' : 'inherit',
                        color: log.type === 'error' ? '#ef4444' : 'inherit',
                      }}
                    >
                      {displayContent}
                    </pre>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: '4px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={12} /> 收起
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> 展开全部
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 13;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-connected {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }
        .status-connecting {
          background: #f59e0b;
          animation: pulse 1s infinite;
        }
        .status-disconnected {
          background: #6b7280;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: var(--bg-hover);
          color: var(--text);
        }
        .tool-section {
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .tool-section-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13;
          font-weight: 500;
          color: var(--text);
        }
        .tool-section-toggle:hover {
          background: var(--bg-hover);
        }
        .tool-section > div:last-child {
          padding: 0 12px 12px;
        }
      `}</style>
    </ToolLayout>
  )
}
