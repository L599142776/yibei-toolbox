// src/tools/ai/chatApi.ts
// AI 对话 API - SSE 优化版

const API_BASE_URL = '/ai-api'
const APP_VERSION = '2.16.0'

// 登录信息 - 使用文档默认值
const DEFAULT_LOGIN_REQUEST = {
  account: 'a_lishizhong@163.com',
  password: 'FF1314..',
  code: '',
  captcha: '',
  invite: '',
  agreement: true,
  captchaId: '',
}

// 存储
let authToken = ''
let currentSessionId = 0

export function setAuthToken(token: string) {
  authToken = token
}

export function getAuthToken(): string {
  return authToken
}

export function getSessionId(): number {
  return currentSessionId
}

export function setSessionId(id: number) {
  currentSessionId = id
}

// 请求头
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-APP-VERSION': APP_VERSION,
    ...(authToken ? { Authorization: authToken } : {}),
  }
}

// 统一响应处理
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HTTP ${response.status}: ${error}`)
  }

  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('text/event-stream')) {
    return response as unknown as T
  }

  const result = await response.json()

  if (result.code !== 0) {
    throw new Error(result.msg || '请求失败')
  }

  return result.data
}

// 登录
export async function login(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/user/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(DEFAULT_LOGIN_REQUEST),
  })

  const data = await handleResponse<{ token: string; email: string; role: string }>(response)

  authToken = data.token
  return data.token
}

// 模型配置
export interface ModelInfo {
  label: string
  value: string
  attr: {
    icon: string
    integral: string
    multimodal: boolean
    note: string
    onlyImg: boolean
    plugin: boolean
    tag: string
  }
}

export interface TemplateConfig {
  defModel: string
  defaultChat: string
  genLine: number
  genTitle: boolean
  mFileCount: number
  mFileSize: number
  models: ModelInfo[]
  notice: string
  ocp: boolean
  p: boolean
  rm: boolean
  showTokens: boolean
  tooltipsText: string
  voice: boolean
}

export async function fetchTemplateConfig(): Promise<TemplateConfig> {
  const response = await fetch(`${API_BASE_URL}/api/chat/tmpl`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse<TemplateConfig>(response)
}

export function groupModelsByTag(models: ModelInfo[]): Map<string, ModelInfo[]> {
  const groups = new Map<string, ModelInfo[]>()

  models.forEach((model) => {
    const tag = model.attr.tag
    if (!groups.has(tag)) {
      groups.set(tag, [])
    }
    groups.get(tag)!.push(model)
  })

  return groups
}

// 会话
export interface Session {
  id: number
  created: string
  updated: string
  name: string
  model: string
  prompt: string
  icon: string
  plugins: unknown[]
  mcp: unknown[]
}

export interface SessionListResponse {
  page: number
  size: number
  total: number
  records: Session[]
}

export async function fetchSessionList(page = 1): Promise<SessionListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/session?page=${page}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse<SessionListResponse>(response)
}

export async function createSession(model: string): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}/api/chat/session`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model, plugins: [], mcp: [] }),
  })

  return handleResponse<Session>(response)
}

// 消息记录
export interface MessageRecord {
  id: number
  created: string
  sessionId: number
  userText: string
  aiText: string
  model: string
  promptTokens: number
  completionTokens: number
  contextTokens: number
  useTokens: number
  deductCount: number
  userStop: boolean
}

export interface MessageListResponse {
  page: number
  size: number
  total: number
  records: MessageRecord[]
}

export async function fetchMessageRecords(sessionId: number, page = 1): Promise<MessageListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/record/${sessionId}?page=${page}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse<MessageListResponse>(response)
}

// 删除会话
export async function deleteSession(sessionId: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
}

// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tokens?: { promptTokens: number; completionTokens: number; useTokens: number; deductCount: number }
}

export interface FileInfo {
  name: string
  size: number
  type: string
  base64: string
}

// SSE 响应格式
interface SSEEvent {
  id?: string
  event?: string
  data: string
  retry?: number
}

// SSE 解析器
function parseSSE(data: string): SSEEvent[] {
  const events: SSEEvent[] = []
  let currentEvent: Partial<SSEEvent> = {}

  const lines = data.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      if (currentEvent.data) {
        events.push({
          id: currentEvent.id,
          event: currentEvent.event,
          data: currentEvent.data.trim(),
          retry: currentEvent.retry,
        })
      }
      currentEvent = {}
      continue
    }

    if (trimmed.startsWith('id:')) {
      currentEvent.id = trimmed.slice(3).trim()
    } else if (trimmed.startsWith('event:')) {
      currentEvent.event = trimmed.slice(6).trim()
    } else if (trimmed.startsWith('data:')) {
      const value = trimmed.slice(5).trim()

      if (value) {
        if (currentEvent.data) {
          currentEvent.data += '\n'
        } else {
          currentEvent.data = ''
        }
        currentEvent.data += value
      }
    } else if (trimmed.startsWith('retry:')) {
      currentEvent.retry = parseInt(trimmed.slice(6).trim())
    }
  }

  if (currentEvent.data) {
    events.push({
      id: currentEvent.id,
      event: currentEvent.event,
      data: currentEvent.data.trim(),
      retry: currentEvent.retry,
    })
  }

  return events
}

// 流式聊天 - 使用更成熟的方案
export interface ChatOptions {
  text: string
  sessionId?: number
  files?: FileInfo[]
  onChunk?: (content: string) => void
  onComplete?: (message?: ChatMessage) => void
  onError?: (error: Error) => void
  onFinal?: (finalData: any) => void
}

export async function sendChatMessage(options: ChatOptions): Promise<void> {
  const sessionId = options.sessionId || currentSessionId

  const request = {
    text: options.text,
    sessionId,
    files: options.files || [],
  }

  const controller = new AbortController()

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const events = parseSSE(buffer)

      if (events.length > 0) {
        buffer = ''

        for (const event of events) {
          if (event.data === '[DONE]') {
            options.onComplete?.()
            return
          }

          try {
            const data = JSON.parse(event.data)

            if (data.code === 0) {
              if (data.type === 'string' && data.data) {
                options.onChunk?.(data.data)
              } else if (data.type === 'object' && data.data) {
                options.onFinal?.(data.data)

                const message: ChatMessage = {
                  role: 'assistant',
                  content: data.data.aiText,
                  tokens: {
                    promptTokens: data.data.promptTokens,
                    completionTokens: data.data.completionTokens,
                    useTokens: data.data.useTokens,
                    deductCount: data.data.deductCount,
                  },
                }

                options.onComplete?.(message)
              }
            } else {
              options.onError?.(new Error(data.msg || '响应失败'))
            }
          } catch (parseError) {
            options.onError?.(parseError as Error)
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      options.onComplete?.(undefined)
      return
    }

    options.onError?.(error as Error)
  }
}

// 文件转 base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result.split(',')[1])
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function validateFiles(files: File[], config: TemplateConfig): { valid: boolean; error?: string } {
  if (files.length > config.mFileCount) {
    return {
      valid: false,
      error: `最多支持 ${config.mFileCount} 个文件`,
    }
  }

  const maxSize = config.mFileSize * 1024 * 1024

  for (const file of files) {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小不能超过 ${config.mFileSize}MB`,
      }
    }
  }

  return { valid: true }
}

// 消息转换
export function messagesToChatMessages(records: MessageRecord[]): ChatMessage[] {
  const messages: ChatMessage[] = []

  records.forEach((record) => {
    if (record.userText) {
      messages.push({
        role: 'user',
        content: record.userText,
      })
    }

    if (record.aiText) {
      messages.push({
        role: 'assistant',
        content: record.aiText,
        tokens: {
          promptTokens: record.promptTokens,
          completionTokens: record.completionTokens,
          useTokens: record.useTokens,
          deductCount: record.deductCount,
        },
      })
    }
  })

  return messages
}