// src/tools/ai/AiChat.tsx
// AI 对话 - 完整实现

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Bot,
  User,
  X,
  Copy,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  Paperclip,
  Square as StopIcon,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
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
  setTemplateConfig,
  getSessionId,
  setSessionId,
  groupModelsByTag,
  messagesToChatMessages,
  validateFiles,
  fileToBase64,
  deleteSession,
} from './chatApi'

export default function AiChat() {
  // ============================================================
  // 认证状态
  // ============================================================
  const [isLoggingIn, setIsLoggingIn] = useState(true)
  const [loginError, setLoginError] = useState('')

  // ============================================================
  // 配置数据
  // ============================================================
  const [config, setConfig] = useState<TemplateConfig | null>(null)
  const [modelGroups, setModelGroups] = useState<Map<string, ModelInfo[]>>(new Map())

  // ============================================================
  // 模型选择
  // ============================================================
  const [selectedModel, setSelectedModel] = useState('')

  // ============================================================
  // 会话管理
  // ============================================================
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ============================================================
  // 消息状态
  // ============================================================
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showTokens, setShowTokens] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
  // 初始化
  // ============================================================
  useEffect(() => {
    const initChat = async () => {
      setIsLoggingIn(true)
      setLoginError('')

      try {
        // 1. 登录
        await login()

        // 2. 获取模板配置
        const templateConfig = await fetchTemplateConfig()
        setConfig(templateConfig)
        setTemplateConfig(templateConfig)

        // 3. 按标签分组模型
        const groups = groupModelsByTag(templateConfig.models)
        setModelGroups(groups)

        // 4. 设置默认模型
        setSelectedModel(templateConfig.defModel)

        // 5. 获取会话列表
        await loadSessions(1)

        // 6. Token 显示开关
        setShowTokens(templateConfig.showTokens)
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : '登录失败')
      } finally {
        setIsLoggingIn(false)
      }
    }

    initChat()
  }, [])

  // ============================================================
  // 加载会话列表
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
      setHasMoreSessions(page < data.pages)
      setSessionsPage(page)
    } catch (err) {
      console.error('加载会话列表失败:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // ============================================================
  // 切换会话
  // ============================================================
  const switchSession = async (session: Session) => {
    if (currentSession?.id === session.id) return

    setCurrentSession(session)
    setSessionId(session.id)
    setSelectedModel(session.model)

    // 加载消息记录
    try {
      const data = await fetchMessageRecords(session.id, 1)
      const chatMessages = messagesToChatMessages(data.records)
      setMessages(chatMessages)
    } catch (err) {
      console.error('加载消息记录失败:', err)
      setMessages([])
    }
  }

  // ============================================================
  // 创建新会话
  // ============================================================
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

  // ============================================================
  // 删除会话
  // ============================================================
  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      // 调用后端删除接口
      await deleteSession(sessionId)

      // 前端删除
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))

      // 如果删除的是当前会话，切换到第一会话
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        if (remaining.length > 0) {
          switchSession(remaining[0])
        } else {
          setCurrentSession(null)
          setSessionId(0)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('删除会话失败:', err)
      setError(err instanceof Error ? err.message : '删除会话失败')
    }
  }

  // ============================================================
  // 发送消息
  // ============================================================
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!config) return

    // 验证文件
    const validation = validateFiles(files, config)
    if (!validation.valid) {
      setError(validation.error || '文件验证失败')
      return
    }

    const userText = input.trim()
    const currentSessionId = getSessionId()

    // 如果没有会话，先创建
    let sessionId = currentSessionId
    if (!sessionId) {
      try {
        const newSession = await createSession(selectedModel)
        setSessions((prev) => [newSession, ...prev])
        switchSession(newSession)
        sessionId = newSession.id
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建会话失败')
        return
      }
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    // 创建 AbortController
    const controller = new AbortController()
    setAbortController(controller)

    // 添加空的 assistant 消息
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '' },
    ])

    // 准备文件（Base64）
    const fileBase64s: string[] = []
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file)
        fileBase64s.push(base64)
      } catch {
        console.error('文件转换失败:', file.name)
      }
    }

    try {
      await sendChatMessage(
        userText,
        sessionId!,
        fileBase64s,
        {
          onChunk: (chunk) => {
            // 流式更新最后一条消息
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
          onComplete: (finalData) => {
            // 流结束，更新 Token 信息
            if (finalData) {
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: finalData.aiText || updated[lastIdx].content,
                    tokens: {
                      promptTokens: finalData.promptTokens,
                      completionTokens: finalData.completionTokens,
                      contextTokens: finalData.contextTokens,
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
          },
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setIsLoading(false)
      setAbortController(null)
      setFiles([])
    }
  }

  // ============================================================
  // 停止生成
  // ============================================================
  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setIsLoading(false)
    }
  }

  // ============================================================
  // 键盘提交
  // ============================================================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ============================================================
  // 清空对话
  // ============================================================
  const handleClear = () => {
    setMessages([])
    setError('')
    setCurrentSession(null)
    setSessionId(0)
  }

  // ============================================================
  // 复制消息
  // ============================================================
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  // ============================================================
  // 文件选择
  // ============================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  // ============================================================
  // 渲染
  // ============================================================

  // 登录中
  if (isLoggingIn) {
    return (
      <ToolLayout title="AI 对话" description="基于太极 API 的 AI 对话工具">
        <div className="ai-chat-loading">
          <Loader2 size={48} className="spinning" />
          <p>登录中...</p>
        </div>

        <style>{`
          .ai-chat-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 48px;
            color: var(--color-text-secondary);
          }
          .spinning { animation: spin 1s linear infinite; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </ToolLayout>
    )
  }

  // 登录失败
  if (loginError) {
    return (
      <ToolLayout title="AI 对话" description="登录失败">
        <div className="ai-chat-error">
          <p>登录失败</p>
          <p className="error-text">{loginError}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>

        <style>{`
          .ai-chat-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 48px;
            text-align: center;
          }
          .error-text { color: var(--color-error); font-size: 14px; }
        `}</style>
      </ToolLayout>
    )
  }

  return (
    <ToolLayout
      title="AI 对话"
      description={`会话: ${currentSession?.name || '新对话'} | 模型: ${selectedModel}`}
    >
      <div className="ai-chat-container">
        {/* 侧边栏 - 会话列表 */}
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
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

            {/* 无限滚动加载 */}
            {hasMoreSessions && !sessionsLoading && (
              <div className="load-more" onClick={() => loadSessions(sessionsPage + 1)}>
                加载更多
              </div>
            )}
          </div>
        </div>

        {/* 切换侧边栏按钮 */}
        <button
          className="btn-toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronDown size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* 主聊天区域 */}
        <div className="chat-main">
          {/* 顶部栏 */}
          <div className="chat-header">
            <div className="header-left">
              {/* 模型选择器 */}
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
                <button
                  className="btn-icon"
                  onClick={() =>
                    fetchTemplateConfig().then((c) => {
                      setConfig(c)
                      setModelGroups(groupModelsByTag(c.models))
                    })
                  }
                  title="刷新模型"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* 文件按钮 */}
              {config && config.mFileCount > 0 && (
                <label className="btn-icon" title="添加文件">
                  <Paperclip size={14} />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {/* 已选文件显示 */}
              {files.length > 0 && (
                <div className="selected-files">
                  {files.map((file, idx) => (
                    <span key={idx} className="file-tag">
                      {file.name}
                      <X
                        size={12}
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="header-right">
              {/* 新建会话 */}
              <button className="btn-icon" onClick={handleNewSession} title="新建会话">
                <Plus size={14} />
              </button>

              {/* 清空对话 */}
              <button className="btn-icon" onClick={handleClear} title="清空对话">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && <div className="error-banner">{error}</div>}

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
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">
                  {msg.content ||
                    (msg.role === 'assistant' && isLoading && idx === messages.length - 1
                      ? '思考中...'
                      : '')}
                </div>
                {msg.content && (
                  <div className="message-actions">
                    <button
                      className="btn-copy"
                      onClick={() => handleCopy(msg.content!)}
                      title="复制"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}

                {/* Token 信息 */}
                {showTokens && msg.tokens && msg.role === 'assistant' && (
                  <div className="token-info">
                    <span>消耗: {msg.tokens.useTokens} tokens</span>
                    <span>
                      (P: {msg.tokens.promptTokens} + C:{' '}
                      {msg.tokens.completionTokens})
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区 */}
          <div className="chat-input-area">
            {/* 停止按钮 */}
            {isLoading && (
              <button className="btn-stop" onClick={handleStop}>
                <StopIcon size={16} />
                <span>停止</span>
              </button>
            )}

            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              disabled={isLoading}
              rows={2}
            />

            <button
              className="btn-send"
              onClick={isLoading ? handleStop : handleSend}
              disabled={!isLoading && !input.trim()}
            >
              {isLoading ? <StopIcon size={18} /> : <Send size={18} />}
            </button>
          </div>

          {/* 底部提示 */}
          {config?.tooltipsText && (
            <div
              className="tooltips-text"
              dangerouslySetInnerHTML={{ __html: config.tooltipsText }}
            />
          )}
        </div>
      </div>

      <style>{`
        .ai-chat-container {
          display: flex;
          height: calc(100vh - 120px);
          min-height: 500px;
          position: relative;
        }

        /* 侧边栏 */
        .chat-sidebar {
          width: 240px;
          border-right: 1px solid var(--color-border);
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s;
        }

        .chat-sidebar:not(.open) {
          margin-left: -240px;
        }

        .sidebar-header {
          padding: 12px;
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
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-new-session:hover {
          opacity: 0.9;
        }

        .session-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .session-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 4px;
        }

        .session-item:hover {
          background: var(--color-bg-secondary);
        }

        .session-item.active {
          background: var(--color-primary);
          color: white;
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .session-name {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .session-time {
          font-size: 12px;
          opacity: 0.7;
        }

        .btn-delete-session {
          padding: 4px;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.7;
        }

        .btn-delete-session:hover {
          opacity: 1;
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

        /* 切换侧边栏按钮 */
        .btn-toggle-sidebar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          padding: 8px 4px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-left: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          color: var(--color-text-secondary);
        }

        .chat-sidebar:not(.open) + .btn-toggle-sidebar {
          left: 0;
        }

        .chat-sidebar.open + .btn-toggle-sidebar {
          left: 240px;
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
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-border);
          gap: 8px;
          flex-wrap: wrap;
        }

        .header-left,
        .header-right {
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
          padding: 6px 12px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 14px;
          min-width: 180px;
        }

        .btn-icon {
          padding: 6px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .btn-icon:hover {
          background: var(--color-bg-secondary);
        }

        .selected-files {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .file-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--color-bg-secondary);
          border-radius: 4px;
          font-size: 12px;
        }

        /* 消息区域 */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
        }

        .model-hint {
          font-size: 12px;
          color: var(--color-primary);
        }

        .chat-message {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          max-width: 85%;
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
          color: var(--color-text-secondary);
        }

        .message-content {
          padding: 10px 14px;
          border-radius: 12px;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.5;
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
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .chat-message:hover .message-actions {
          opacity: 1;
        }

        .btn-copy {
          padding: 4px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: 4px;
        }

        .token-info {
          font-size: 12px;
          color: var(--color-text-secondary);
          padding: 4px 12px;
          display: flex;
          gap: 8px;
        }

        .error-banner {
          margin: 8px 12px;
          padding: 8px 12px;
          background: var(--color-error);
          color: white;
          border-radius: 6px;
          font-size: 14px;
        }

        /* 输入区 */
        .chat-input-area {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--color-border);
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 14px;
          resize: none;
          font-family: inherit;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .chat-input:disabled {
          background: var(--color-bg-secondary);
        }

        .btn-send {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          background: var(--color-primary);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-stop {
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: var(--color-error);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .tooltips-text {
          padding: 8px 12px;
          font-size: 12px;
          color: var(--color-text-secondary);
          text-align: center;
          border-top: 1px solid var(--color-border);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToolLayout>
  )
}