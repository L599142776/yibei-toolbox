// src/tools/crypto/JwtDebugger.tsx
import { useState, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import {
  Copy, RefreshCw, Check, X, AlertTriangle, Clock,
  ChevronDown, ChevronUp, Key, FileJson, Shield, BookOpen
} from 'lucide-react'

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
  } catch {
    return atob(base64)
  }
}

function base64UrlEncode(obj: object): string {
  const json = JSON.stringify(obj)
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

interface ExpirationStatus {
  status: 'valid' | 'expiring' | 'expired' | 'unknown'
  time: string
  label: string
}

function checkExpiration(payload: Record<string, unknown>): ExpirationStatus {
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : null
  const iat = typeof payload.iat === 'number' ? payload.iat : null
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null

  if (typeof nbf === 'number' && now < nbf) {
    const diff = nbf - now
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    return {
      status: 'expired',
      time: `生效时间: ${formatTime(nbf)} (${hours}小时${minutes}分钟后)`,
      label: 'Not Yet Valid'
    }
  }

  if (typeof exp === 'number') {
    if (now > exp) {
      const diff = now - exp
      return {
        status: 'expired',
        time: `已过期: ${formatTimeDiff(diff)} (${formatTime(exp)})`,
        label: 'Expired'
      }
    } else {
      const diff = exp - now
      const oneDay = 24 * 60 * 60
      if (diff < 60 * 60) {
        return {
          status: 'expiring',
          time: `即将过期: ${formatTimeDiff(diff)} (${formatTime(exp)})`,
          label: 'Expiring Soon'
        }
      } else if (diff < oneDay) {
        return {
          status: 'expiring',
          time: `剩余 ${formatTimeDiff(diff)} (${formatTime(exp)})`,
          label: 'Expiring Soon'
        }
      } else if (diff < 7 * oneDay) {
        return {
          status: 'valid',
          time: `剩余 ${formatTimeDiff(diff)} (${formatTime(exp)})`,
          label: 'Valid'
        }
      } else {
        return {
          status: 'valid',
          time: `过期时间: ${formatTime(exp)}`,
          label: 'Valid'
        }
      }
    }
  }

  if (typeof iat === 'number') {
    return {
      status: 'valid',
      time: `签发时间: ${formatTime(iat)}`,
      label: 'No Expiration'
    }
  }

  return {
    status: 'unknown',
    time: '无过期时间设置',
    label: 'Unknown'
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatTimeDiff(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}天${hours}小时`
}

const commonClaims = [
  { claim: 'iss', name: 'Issuer', desc: '签发者，标识谁创建了这个 token' },
  { claim: 'sub', name: 'Subject', desc: '主题，标识 token 所代表的主体' },
  { claim: 'aud', name: 'Audience', desc: '受众，标识 token 的预期接收方' },
  { claim: 'exp', name: 'Expiration Time', desc: '过期时间，token 失效的时间戳' },
  { claim: 'nbf', name: 'Not Before', desc: '生效时间，在此之前 token 无效' },
  { claim: 'iat', name: 'Issued At', desc: '签发时间，token 创建的时间戳' },
  { claim: 'jti', name: 'JWT ID', desc: '唯一标识符，用于标识和防止 token 重放' }
]

const DEFAULT_IAT = Math.floor(Date.now() / 1000)

interface JwtParts {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: { header: string; payload: string; signature: string }
}

type TabType = 'header' | 'payload' | 'signature'

function decodeJwtParts(rawToken: string): { parts: JwtParts | null; error: string } {
  const segs = rawToken.trim().split('.')
  if (segs.length !== 3) {
    return { parts: null, error: 'JWT 格式不正确，应包含三段 (header.payload.signature)' }
  }

  try {
    const headerStr = base64UrlDecode(segs[0])
    const payloadStr = base64UrlDecode(segs[1])
    const headerRaw: unknown = JSON.parse(headerStr)
    const payloadRaw: unknown = JSON.parse(payloadStr)
    const header = typeof headerRaw === 'object' && headerRaw !== null ? headerRaw as Record<string, unknown> : {}
    const payload = typeof payloadRaw === 'object' && payloadRaw !== null ? payloadRaw as Record<string, unknown> : {}
    return {
      parts: {
        header,
        payload,
        signature: segs[2],
        raw: { header: segs[0], payload: segs[1], signature: segs[2] },
      },
      error: '',
    }
  } catch {
    return { parts: null, error: 'Base64 解码失败，请检查 token 格式' }
  }
}

export default function JwtDebugger() {
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('payload')
  const [showGenerator, setShowGenerator] = useState(false)
  const [showClaims, setShowClaims] = useState(false)
  const [copiedPart, setCopiedPart] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [parts, setParts] = useState<JwtParts | null>(null)
  const [editHeader, setEditHeader] = useState('')
  const [editPayload, setEditPayload] = useState('')
  const [headerError, setHeaderError] = useState('')
  const [payloadError, setPayloadError] = useState('')
  const [genHeader, setGenHeader] = useState(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2))
  const [genPayload, setGenPayload] = useState(JSON.stringify({
    sub: '1234567890',
    name: 'John Doe',
    iat: DEFAULT_IAT
  }, null, 2))
  const [generatedToken, setGeneratedToken] = useState('')

  const handleTokenChange = useCallback((value: string) => {
    setToken(value)
    if (!value.trim()) {
      setError('')
      setParts(null)
      setEditHeader('')
      setEditPayload('')
      return
    }

    const decoded = decodeJwtParts(value)
    setError(decoded.error)
    setParts(decoded.parts)
    if (decoded.parts) {
      setEditHeader(JSON.stringify(decoded.parts.header, null, 2))
      setEditPayload(JSON.stringify(decoded.parts.payload, null, 2))
    } else {
      setEditHeader('')
      setEditPayload('')
    }
  }, [])

  const handleHeaderChange = (value: string) => {
    setEditHeader(value)
    try {
      JSON.parse(value)
      setHeaderError('')
    } catch {
      setHeaderError('JSON 格式错误')
    }
  }

  const handlePayloadChange = (value: string) => {
    setEditPayload(value)
    try {
      JSON.parse(value)
      setPayloadError('')
    } catch {
      setPayloadError('JSON 格式错误')
    }
  }

  const handleGenerate = useCallback(() => {
    try {
      const header = JSON.parse(genHeader)
      const payload = JSON.parse(genPayload)
      const encodedHeader = base64UrlEncode(header)
      const encodedPayload = base64UrlEncode(payload)
      const newToken = `${encodedHeader}.${encodedPayload}.[signature]`
      setGeneratedToken(newToken)
      handleTokenChange(newToken)
    } catch {
      // JSON parse error handled by individual handlers
    }
  }, [genHeader, genPayload, handleTokenChange])

  const copyToClipboard = async (text: string, part: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedPart(part)
    setTimeout(() => setCopiedPart(null), 2000)
  }

  const expirationInfo = parts ? checkExpiration(parts.payload) : null

  const getStatusColor = (status: ExpirationStatus['status']) => {
    switch (status) {
      case 'valid': return '#22c55e'
      case 'expiring': return '#eab308'
      case 'expired': return '#ef4444'
      default: return 'var(--text-dim)'
    }
  }

  const getStatusIcon = (status: ExpirationStatus['status']) => {
    switch (status) {
      case 'valid': return <Check size={16} />
      case 'expiring': return <AlertTriangle size={16} />
      case 'expired': return <X size={16} />
      default: return <Clock size={16} />
    }
  }

  return (
    <ToolLayout
      title="JWT 调试器"
      description="解码、编辑、生成 JSON Web Token，支持过期时间检测和实时预览"
    >
      <style>{`
        .jwt-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .jwt-input-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .jwt-input-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .jwt-input-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-dim);
        }

        .jwt-textarea {
          width: 100%;
          min-height: 100px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          color: var(--text);
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: all 0.3s;
        }

        .jwt-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.1);
        }

        .jwt-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-sm);
          color: #ef4444;
          font-size: 13px;
        }

        .jwt-expiration {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 13px;
        }

        .jwt-expiration-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .jwt-expiration-info {
          flex: 1;
        }

        .jwt-expiration-label {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .jwt-expiration-time {
          color: var(--text-dim);
          font-size: 12px;
        }

        .jwt-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-input);
          padding: 4px;
          border-radius: var(--radius-sm);
        }

        .jwt-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: none;
          border: none;
          border-radius: 6px;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .jwt-tab:hover {
          color: var(--text);
          background: var(--bg-hover);
        }

        .jwt-tab.active {
          background: var(--bg-card);
          color: var(--text);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .jwt-panel {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .jwt-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: rgba(var(--bg-rgb), 0.3);
        }

        .jwt-panel-title {
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jwt-panel-actions {
          display: flex;
          gap: 8px;
        }

        .jwt-btn-sm {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-dim);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .jwt-btn-sm:hover {
          background: var(--bg-hover);
          color: var(--text);
          border-color: var(--border-hover);
        }

        .jwt-btn-sm.success {
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.3);
        }

        .jwt-editor {
          width: 100%;
          min-height: 200px;
          background: transparent;
          border: none;
          padding: 16px;
          color: var(--text);
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .jwt-editor:focus {
          background: rgba(var(--accent-rgb), 0.02);
        }

        .jwt-editor.error {
          background: rgba(239, 68, 68, 0.05);
        }

        .jwt-error-text {
          padding: 8px 16px;
          color: #ef4444;
          font-size: 12px;
          background: rgba(239, 68, 68, 0.1);
          border-top: 1px solid rgba(239, 68, 68, 0.2);
        }

        .jwt-preview {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: rgba(var(--accent-rgb), 0.05);
        }

        .jwt-preview-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .jwt-preview-token {
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 12px;
          color: var(--accent);
          word-break: break-all;
          line-height: 1.6;
        }

        .jwt-signature-panel {
          padding: 20px;
          text-align: center;
        }

        .jwt-signature-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text-dim);
          font-size: 13px;
        }

        .jwt-signature-hint {
          margin-top: 16px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .jwt-generator {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .jwt-generator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(var(--bg-rgb), 0.3);
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }

        .jwt-generator-header:hover {
          background: var(--bg-hover);
        }

        .jwt-generator-title {
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jwt-generator-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .jwt-generator-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .jwt-generator-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-dim);
          margin-bottom: 8px;
        }

        .jwt-generator-actions {
          display: flex;
          gap: 12px;
          padding-top: 8px;
        }

        .jwt-claims {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .jwt-claims-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(var(--bg-rgb), 0.3);
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }

        .jwt-claims-header:hover {
          background: var(--bg-hover);
        }

        .jwt-claims-title {
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jwt-claims-list {
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .jwt-claim-item {
          display: flex;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-card);
          border-radius: 8px;
        }

        .jwt-claim-key {
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--accent);
          min-width: 40px;
        }

        .jwt-claim-info {
          flex: 1;
        }

        .jwt-claim-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .jwt-claim-desc {
          font-size: 12px;
          color: var(--text-dim);
        }

        .jwt-structure {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-input);
          border-radius: var(--radius-sm);
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 12px;
          overflow-x: auto;
        }

        .jwt-structure-part {
          padding: 4px 10px;
          background: var(--bg-card);
          border-radius: 4px;
          white-space: nowrap;
        }

        .jwt-structure-part.header { color: #f472b6; }
        .jwt-structure-part.payload { color: #60a5fa; }
        .jwt-structure-part.signature { color: #a78bfa; }

        .jwt-structure-dot {
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .jwt-generator-row {
            grid-template-columns: 1fr;
          }

          .jwt-tabs {
            flex-wrap: wrap;
          }

          .jwt-tab {
            flex: none;
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="jwt-container">
        <div className="jwt-input-section">
          <div className="jwt-input-header">
            <span className="jwt-input-label">粘贴 JWT Token</span>
            {token && (
              <button className="jwt-btn-sm" onClick={() => handleTokenChange('')}>
                <X size={14} /> 清空
              </button>
            )}
          </div>
          <textarea
            className="jwt-textarea"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            spellCheck={false}
          />

          {token && !error && (
            <div className="jwt-structure">
              <span className="jwt-structure-part header">{token.split('.')[0]?.substring(0, 20)}...</span>
              <span className="jwt-structure-dot">.</span>
              <span className="jwt-structure-part payload">{token.split('.')[1]?.substring(0, 20)}...</span>
              <span className="jwt-structure-dot">.</span>
              <span className="jwt-structure-part signature">{token.split('.')[2]?.substring(0, 20)}...</span>
            </div>
          )}

          {error && (
            <div className="jwt-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {expirationInfo && (
            <div className="jwt-expiration">
              <div
                className="jwt-expiration-icon"
                style={{ background: `${getStatusColor(expirationInfo.status)}20`, color: getStatusColor(expirationInfo.status) }}
              >
                {getStatusIcon(expirationInfo.status)}
              </div>
              <div className="jwt-expiration-info">
                <div className="jwt-expiration-label" style={{ color: getStatusColor(expirationInfo.status) }}>
                  {expirationInfo.label}
                </div>
                <div className="jwt-expiration-time">{expirationInfo.time}</div>
              </div>
            </div>
          )}
        </div>

        {parts && (
          <div className="jwt-tabs">
            <button
              className={`jwt-tab ${activeTab === 'header' ? 'active' : ''}`}
              onClick={() => setActiveTab('header')}
            >
              <FileJson size={16} /> Header
            </button>
            <button
              className={`jwt-tab ${activeTab === 'payload' ? 'active' : ''}`}
              onClick={() => setActiveTab('payload')}
            >
              <Key size={16} /> Payload
            </button>
            <button
              className={`jwt-tab ${activeTab === 'signature' ? 'active' : ''}`}
              onClick={() => setActiveTab('signature')}
            >
              <Shield size={16} /> Signature
            </button>
          </div>
        )}

        {parts && activeTab === 'header' && (
          <div className="jwt-panel">
            <div className="jwt-panel-header">
              <span className="jwt-panel-title">
                <FileJson size={16} /> Header 内容
              </span>
              <div className="jwt-panel-actions">
                <button
                  className={`jwt-btn-sm ${copiedPart === 'header' ? 'success' : ''}`}
                  onClick={() => copyToClipboard(editHeader, 'header')}
                >
                  {copiedPart === 'header' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPart === 'header' ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <textarea
              className={`jwt-editor ${headerError ? 'error' : ''}`}
              value={editHeader}
              onChange={(e) => handleHeaderChange(e.target.value)}
              spellCheck={false}
            />
            {headerError && <div className="jwt-error-text">{headerError}</div>}
            <div className="jwt-preview">
              <div className="jwt-preview-label">Base64URL 编码</div>
              <div className="jwt-preview-token">{parts.raw.header}</div>
            </div>
          </div>
        )}

        {parts && activeTab === 'payload' && (
          <div className="jwt-panel">
            <div className="jwt-panel-header">
              <span className="jwt-panel-title">
                <Key size={16} /> Payload 内容
              </span>
              <div className="jwt-panel-actions">
                <button
                  className={`jwt-btn-sm ${copiedPart === 'payload' ? 'success' : ''}`}
                  onClick={() => copyToClipboard(editPayload, 'payload')}
                >
                  {copiedPart === 'payload' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPart === 'payload' ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <textarea
              className={`jwt-editor ${payloadError ? 'error' : ''}`}
              value={editPayload}
              onChange={(e) => handlePayloadChange(e.target.value)}
              spellCheck={false}
            />
            {payloadError && <div className="jwt-error-text">{payloadError}</div>}
            <div className="jwt-preview">
              <div className="jwt-preview-label">Base64URL 编码</div>
              <div className="jwt-preview-token">{parts.raw.payload}</div>
            </div>
          </div>
        )}

        {parts && activeTab === 'signature' && (
          <div className="jwt-panel">
            <div className="jwt-panel-header">
              <span className="jwt-panel-title">
                <Shield size={16} /> 签名验证
              </span>
              <div className="jwt-panel-actions">
                <button
                  className={`jwt-btn-sm ${copiedPart === 'signature' ? 'success' : ''}`}
                  onClick={() => copyToClipboard(parts.signature, 'signature')}
                >
                  {copiedPart === 'signature' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPart === 'signature' ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <div className="jwt-signature-panel">
              <div className="jwt-signature-badge">
                <AlertTriangle size={16} />
                未验证
              </div>
              <p className="jwt-signature-hint">
                签名验证需要密钥<br />
                请在服务端使用正确的密钥进行验证
              </p>
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 8 }}>
                <div className="jwt-preview-label" style={{ marginBottom: 8 }}>原始签名</div>
                <div className="jwt-preview-token" style={{ fontSize: 11 }}>{parts.signature}</div>
              </div>
            </div>
          </div>
        )}

        <div className="jwt-generator">
          <div className="jwt-generator-header" onClick={() => setShowGenerator(!showGenerator)}>
            <span className="jwt-generator-title">
              <RefreshCw size={16} /> 生成新 Token
            </span>
            {showGenerator ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showGenerator && (
            <div className="jwt-generator-body">
              <div className="jwt-generator-row">
                <div className="jwt-generator-field">
                  <label>Header (JSON)</label>
                  <textarea
                    className="jwt-textarea"
                    value={genHeader}
                    onChange={(e) => setGenHeader(e.target.value)}
                    style={{ minHeight: 120, fontSize: 12 }}
                    spellCheck={false}
                  />
                </div>
                <div className="jwt-generator-field">
                  <label>Payload (JSON)</label>
                  <textarea
                    className="jwt-textarea"
                    value={genPayload}
                    onChange={(e) => setGenPayload(e.target.value)}
                    style={{ minHeight: 120, fontSize: 12 }}
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="jwt-generator-actions">
                <button className="btn" onClick={handleGenerate}>
                  <RefreshCw size={16} /> 生成 Token
                </button>
              </div>
              {generatedToken && (
                <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 8 }}>
                  <div className="jwt-preview-label" style={{ marginBottom: 8 }}>生成的 Token</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div className="jwt-preview-token" style={{ flex: 1 }}>{generatedToken}</div>
                    <button
                      className={`jwt-btn-sm ${copiedPart === 'generated' ? 'success' : ''}`}
                      onClick={() => copyToClipboard(generatedToken, 'generated')}
                    >
                      {copiedPart === 'generated' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedPart === 'generated' ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="jwt-claims">
          <div className="jwt-claims-header" onClick={() => setShowClaims(!showClaims)}>
            <span className="jwt-claims-title">
              <BookOpen size={16} /> 常见 Claims 说明
            </span>
            {showClaims ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showClaims && (
            <div className="jwt-claims-list">
              {commonClaims.map((claim) => (
                <div key={claim.claim} className="jwt-claim-item">
                  <span className="jwt-claim-key">{claim.claim}</span>
                  <div className="jwt-claim-info">
                    <div className="jwt-claim-name">{claim.name}</div>
                    <div className="jwt-claim-desc">{claim.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {parts && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="jwt-preview-label" style={{ margin: 0 }}>完整 Token</span>
              <button
                className={`jwt-btn-sm ${copiedPart === 'full' ? 'success' : ''}`}
                onClick={() => copyToClipboard(token, 'full')}
              >
                {copiedPart === 'full' ? <Check size={14} /> : <Copy size={14} />}
                {copiedPart === 'full' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="jwt-preview-token">{token}</div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
