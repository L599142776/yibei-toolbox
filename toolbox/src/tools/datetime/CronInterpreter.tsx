// src/tools/datetime/CronInterpreter.tsx
import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// ============================================================
// 类型定义
// ============================================================



interface CronParts {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

// ============================================================
// 常量
// ============================================================

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const PRESETS = [
  { label: '每分钟', expression: '* * * * *', description: '每分钟执行一次' },
  { label: '每小时', expression: '0 * * * *', description: '每小时整点执行' },
  { label: '每天午夜', expression: '0 0 * * *', description: '每天 00:00 执行' },
  { label: '每天9点', expression: '0 9 * * *', description: '每天上午9点执行' },
  { label: '每周一', expression: '0 0 * * 1', description: '每周一 00:00 执行' },
  { label: '每月1号', expression: '0 0 1 * *', description: '每月1号 00:00 执行' },
  { label: '每季度', expression: '0 0 1 1,4,7,10 *', description: '每季度第一天执行' },
  { label: '工作日9点', expression: '0 9 * * 1-5', description: '周一至周五9点执行' },
]

// ============================================================
// Cron 解析函数
// ============================================================

function parseCronPart(value: number, pattern: string, min: number, max: number): boolean {
  if (pattern === '*') return true

  // 处理列表 (1,3,5)
  if (pattern.includes(',')) {
    return pattern.split(',').some(p => parseCronPart(value, p.trim(), min, max))
  }

  // 处理范围 (1-5)
  if (pattern.includes('-') && !pattern.startsWith('-')) {
    const [start, end] = pattern.split('-').map(Number)
    return value >= start && value <= end
  }

  // 处理步长 (*/5, 1-10/2)
  if (pattern.includes('/')) {
    const [range, stepStr] = pattern.split('/')
    const step = parseInt(stepStr, 10)
    
    if (range === '*') {
      return value % step === 0
    }
    
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number)
      const effectiveStart = Math.max(start, min)
      const adjustedValue = value - effectiveStart
      return adjustedValue >= 0 && adjustedValue <= (end - effectiveStart) && adjustedValue % step === 0
    }
    
    return value >= parseInt(range, 10) && value % step === 0
  }

  // 数字
  return value === parseInt(pattern, 10)
}

function parseCronExpression(expression: string): CronParts | null {
  const trimmed = expression.trim().toLowerCase()
  
  // 处理特殊别名
  const aliases: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
  }

  const resolved = aliases[trimmed] || trimmed
  const parts = resolved.split(/\s+/)

  if (parts.length !== 5) return null

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  }
}

function explainCronParts(parts: CronParts): string[] {
  const explanations: string[] = []

  // 分钟
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts
  
  if (minute === '*') {
    explanations.push('每分钟')
  } else if (minute.includes('/')) {
    const step = minute.split('/')[1]
    explanations.push(`每 ${step} 分钟`)
  } else if (minute.includes('-')) {
    const [start, end] = minute.split('-')
    explanations.push(`在第 ${start} 到 ${end} 分钟`)
  } else if (minute.includes(',')) {
    explanations.push(`在第 ${minute} 分钟`)
  } else {
    explanations.push(`在第 ${minute} 分钟`)
  }

  // 小时
  if (hour === '*') {
    explanations.push('每小时')
  } else if (hour.includes('/')) {
    const step = hour.split('/')[1]
    explanations.push(`每 ${step} 小时`)
  } else if (hour.includes('-')) {
    const [start, end] = hour.split('-')
    explanations.push(`在 ${start}:00 到 ${end}:00`)
  } else if (hour.includes(',')) {
    const hours = hour.split(',').map(h => `${h}:00`).join('、')
    explanations.push(`在 ${hours}`)
  } else {
    explanations.push(`${hour} 点`)
  }

  // 日期和月份
  // 月份
  if (month === '*') {
    explanations.push('每月')
  } else if (month.includes(',')) {
    const months = month.split(',').map(m => MONTH_NAMES[parseInt(m) - 1]).join('、')
    explanations.push(months)
  } else {
    explanations.push(`${MONTH_NAMES[parseInt(month) - 1]}`)
  }

  // 日期
  if (dayOfMonth !== '*') {
    if (dayOfMonth.includes('/')) {
      const step = dayOfMonth.split('/')[1]
      explanations.push(`每 ${step} 天`)
    } else if (dayOfMonth.includes('-')) {
      const [start, end] = dayOfMonth.split('-')
      explanations.push(`第 ${start} 到 ${end} 日`)
    } else {
      explanations.push(`${dayOfMonth} 日`)
    }
  }

  // 星期
  if (dayOfWeek !== '*') {
    if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(Number)
      explanations.push(`星期 ${WEEKDAY_NAMES[start]} 到 ${WEEKDAY_NAMES[end]}`)
    } else if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(d => WEEKDAY_NAMES[parseInt(d)]).join('、')
      explanations.push(days)
    } else {
      explanations.push(`${WEEKDAY_NAMES[parseInt(dayOfWeek)]}`)
    }
  }

  return explanations
}

function getDetailedExplanation(parts: CronParts): string {
  const lines: string[] = []
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts

  // 分钟字段
  lines.push('【分钟】' + explainField('分钟', minute, 0, 59))
  // 小时字段
  lines.push('【小时】' + explainField('小时', hour, 0, 23))
  // 日期字段
  lines.push('【日期】' + explainField('日期', dayOfMonth, 1, 31))
  // 月份字段
  lines.push('【月份】' + explainField('月份', month, 1, 12))
  // 星期字段
  lines.push('【星期】' + explainField('星期', dayOfWeek, 0, 6))

  return lines.join('\n')
}

function explainField(fieldName: string, pattern: string, min: number, max: number): string {
  if (pattern === '*') return `每 ${fieldName} 都匹配 (${min}-${max})`

  const parts: string[] = []

  if (pattern.includes('/')) {
    const [, step] = pattern.split('/')
    parts.push(`每 ${step} 个 ${fieldName} 匹配一次`)
  }

  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-')
    parts.push(`从 ${start} 到 ${end} 匹配`)
  }

  if (pattern.includes(',')) {
    const values = pattern.split(',')
    parts.push(`匹配第 ${values.join('、')} 个 ${fieldName}`)
  }

  if (!pattern.includes('/') && !pattern.includes('-') && !pattern.includes(',')) {
    parts.push(`匹配第 ${pattern} 个 ${fieldName}`)
  }

  return parts.join('，') || pattern
}

function calculateNextRuns(parts: CronParts, count: number): Date[] {
  const runs: Date[] = []
  const now = new Date()
  const cur = new Date(now)
  cur.setSeconds(0, 0)

  // 最多尝试 2 年的分钟数
  const maxIterations = 2 * 365 * 24 * 60

  for (let i = 0; i < maxIterations && runs.length < count; i++) {
    cur.setTime(cur.getTime() + 60000) // +1 minute

    const minute = cur.getMinutes()
    const hour = cur.getHours()
    const dayOfMonth = cur.getDate()
    const month = cur.getMonth() + 1
    const dayOfWeek = cur.getDay()

    const minuteMatch = parseCronPart(minute, parts.minute, 0, 59)
    const hourMatch = parseCronPart(hour, parts.hour, 0, 23)
    const dayMatch = parseCronPart(dayOfMonth, parts.dayOfMonth, 1, 31)
    const monthMatch = parseCronPart(month, parts.month, 1, 12)
    const weekdayMatch = parseCronPart(dayOfWeek, parts.dayOfWeek, 0, 6)

    if (minuteMatch && hourMatch && dayMatch && monthMatch && weekdayMatch) {
      runs.push(new Date(cur))
    }
  }

  return runs
}

// ============================================================
// 组件
// ============================================================

export default function CronInterpreter() {
  const [activeTab, setActiveTab] = useState<'parse' | 'build'>('parse')
  const [expression, setExpression] = useState('0 9 * * 1-5')
  const [nextRunCount, setNextRunCount] = useState(10)
  const [copied, setCopied] = useState(false)

  // 可视化构建状态
  const [buildParts, setBuildParts] = useState<CronParts>({
    minute: '0',
    hour: '9',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5',
  })

  // 解析结果
  const parsedExpression = useMemo(() => {
    if (activeTab === 'parse') {
      return parseCronExpression(expression)
    }
    return null
  }, [expression, activeTab])

  const builtExpression = useMemo(() => {
    if (activeTab === 'build') {
      return `${buildParts.minute} ${buildParts.hour} ${buildParts.dayOfMonth} ${buildParts.month} ${buildParts.dayOfWeek}`
    }
    return ''
  }, [buildParts, activeTab])

  const currentExpression = activeTab === 'parse' ? expression : builtExpression
  const currentParts = activeTab === 'parse' ? parsedExpression : buildParts

  const explanation = useMemo((): string[] => {
    if (!currentParts) return []
    return explainCronParts(currentParts)
  }, [currentParts])

  const detailedExplanation = useMemo(() => {
    if (!currentParts) return ''
    return getDetailedExplanation(currentParts)
  }, [currentParts])

  const nextRuns = useMemo(() => {
    if (!currentParts) return []
    return calculateNextRuns(currentParts, nextRunCount)
  }, [currentParts, nextRunCount])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentExpression)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentExpression])

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setExpression(preset.expression)
    const parts = parseCronExpression(preset.expression)
    if (parts) {
      setBuildParts(parts)
    }
  }, [])

  const handleExpressionChange = useCallback((value: string) => {
    setExpression(value)
    const parts = parseCronExpression(value)
    if (parts) {
      setBuildParts(parts)
    }
  }, [])

  const updateBuildPart = useCallback((field: keyof CronParts, value: string) => {
    setBuildParts(prev => ({ ...prev, [field]: value }))
  }, [])

  const isValidExpression = currentParts !== null

  return (
    <ToolLayout
      title="Cron 表达式解释器"
      description="解析 Cron 表达式，查看执行时间，可视化构建表达式"
    >
      {/* 标签页 */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={`tab-btn ${activeTab === 'parse' ? 'active' : ''}`}
          onClick={() => setActiveTab('parse')}
        >
          表达式解析
        </button>
        <button
          className={`tab-btn ${activeTab === 'build' ? 'active' : ''}`}
          onClick={() => setActiveTab('build')}
        >
          可视化构建
        </button>
      </div>

      {/* 预设快捷按钮 */}
      <div className="btn-group" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.expression}
            className="btn btn-outline"
            onClick={() => applyPreset(preset)}
            title={preset.description}
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 输入/输出区域 */}
      <div className="tool-row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          value={currentExpression}
          onChange={(e) => activeTab === 'parse' && handleExpressionChange(e.target.value)}
          readOnly={activeTab === 'build'}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 18,
            textAlign: 'center',
            background: activeTab === 'build' ? 'var(--bg-secondary)' : undefined,
          }}
        />
        <button className="btn btn-outline" onClick={handleCopy} title="复制">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Cron 格式说明 */}
      <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
        <div style={{ fontFamily: 'monospace', textAlign: 'center', marginBottom: 8, color: 'var(--text-dim)' }}>
          ┌───────────── 分钟 (0-59)<br />
          │ ┌───────────── 小时 (0-23)<br />
          │ │ ┌───────────── 日期 (1-31)<br />
          │ │ │ ┌───────────── 月份 (1-12)<br />
          │ │ │ │ ┌───────────── 星期 (0-6, 0=周日)<br />
          │ │ │ │ │<br />
          {currentExpression.split(' ').map((part, i) => (
            <span key={i} style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#10b981' : i === 2 ? '#3b82f6' : i === 3 ? '#8b5cf6' : '#ef4444' }}>
              {part}{i < 4 ? ' ' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* 可视化构建器 */}
      {activeTab === 'build' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {/* 分钟 */}
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 8, fontWeight: 500 }}>分钟</div>
              <select
                className="select"
                value={buildParts.minute}
                onChange={(e) => updateBuildPart('minute', e.target.value)}
              >
                <option value="*">每分钟</option>
                <option value="0">0 (整点)</option>
                <option value="*/5">每5分钟</option>
                <option value="*/10">每10分钟</option>
                <option value="*/15">每15分钟</option>
                <option value="*/30">每30分钟</option>
                <option value="0,30">0和30分</option>
                <option value="0-29">0-29分</option>
                <option value="30-59">30-59分</option>
              </select>
              <input
                className="input"
                value={buildParts.minute}
                onChange={(e) => updateBuildPart('minute', e.target.value)}
                style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}
                placeholder="自定义"
              />
            </div>

            {/* 小时 */}
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8, fontWeight: 500 }}>小时</div>
              <select
                className="select"
                value={buildParts.hour}
                onChange={(e) => updateBuildPart('hour', e.target.value)}
              >
                <option value="*">每小时</option>
                <option value="0">0 (午夜)</option>
                <option value="9">9 (上午)</option>
                <option value="12">12 (中午)</option>
                <option value="18">18 (下午)</option>
                <option value="*/2">每2小时</option>
                <option value="*/6">每6小时</option>
                <option value="9-17">9-17</option>
                <option value="0,12">0和12</option>
              </select>
              <input
                className="input"
                value={buildParts.hour}
                onChange={(e) => updateBuildPart('hour', e.target.value)}
                style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}
                placeholder="自定义"
              />
            </div>

            {/* 日期 */}
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 8, fontWeight: 500 }}>日期</div>
              <select
                className="select"
                value={buildParts.dayOfMonth}
                onChange={(e) => updateBuildPart('dayOfMonth', e.target.value)}
              >
                <option value="*">每天</option>
                <option value="1">1号</option>
                <option value="15">15号</option>
                <option value="1,15">1号和15号</option>
                <option value="1-7">1-7号</option>
                <option value="*/2">每隔一天</option>
                <option value="*/7">每周</option>
              </select>
              <input
                className="input"
                value={buildParts.dayOfMonth}
                onChange={(e) => updateBuildPart('dayOfMonth', e.target.value)}
                style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}
                placeholder="自定义"
              />
            </div>

            {/* 月份 */}
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#8b5cf6', marginBottom: 8, fontWeight: 500 }}>月份</div>
              <select
                className="select"
                value={buildParts.month}
                onChange={(e) => updateBuildPart('month', e.target.value)}
              >
                <option value="*">每月</option>
                <option value="1">一月</option>
                <option value="6">六月</option>
                <option value="12">十二月</option>
                <option value="1,4,7,10">每季度</option>
                <option value="1-6">上半年</option>
                <option value="*/3">每季度</option>
              </select>
              <input
                className="input"
                value={buildParts.month}
                onChange={(e) => updateBuildPart('month', e.target.value)}
                style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}
                placeholder="自定义"
              />
            </div>

            {/* 星期 */}
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, fontWeight: 500 }}>星期</div>
              <select
                className="select"
                value={buildParts.dayOfWeek}
                onChange={(e) => updateBuildPart('dayOfWeek', e.target.value)}
              >
                <option value="*">每天</option>
                <option value="0">周日</option>
                <option value="1">周一</option>
                <option value="2">周二</option>
                <option value="3">周三</option>
                <option value="4">周四</option>
                <option value="5">周五</option>
                <option value="6">周六</option>
                <option value="1-5">工作日</option>
                <option value="0,6">周末</option>
              </select>
              <input
                className="input"
                value={buildParts.dayOfWeek}
                onChange={(e) => updateBuildPart('dayOfWeek', e.target.value)}
                style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}
                placeholder="自定义"
              />
            </div>
          </div>
        </div>
      )}

      {/* 解释结果 */}
      <div style={{ marginBottom: 16 }}>
        {!isValidExpression ? (
          <div className="tool-output" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
            <AlertCircle size={16} />
            <span>无效的 Cron 表达式</span>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <span className="tool-label">自然语言解释</span>
            </div>
            <div className="tool-output" style={{ textAlign: 'center', fontSize: 16 }}>
              {explanation.length > 0 ? explanation.join(' · ') : '无法解释'}
            </div>
          </>
        )}
      </div>

      {/* 详细解释 */}
      {isValidExpression && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <span className="tool-label">字段详解</span>
          </div>
          <div className="tool-output" style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {detailedExplanation}
          </div>
        </div>
      )}

      {/* 下次执行时间 */}
      {isValidExpression && nextRuns.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="tool-label">下次执行时间</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>显示</span>
              <select
                className="select"
                value={nextRunCount}
                onChange={(e) => setNextRunCount(Number(e.target.value))}
                style={{ width: 80, fontSize: 13, padding: '4px 8px' }}
              >
                <option value={5}>5次</option>
                <option value={10}>10次</option>
                <option value={20}>20次</option>
                <option value={50}>50次</option>
              </select>
            </div>
          </div>
          <div className="tool-output">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-dim)', fontWeight: 500 }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-dim)', fontWeight: 500 }}>时间</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-dim)', fontWeight: 500 }}>相对时间</th>
                </tr>
              </thead>
              <tbody>
                {nextRuns.map((date, index) => {
                  const diff = date.getTime() - Date.now()
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                  
                  let relativeTime = ''
                  if (days > 0) relativeTime = `${days} 天后`
                  else if (hours > 0) relativeTime = `${hours} 小时后`
                  else if (minutes > 0) relativeTime = `${minutes} 分钟后`
                  else relativeTime = '即将执行'

                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-dim)' }}>{index + 1}</td>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace' }}>
                        {date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                      </td>
                      <td style={{ padding: '8px 0', color: '#10b981' }}>{relativeTime}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 特殊字符说明 */}
      <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
        <div style={{ fontWeight: 500, marginBottom: 12 }}>特殊字符说明</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
          <div><code style={{ color: '#f59e0b' }}>*</code> 任意值</div>
          <div><code style={{ color: '#f59e0b' }}>,</code> 列表分隔 (1,3,5)</div>
          <div><code style={{ color: '#f59e0b' }}>-</code> 范围 (1-5)</div>
          <div><code style={{ color: '#f59e0b' }}>/</code> 步长 (*/5)</div>
        </div>
        <div style={{ marginTop: 12, fontWeight: 500 }}>特殊别名</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13, marginTop: 8 }}>
          <div><code style={{ color: '#10b981' }}>@yearly</code> = 0 0 1 1 *</div>
          <div><code style={{ color: '#10b981' }}>@monthly</code> = 0 0 1 * *</div>
          <div><code style={{ color: '#10b981' }}>@weekly</code> = 0 0 * * 0</div>
          <div><code style={{ color: '#10b981' }}>@daily</code> = 0 0 * * *</div>
          <div><code style={{ color: '#10b981' }}>@hourly</code> = 0 * * * *</div>
        </div>
      </div>
    </ToolLayout>
  )
}
