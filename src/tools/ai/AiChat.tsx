// src/tools/ai/AiChat.tsx
// AI 对话 - 重新设计布局

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Bot,
  User,
  X,
  Copy,
  Loader2,
  Plus,
  Trash2,
  Paperclip,
  Square,
  MessageSquare,
} from 'lucide-react'
import { marked } from 'marked'
import {
  type ChatMessage,
  type ModelInfo,
  type TemplateConfig,
  type Session,
  login,
  fetchTemplateConfig,
  fetchSessionList,
  createSession,
  fetchMessageRecords,
  sendChatMessage,
  deleteSession,
  groupModelsByTag,
  messagesToChatMessages,
  validateFiles,
  fileToBase64,
} from './chatApi'

export default function AiChat() {
  // 功能暂未开放
  return (
    <div className="ai-chat-unavailable">
      <div className="unavailable-content">
        <Bot size={64} className="unavailable-icon" />
        <h2>AI 对话功能暂未开放</h2>
        <p>此功能正在完善中，敬请期待后续更新</p>
        <div className="unavailable-badge">即将推出</div>
      </div>

      <style>{`
        .ai-chat-unavailable {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--color-bg-primary);
        }

        .unavailable-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          max-width: 400px;
        }

        .unavailable-icon {
          color: var(--color-primary);
          opacity: 0.6;
        }

        .unavailable-content h2 {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .unavailable-content p {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.6;
        }

        .unavailable-badge {
          padding: 6px 16px;
          background: var(--color-primary);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 8px;
        }
      `}</style>
    </div>
  )

  // ============================================================
  // 认证
  // ============================================================
  const [isLoggingIn, setIsLoggingIn] = useState(true)
  const [loginError, setLoginError] = useState('')

  // ============================================================
  // 配置
  // ============================================================
  const [config, setConfig] = useState<TemplateConfig | null>(null)
  const [modelGroups, setModelGroups] = useState<Map<string, ModelInfo[]>>(new Map())

  // ============================================================
  // 模型
  // ============================================================
  const [selectedModel, setSelectedModel] = useState('')

  // ============================================================
  // 会话
  // ============================================================
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ============================================================
  // 消息
  // ============================================================
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showTokens, setShowTokens] = useState(false)

  // ============================================================
  // Refs
  // ============================================================
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ============================================================
  // 初始化
  // ============================================================
  useEffect(() => {
    const initChat = async () => {
      setIsLoggingIn(true)
      setLoginError('')

      try {
        await login()

        const templateConfig = await fetchTemplateConfig()
        setConfig(templateConfig)
        setModelGroups(groupModelsByTag(templateConfig.models))
        setSelectedModel(templateConfig.defModel)
        setShowTokens(templateConfig.showTokens)

        await loadSessions(1)
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : '登录失败')
      } finally {
        setIsLoggingIn(false)
      }
    }

    initChat()
  }, [])

  // ============================================================
  // 滚动到底部
  // ============================================================
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ============================================================
  // 会话管理
  // ============================================================
  const loadSessions = async (page: number) => {
    setSessionsLoading(true)

    try {
      const data = await fetchSessionList(page)

      if (page === 1) {
        setSessions(data.records)
      } else {
        setSessions((prev) => [...prev, ...data.records])
      }

      setHasMoreSessions(page < 10)
      setSessionsPage(page)
    } catch (err) {
      console.error('加载会话失败:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const switchSession = async (session: Session) => {
    if (currentSession?.id === session.id) return

    setCurrentSession(session)

    try {
      const data = await fetchMessageRecords(session.id, 1)
      setMessages(messagesToChatMessages(data.records))
    } catch (err) {
      console.error('加载消息失败:', err)
      setMessages([])
    }
  }

  const handleNewSession = async () => {
    try {
      const newSession = await createSession(selectedModel)
      setSessions((prev) => [newSession, ...prev])
      switchSession(newSession)
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建会话失败')
    }
  }

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await deleteSession(sessionId)

      setSessions((prev) => prev.filter((s) => s.id !== sessionId))

      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)

        if (remaining.length > 0) {
          switchSession(remaining[0])
        } else {
          setCurrentSession(null)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('删除会话失败:', err)
      setError(err instanceof Error ? err.message : '删除会话失败')
    }
  }

  // ============================================================
  // 文件处理
  // ============================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  // ============================================================
  // 聊天
  // ============================================================
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!config) return

    const validation = validateFiles(files, config)
    if (!validation.valid) {
      setError(validation.error || '文件验证失败')
      return
    }

    const userText = input.trim()

    const userMessage: ChatMessage = {
      role: 'user',
      content: userText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    const fileInfos = []
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file)
        fileInfos.push({
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
        })
      } catch {
        console.error('文件转换失败:', file.name)
      }
    }

    try {
      await sendChatMessage({
        text: userText,
        sessionId: currentSession?.id,
        files: fileInfos,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1

            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + chunk,
              }
            }

            return updated
          })
        },
        onComplete: () => {
          setIsLoading(false)
        },
        onFinal: (finalData) => {
          if (finalData) {
            setMessages((prev) => {
              const updated = [...prev]
              const lastIdx = updated.length - 1

              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  tokens: {
                    promptTokens: finalData.promptTokens,
                    completionTokens: finalData.completionTokens,
                    useTokens: finalData.useTokens,
                    deductCount: finalData.deductCount,
                  },
                }
              }

              return updated
            })
          }
        },
        onError: (err) => {
          setError(err.message)
          setIsLoading(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
      setIsLoading(false)
    } finally {
      setFiles([])
    }
  }

  const handleStop = () => {
    const controller = new AbortController()
    controller.abort()
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    setError('')
    setCurrentSession(null)
  }



  // ============================================================
  // 渲染
  // ============================================================

  if (isLoggingIn) {
    return (
      <div className="ai-chat-page">
        <div className="ai-chat-loading">
          <Loader2 size={48} className="spinning" />
          <p>加载中...</p>
        </div>

        <style>{`
          .ai-chat-page {
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .ai-chat-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 48px;
            color: var(--color-text-secondary);
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (loginError) {
    return (
      <div className="ai-chat-page">
        <div className="ai-chat-error">
          <p>登录失败</p>
          <p className="error-text">{loginError}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>

        <style>{`
          .ai-chat-page {
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .ai-chat-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 48px;
            text-align: center;
          }

          .error-text {
            color: var(--color-error);
            font-size: 14px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="ai-chat-page">
      {/* 侧边栏 */}
      {sidebarOpen && (
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <button className="btn-new-session" onClick={handleNewSession}>
              <Plus size={16} />
              <span>新建对话</span>
            </button>
          </div>

          <div className="session-list">
            {sessionsLoading && sessions.length === 0 ? (
              <div className="loading-placeholder">
                <Loader2 size={20} className="spinning" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="session-empty">
                <MessageSquare size={24} />
                <span>暂无对话</span>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${
                    currentSession?.id === session.id ? 'active' : ''
                  }`}
                  onClick={() => switchSession(session)}
                >
                  <div className="session-info">
                    <span className="session-name">{session.name}</span>
                    <span className="session-time">
                      {new Date(session.updated).toLocaleDateString()}
                    </span>
                  </div>
                  {config?.rm && (
                    <button
                      className="btn-delete-session"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}

            {hasMoreSessions && !sessionsLoading && (
              <div className="load-more" onClick={() => loadSessions(sessionsPage + 1)}>
                加载更多
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主聊天区域 */}
      <div className="chat-main">
        {/* 顶部栏 */}
        <div className="chat-header">
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
          >
            <MessageSquare size={18} />
          </button>

          <div className="header-left">
            <div className="model-selector">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="tool-select"
              >
                {Array.from(modelGroups.entries()).map(([tag, models]) => (
                  <optgroup key={tag} label={tag}>
                    {models.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="header-right">
            <button className="btn-icon" onClick={handleClear} title="清空对话">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button className="btn-close" onClick={() => setError('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* 消息列表 */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <Bot size={48} />
              <div
                className="welcome-text"
                dangerouslySetInnerHTML={{
                  __html: config?.defaultChat || '您好，有什么可以帮助您的吗？',
                }}
              />
              <p className="model-hint">当前模型: {selectedModel}</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
              </div>
              <div className="message-content">
                {msg.content ? (
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                ) : (
                  msg.role === 'assistant' && isLoading && idx === messages.length - 1
                    ? '正在思考...'
                    : ''
                )}
              </div>
              {msg.content && (
                <div className="message-actions">
                  <button
                    className="btn-copy"
                    onClick={() => navigator.clipboard.writeText(msg.content!)}
                    title="复制"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}

              {showTokens && msg.tokens && msg.role === 'assistant' && (
                <div className="token-info">
                  <span>消耗: {msg.tokens.useTokens} tokens</span>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区 */}
        <div className="chat-input-area">
          {isLoading && (
            <button className="btn-stop" onClick={handleStop}>
              <Square size={16} />
              <span>停止</span>
            </button>
          )}

          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={isLoading}
              rows={1}
              style={{
                height: Math.min(120, Math.max(40, input.split('\n').length * 20)),
              }}
            />
          </div>

          <div className="input-actions">
            <label className="btn-icon" title="添加文件">
              <Paperclip size={18} />
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>

            <button
              className="btn-send"
              onClick={isLoading ? handleStop : handleSend}
              disabled={!isLoading && !input.trim()}
              title={isLoading ? '停止' : '发送'}
            >
              {isLoading ? <Square size={18} /> : <Send size={18} />}
            </button>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              {files.map((file, idx) => (
                <span key={idx} className="file-tag">
                  {file.name}
                  <button
                    className="btn-remove-file"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {config?.tooltipsText && (
          <div
            className="tooltips-text"
            dangerouslySetInnerHTML={{ __html: config?.tooltipsText || '' }}
          />
        )}
      </div>

      <style>{`
        .ai-chat-page {
          height: 100%;
          display: flex;
          overflow: hidden;
          background: var(--color-bg);
        }

        /* 侧边栏 */
        .chat-sidebar {
          width: 280px;
          border-right: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .btn-new-session {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-new-session:hover {
          opacity: 0.9;
        }

        .session-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .session-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 32px;
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .session-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 4px;
          transition: background 0.2s;
        }

        .session-item:hover {
          background: var(--color-bg);
        }

        .session-item.active {
          background: var(--color-primary);
          color: white;
        }

        .session-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }
        
        /* 深色模式下选中的会话文字颜色 */
        .dark .session-item.active .session-name {
          color: white;
        }
        
        /* 浅色模式下选中的会话文字颜色 */
        .light .session-item.active .session-name {
          color: white;
        }
        
        .session-time {
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        
        /* 深色模式下选中的会话时间颜色 */
        .dark .session-item.active .session-time {
          color: rgba(255, 255, 255, 0.8);
        }
        
        /* 浅色模式下选中的会话时间颜色 */
        .light .session-item.active .session-time {
          color: rgba(255, 255, 255, 0.8);
        }
        
        /* 浅色模式下选中会话的背景色 */
        .light .session-item.active {
          background-color: var(--accent);
          color: white;
        }

        .session-item.active .session-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .btn-delete-session {
          padding: 4px;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .session-item:hover .btn-delete-session {
          opacity: 0.7;
        }

        .btn-delete-session:hover {
          opacity: 1 !important;
        }

        .load-more {
          text-align: center;
          padding: 12px;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 14px;
        }

        .loading-placeholder {
          display: flex;
          justify-content: center;
          padding: 24px;
        }

        /* 主聊天区域 */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          gap: 12px;
        }

        .btn-toggle-sidebar {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .btn-toggle-sidebar:hover {
          background: var(--color-bg-secondary);
        }

        .header-left {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .model-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tool-select {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 14px;
          min-width: 160px;
          cursor: pointer;
        }

        .tool-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .btn-icon:hover {
          background: var(--color-bg-secondary);
        }

        /* 消息列表 */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chat-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: var(--color-text-secondary);
        }

        .welcome-text {
          font-size: 16px;
          text-align: center;
          max-width: 400px;
          line-height: 1.6;
        }

        .model-hint {
          font-size: 13px;
          color: var(--color-primary);
          margin-top: 8px;
        }

        .chat-message {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          max-width: 75%;
        }

        .chat-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chat-message.user .message-avatar {
          background: var(--color-primary);
          color: white;
        }

        .chat-message.assistant .message-avatar {
          background: var(--color-bg-secondary);
          color: var(--color-primary);
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 16px;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
          font-size: 15px;
        }

        .chat-message.user .message-content {
          background: var(--color-primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chat-message.assistant .message-content {
          background: var(--color-bg-secondary);
          border-bottom-left-radius: 4px;
        }

        .message-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .chat-message:hover .message-actions {
          opacity: 1;
        }

        .btn-copy {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 4px;
        }

        .btn-copy:hover {
          background: var(--color-bg-secondary);
        }

        .token-info {
          font-size: 12px;
          color: var(--color-text-secondary);
          padding: 4px 12px;
        }

        /* 错误提示 */
        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 8px 16px;
          padding: 10px 14px;
          background: var(--color-error);
          color: white;
          border-radius: 8px;
          font-size: 14px;
        }

        .btn-close {
          padding: 4px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* 输入区 */
        .chat-input-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--color-border);
        }

        .btn-stop {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--color-error);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          width: fit-content;
        }

        .input-wrapper {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid var(--color-border);
          border-radius: 12px;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 15px;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .chat-input:disabled {
          background: var(--color-bg-secondary);
        }

        .input-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-send {
          padding: 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .btn-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        /* Markdown 内容样式 */
        .markdown-content {
          font-family: inherit;
          line-height: 1.6;
          color: var(--color-text);
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.2;
          color: var(--color-text);
        }
        
        .markdown-content h1 { font-size: 1.8em; }
        .markdown-content h2 { font-size: 1.6em; }
        .markdown-content h3 { font-size: 1.4em; }
        .markdown-content h4 { font-size: 1.2em; }
        .markdown-content h5 { font-size: 1.1em; }
        .markdown-content h6 { font-size: 1em; }
        
        .markdown-content p {
          margin: 0.5em 0;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        
        .markdown-content li {
          margin: 0.25em 0;
        }
        
        .markdown-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          background-color: var(--color-code-bg);
          padding: 0.1em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }
        
        .markdown-content pre {
          background-color: var(--color-code-bg);
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        
        .markdown-content pre code {
          padding: 0;
          background-color: transparent;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 1em;
          margin: 0.5em 0;
          color: var(--color-text-secondary);
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5em 0;
        }
        
        .markdown-content th,
        .markdown-content td {
          border: 1px solid var(--color-border);
          padding: 0.5em;
          text-align: left;
        }
        
        .markdown-content th {
          background-color: var(--color-bg-secondary);
          font-weight: 600;
        }
        
        .markdown-content a {
          color: var(--color-primary);
          text-decoration: none;
        }
        
        .markdown-content a:hover {
          text-decoration: underline;
        }
        
        .markdown-content strong {
          font-weight: 600;
        }
        
        .markdown-content em {
          font-style: italic;
        }
        
        .markdown-content hr {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 1em 0;
        }
        
        /* 代码高亮样式 */
        .markdown-content .hljs {
          display: block;
          overflow-x: auto;
          padding: 1em;
          color: var(--color-text);
          background: var(--color-code-bg);
        }
        
        .markdown-content .hljs-comment,
        .markdown-content .hljs-quote {
          color: var(--color-text-secondary);
          font-style: italic;
        }
        
        .markdown-content .hljs-keyword,
        .markdown-content .hljs-selector-tag,
        .markdown-content .hljs-subst {
          color: var(--color-primary);
          font-weight: 600;
        }
        
        .markdown-content .hljs-number,
        .markdown-content .hljs-literal,
        .markdown-content .hljs-variable,
        .markdown-content .hljs-template-variable,
        .markdown-content .hljs-tag .hljs-attr {
          color: var(--color-warning);
        }
        
        .markdown-content .hljs-string,
        .markdown-content .hljs-doctag {
          color: var(--color-success);
        }
        
        .markdown-content .hljs-title,
        .markdown-content .hljs-section,
        .markdown-content .hljs-selector-id {
          color: var(--color-primary);
          font-weight: 600;
        }
        
        .markdown-content .hljs-type,
        .markdown-content .hljs-class .hljs-title {
          color: var(--color-primary);
        }
        
        .markdown-content .hljs-tag {
          color: var(--color-text);
        }
        
        .markdown-content .hljs-regexp,
        .markdown-content .hljs-link {
          color: var(--color-info);
        }
        
        .markdown-content .hljs-symbol,
        .markdown-content .hljs-bullet {
          color: var(--color-warning);
        }
        
        .markdown-content .hljs-built_in,
        .markdown-content .hljs-builtin-name {
          color: var(--color-info);
        }
        
        .markdown-content .hljs-meta {
          color: var(--color-primary);
        }
        
        .markdown-content .hljs-deletion {
          background: var(--color-error-light);
        }
        
        .markdown-content .hljs-addition {
          background: var(--color-success-light);
        }
        
        .markdown-content .hljs-emphasis {
          font-style: italic;
        }
        
        .markdown-content .hljs-strong {
          font-weight: 600;
        }
        .selected-files {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .file-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--color-bg-secondary);
          border-radius: 4px;
          font-size: 12px;
        }

        .btn-remove-file {
          padding: 0;
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-remove-file:hover {
          color: var(--color-error);
        }

        /* 底部提示 */
        .tooltips-text {
          padding: 8px 16px;
          font-size: 12px;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}