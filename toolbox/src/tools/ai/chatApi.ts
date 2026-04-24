// src/tools/ai/chatApi.ts
// AI Chat API 服务模块 - 完整实现

const API_BASE_URL = '/ai-api'
const APP_VERSION = '2.16.0'

// ============================================================
// 常量定义
// ============================================================

// 登录请求体（使用文档默认参数）
const DEFAULT_LOGIN_REQUEST = {
  account: 'a_lishizhong@163.com',
  password: 'FF1314..',
  code: '',
  captcha: '',
  invite: '',
  agreement: true,
  captchaId: '',
}

// ============================================================
// 类型定义
// ============================================================

// 统一响应格式
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

// 登录响应
export interface LoginResponse {
  token: string
  email: string
  phone: string
  role: string
  registerTime: string
}

// 用户信息
export interface UserInfo {
  email: string
  phone: string
  role: string
  registerTime: string
  integral?: number // 积分
  nickname?: string
  avatar?: string
}

// 模型信息
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

// 模板/配置数据
export interface TemplateConfig {
  cm: boolean
  defModel: string
  defaultChat: string
  genLine: number
  genTitle: boolean
  mFileCount: number
  mFileSize: number
  mcp: unknown | null
  models: ModelInfo[]
  notice: string
  ocp: boolean
  p: boolean
  plugins: unknown | null
  rm: boolean
  sessionHoverSetting: boolean
  showTokens: boolean
  thinkModel: string
  toggleTipTime: number
  tooltipsText: string
  voice: boolean
}

// 会话对象
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

// 会话列表响应
export interface SessionListResponse {
  page: number
  size: number
  total: number
  pages: number
  records: Session[]
}

// 消息记录
export interface MessageRecord {
  id: number
  created: string
  sessionId: number
  userText: string
  aiText: string
  model: string
  deductCount: number
  promptTokens: number
  completionTokens: number
  contextTokens: number
  useTokens: number
  userStop: boolean
}

// 消息记录响应
export interface MessageListResponse {
  page: number
  size: number
  total: number
  records: MessageRecord[]
}

// 聊天消息（前端用）
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  tokens?: TokenUsage
}

// Token 使用量
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  contextTokens: number
  useTokens: number
  deductCount: number
}

// 聊天请求体
export interface ChatRequest {
  text: string
  sessionId: number
  files?: string[]
}

// SSE 流式响应
export interface StreamResponse {
  id: string
  type: string
  data: string
  code: number
}

// 最终消息响应（流结束后的完整数据）
export interface FinalMessageResponse {
  id: number
  created: string
  updated: string
  sessionId: number
  userText: string
  aiText: string
  uid: number
  ip: string
  taskId: string
  model: string
  deductCount: number
  refundCount: number
  promptTokens: number
  completionTokens: number
  contextTokens: number
  useTokens: number
  useImages: unknown
  useFiles: unknown
  useAppId: number
  appendDeductCount: number
  userStop: boolean
}

// 文件信息（用于上传）
export interface UploadedFile {
  name: string
  size: number
  type: string
  base64?: string
}

// ============================================================
// 存储状态
// ============================================================

let authToken = ''
let currentSessionId: number | null = null
let templateConfig: TemplateConfig | null = null

// ============================================================
// Token 管理
// ============================================================

export function setAuthToken(token: string) {
  authToken = token
}

export function getAuthToken(): string {
  return authToken
}

export function getSessionId(): number | null {
  return currentSessionId
}

export function setSessionId(id: number) {
  currentSessionId = id
}

// ============================================================
// 配置存储
// ============================================================

export function getTemplateConfig(): TemplateConfig | null {
  return templateConfig
}

// 设置模板配置
export function setTemplateConfig(config: TemplateConfig) {
  templateConfig = config
}

// ============================================================
// 请求工具函数
// ============================================================

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-APP-VERSION': APP_VERSION,
    ...(authToken ? { Authorization: `${authToken}` } : {}),
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`请求失败: ${response.status} - ${text}`)
  }

  const contentType = response.headers.get('content-type') || ''

  // SSE 流式响应直接返回 response 对象
  if (contentType.includes('text/event-stream')) {
    return response as unknown as T
  }

  const data: ApiResponse<T> = await response.json()
  if (data.code !== 0) {
    throw new Error(data.msg || '请求失败')
  }

  return data.data
}

// ============================================================
// API 方法
// ============================================================

// 登录
export async function login(): Promise<string> {
  const data = await handleResponse<LoginResponse>(
    await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-VERSION': APP_VERSION,
      },
      body: JSON.stringify(DEFAULT_LOGIN_REQUEST),
    })
  )

  authToken = data.token
  return data.token
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return !!authToken
}

// 获取用户信息
export async function fetchUserInfo(): Promise<UserInfo> {
  return handleResponse<UserInfo>(
    await fetch(`${API_BASE_URL}/api/user/info`, {
      method: 'GET',
      headers: getHeaders(),
    })
  )
}

// 获取模型列表和模板配置
export async function fetchTemplateConfig(): Promise<TemplateConfig> {
  const data = await handleResponse<TemplateConfig>(
    await fetch(`${API_BASE_URL}/api/chat/tmpl`, {
      method: 'GET',
      headers: getHeaders(),
    })
  )

  templateConfig = data
  return data
}

// 获取模型列表（便捷方法）
export async function fetchModels(): Promise<ModelInfo[]> {
  const config = await fetchTemplateConfig()
  return config.models
}

// 按标签分组模型
export function groupModelsByTag(models: ModelInfo[]): Map<string, ModelInfo[]> {
  const groups = new Map<string, ModelInfo[]>()

  for (const model of models) {
    const tag = model.attr.tag || 'Other'
    const existing = groups.get(tag) || []
    existing.push(model)
    groups.set(tag, existing)
  }

  return groups
}

// 获取会话列表（分页）
export async function fetchSessionList(page = 1): Promise<SessionListResponse> {
  return handleResponse<SessionListResponse>(
    await fetch(`${API_BASE_URL}/api/chat/session?page=${page}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  )
}

// 创建新会话
export async function createSession(model: string): Promise<Session> {
  return handleResponse<Session>(
    await fetch(`${API_BASE_URL}/api/chat/session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model,
        plugins: [],
        mcp: [],
      }),
    })
  )
}

// 获取会话消息记录（分页）
export async function fetchMessageRecords(
  sessionId: number,
  page = 1
): Promise<MessageListResponse> {
  return handleResponse<MessageListResponse>(
    await fetch(`${API_BASE_URL}/api/chat/record/${sessionId}?page=${page}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  )
}

// ============================================================
// SSE 流式处理
// ============================================================

interface StreamCallbacks {
  onChunk: (content: string) => void
  onComplete?: (finalData?: FinalMessageResponse) => void
  onError?: (error: Error) => void
}

// 解析 SSE 流
async function parseSSEStream(
  body: ReadableStream<Uint8Array> | null,
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onComplete, onError } = callbacks

  if (!body) {
    onError?.(new Error('无法读取响应流'))
    return
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalData: FinalMessageResponse | undefined

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 处理缓冲区中剩余的数据
        if (buffer.trim()) {
          const line = buffer.trim()
          const dataStr = line.startsWith('data: ')
            ? line.slice(6)
            : line

          if (dataStr === '[DONE]') {
            break
          }

          try {
            const resp: StreamResponse = JSON.parse(dataStr)
            if (resp.code === 0) {
              if (resp.type === 'object') {
                // 最终完整响应
                finalData = resp.data as unknown as FinalMessageResponse
              } else if (resp.data) {
                onChunk(resp.data)
              }
            }
          } catch {
            // 非 JSON，直接作为文本
            onChunk(dataStr)
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 按双换行符分割事件
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        const lines = event.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data:') continue

          const dataStr = trimmed.startsWith('data: ')
            ? trimmed.slice(6)
            : trimmed

          if (dataStr === '[DONE]') {
            onComplete?.(finalData)
            return
          }

          try {
            const resp: StreamResponse = JSON.parse(dataStr)
            if (resp.code === 0) {
              if (resp.type === 'object') {
                // 完整消息数据
                finalData = resp.data as unknown as FinalMessageResponse
              } else if (resp.data) {
                // 流式文本片段
                onChunk(resp.data)
              }
            }
          } catch {
            // 非 JSON 数据，直接作为文本
            onChunk(dataStr)
          }
        }
      }
    }

    onComplete?.(finalData)
  } catch (error) {
    if (error instanceof Error) {
      onError?.(error)
    } else {
      onError?.(new Error('未知错误'))
    }
  } finally {
    reader.releaseLock()
  }
}

// 发送聊天消息（流式）
export async function sendChatMessage(
  text: string,
  sessionId: number,
  files: string[] = [],
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        sessionId,
        files,
      }),
    })

    if (!response.ok) {
      const text2 = await response.text()
      throw new Error(`请求失败: ${response.status} - ${text2}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      // 流式响应
      await parseSSEStream(response.body, callbacks)
    } else {
      // 非流式（兼容）
      const data = await response.json()
      if (data.code === 0 && data.data) {
        callbacks.onChunk(data.data)
        callbacks.onComplete?.(data.data)
      } else {
        throw new Error(data.msg || '请求失败')
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      callbacks.onError?.(error)
    } else {
      callbacks.onError?.(new Error('未知错误'))
    }
    throw error
  }
}

// 发送消息（简化接口 - 兼容现有代码）
export async function sendChatMessageSimple(
  text: string,
  onChunk: (content: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const sessionId = currentSessionId || 0

  await sendChatMessage(
    text,
    sessionId,
    [],
    {
      onChunk,
      onComplete: () => {},
      onError,
    }
  )
}

// 删除会话
export async function deleteSession(sessionId: number): Promise<void> {
  await handleResponse<void>(
    await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  )
}

// ============================================================
// 工具函数
// ============================================================

// 从消息记录转换为前端消息格式
export function messagesToChatMessages(
  records: MessageRecord[]
): ChatMessage[] {
  const messages: ChatMessage[] = []

  for (const record of records) {
    // 用户消息
    if (record.userText) {
      messages.push({
        role: 'user',
        content: record.userText,
        timestamp: record.created,
      })
    }

    // AI 回复
    if (record.aiText) {
      messages.push({
        role: 'assistant',
        content: record.aiText,
        timestamp: record.created,
        tokens: {
          promptTokens: record.promptTokens,
          completionTokens: record.completionTokens,
          contextTokens: record.contextTokens,
          useTokens: record.useTokens,
          deductCount: record.deductCount,
        },
      })
    }
  }

  return messages
}

// 检查文件是否在限制内
export function validateFiles(
  files: File[],
  config: TemplateConfig
): { valid: boolean; error?: string } {
  if (files.length > config.mFileCount) {
    return {
      valid: false,
      error: `最多允许 ${config.mFileCount} 个文件`,
    }
  }

  for (const file of files) {
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > config.mFileSize) {
      return {
        valid: false,
        error: `单个文件大小不能超过 ${config.mFileSize} MB`,
      }
    }
  }

  return { valid: true }
}

// 文件转换为 Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 去掉 data: 前缀
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}