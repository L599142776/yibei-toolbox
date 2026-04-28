// src/tools/crypto/PasswordStrength.tsx
import { useState, useMemo } from 'react'
import { Eye, EyeOff, Copy, RefreshCw, Check, X, Zap } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// Common weak passwords to check
const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'abc123', 'letmein',
  'welcome', 'admin', 'login', '12345678', '123456789',
  'dragon', 'master', 'monkey', 'shadow', 'sunshine'
]

interface Criteria {
  length8: boolean
  length12: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
  noSequence: boolean
  noCommon: boolean
}

interface StrengthResult {
  score: number
  level: 'weak' | 'fair' | 'good' | 'strong'
  criteria: Criteria
  suggestions: string[]
}

const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?"

function hasSpecialChar(password: string): boolean {
  for (const ch of password) {
    if (SPECIAL_CHARS.includes(ch)) return true
  }
  return false
}

function calculateStrength(password: string): StrengthResult {
  const criteria: Criteria = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: hasSpecialChar(password),
    noSequence: !hasSequence(password),
    noCommon: !isCommonPassword(password)
  }

  const suggestions: string[] = []

  // Calculate score
  let score = 0

  // Length scoring
  if (password.length > 0) {
    score += Math.min(password.length, 16) // +1 per char, max +16
  }

  // Character type bonuses
  if (criteria.uppercase) score += 10
  if (criteria.lowercase) score += 10
  if (criteria.number) score += 10
  if (criteria.special) score += 15

  // Length bonuses
  if (criteria.length12) score += 5
  if (password.length >= 16) score += 5

  // Penalties
  if (!criteria.noSequence) score -= 10
  if (hasRepeats(password)) score -= 5
  if (!criteria.noCommon) score -= 20

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine level
  let level: StrengthResult['level']
  if (score < 30) level = 'weak'
  else if (score < 60) level = 'fair'
  else if (score < 80) level = 'good'
  else level = 'strong'

  // Generate suggestions
  if (!criteria.length8) suggestions.push('密码长度至少 8 个字符')
  if (!criteria.length12) suggestions.push('建议长度至少 12 个字符')
  if (!criteria.uppercase) suggestions.push('添加大写字母 (A-Z)')
  if (!criteria.lowercase) suggestions.push('添加小写字母 (a-z)')
  if (!criteria.number) suggestions.push('添加数字 (0-9)')
  if (!criteria.special) suggestions.push('添加特殊字符 (!@#$%^&*)')
  if (!criteria.noSequence) suggestions.push('避免连续字符 (abc, 123)')
  if (!criteria.noCommon) suggestions.push('避免使用常见密码')

  return { score, level, criteria, suggestions }
}

function hasSequence(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    '0123456789',
    '9876543210',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ]

  const lower = password.toLowerCase()
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const sub = seq.substring(i, i + 3)
      if (lower.includes(sub)) return true
    }
  }
  return false
}

function hasRepeats(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true
    }
  }
  return false
}

function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase())
}

function generatePassword(options: {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  special: boolean
}): string {
  let chars = ''
  if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (options.numbers) chars += '0123456789'
  if (options.special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz'

  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < options.length; i++) {
    password += chars[array[i] % chars.length]
  }

  return password
}

const levelConfig = {
  weak: { label: '弱', color: '#ef4444' },
  fair: { label: '中等', color: '#f97316' },
  good: { label: '强', color: '#eab308' },
  strong: { label: '非常强', color: '#22c55e' }
}

export default function PasswordStrength() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [genOptions, setGenOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true
  })

  const strength = useMemo(() => calculateStrength(password), [password])

  const handleGenerate = () => {
    const newPassword = generatePassword(genOptions)
    setGeneratedPassword(newPassword)
    setCopied(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const criteriaList = [
    { key: 'length8', label: '长度 ≥ 8 字符', value: password.length >= 8 },
    { key: 'length12', label: '长度 ≥ 12 字符', value: password.length >= 12 },
    { key: 'uppercase', label: '包含大写字母 (A-Z)', value: strength.criteria.uppercase },
    { key: 'lowercase', label: '包含小写字母 (a-z)', value: strength.criteria.lowercase },
    { key: 'number', label: '包含数字 (0-9)', value: strength.criteria.number },
    { key: 'special', label: '包含特殊字符 (!@#$%^&*)', value: strength.criteria.special },
    { key: 'noSequence', label: '无连续字符 (abc, 123)', value: strength.criteria.noSequence },
    { key: 'noCommon', label: '无常见模式 (password, qwerty)', value: strength.criteria.noCommon }
  ]

  return (
    <ToolLayout title="密码强度检测" description="检测密码安全等级并生成强密码">
      {/* Password Input Section */}
      <div style={{ marginBottom: 24 }}>
        <label className="tool-label">输入密码</label>
        <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码进行检测..."
            style={{ paddingRight: 44, width: '100%' }}
          />
          <button
            className="btn-icon"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-secondary)'
            }}
            title={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Strength Meter */}
      {password.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="tool-label">强度等级</span>
            <span style={{ color: levelConfig[strength.level].color, fontWeight: 600, fontSize: 14 }}>
              {levelConfig[strength.level].label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: strength.score > (i * 25)
                    ? levelConfig[strength.level].color
                    : 'var(--border)',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>安全评分</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: levelConfig[strength.level].color }}>
              {strength.score}
            </span>
          </div>
        </div>
      )}

      {/* Criteria Checklist */}
      {password.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label className="tool-label" style={{ marginBottom: 12 }}>安全标准</label>
          <div style={{ display: 'grid', gap: 8 }}>
            {criteriaList.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 6,
                  fontSize: 13
                }}
              >
                <span style={{ color: item.value ? '#22c55e' : '#ef4444' }}>
                  {item.value ? <Check size={16} /> : <X size={16} />}
                </span>
                <span style={{ color: item.value ? 'var(--text)' : 'var(--text-secondary)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {strength.suggestions.length > 0 && password.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label className="tool-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={16} style={{ color: '#eab308' }} />
            改进建议
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {strength.suggestions.map((suggestion, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  borderLeft: '3px solid #eab308',
                  borderRadius: '0 6px 6px 0',
                  fontSize: 13,
                  color: 'var(--text)'
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Generator Section */}
      <div style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: '1px solid var(--border)'
      }}>
        <label className="tool-label" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={16} />
          密码生成器
        </label>

        {/* Generated Password Display */}
        {generatedPassword && (
          <div style={{ marginBottom: 16 }}>
            <div className="tool-output" style={{
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: 1,
              wordBreak: 'break-all',
              padding: '12px 16px'
            }}>
              {generatedPassword}
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: 8 }}
              onClick={() => handleCopy(generatedPassword)}
            >
              <Copy size={14} />
              {copied ? '已复制' : '复制密码'}
            </button>
          </div>
        )}

        {/* Generator Options */}
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="tool-label" style={{ minWidth: 60, margin: 0 }}>长度</label>
            <input
              type="range"
              min="8"
              max="32"
              value={genOptions.length}
              onChange={(e) => setGenOptions({ ...genOptions, length: parseInt(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>
              {genOptions.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { key: 'uppercase', label: '大写字母 (A-Z)' },
              { key: 'lowercase', label: '小写字母 (a-z)' },
              { key: 'numbers', label: '数字 (0-9)' },
              { key: 'special', label: '特殊字符 (!@#$)' }
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                <input
                  type="checkbox"
                  checked={genOptions[item.key as keyof typeof genOptions] as boolean}
                  onChange={(e) => setGenOptions({ ...genOptions, [item.key]: e.target.checked })}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <button
          className="btn"
          style={{ marginTop: 16, width: '100%' }}
          onClick={handleGenerate}
        >
          <RefreshCw size={16} />
          生成密码
        </button>
      </div>
    </ToolLayout>
  )
}
