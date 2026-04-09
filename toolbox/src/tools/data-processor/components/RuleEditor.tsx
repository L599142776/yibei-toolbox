// 规则编辑器组件 - 支持单条和批量添加规则 - 优化样式

import { useState } from 'react'
import { X, Plus, List, AlertCircle, Info } from 'lucide-react'
import type { ProcessingRule, ReplaceType } from '../types'
import Select from '../../../components/ui/Select'

interface RuleEditorProps {
  columns: string[]
  columnLabels?: string[]
  rule?: ProcessingRule | null
  isOpen: boolean
  onClose: () => void
  onSave: (rules: ProcessingRule[]) => void
}

/**
 * 规则编辑器组件 - 优化样式版本
 * 支持单条添加和批量添加规则
 */
export function RuleEditor({
  columns,
  columnLabels,
  rule,
  isOpen,
  onClose,
  onSave,
}: RuleEditorProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [column, setColumn] = useState(rule?.column || columns[0] || '')
  const [oldValue, setOldValue] = useState(rule?.oldValue || '')
  const [newValue, setNewValue] = useState(rule?.newValue || '')
  const [replaceType, setReplaceType] = useState<ReplaceType>(
    rule?.replaceType || 'whole'
  )
  const [batchText, setBatchText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!rule

  // 使用 columnLabels 用于显示（如果有），但保留原始 columns 用于数据
  const displayColumns = columnLabels && columnLabels.length > 0 ? columnLabels : columns
  const columnOptions = columns.map((col, idx) => ({ 
    value: col, 
    label: displayColumns[idx] ?? col 
  }))

  const handleSave = () => {
    setError(null)

    try {
      if (isEditMode) {
        if (!column) {
          setError('请选择目标列')
          return
        }
        if (oldValue === '') {
          setError('旧值不能为空')
          return
        }

        const updatedRule: ProcessingRule = {
          id: rule!.id,
          column,
          oldValue,
          newValue,
          replaceType,
        }
        onSave([updatedRule])
      } else if (mode === 'single') {
        if (!column) {
          setError('请选择目标列')
          return
        }
        if (oldValue === '') {
          setError('旧值不能为空')
          return
        }

        const newRule: ProcessingRule = {
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          column,
          oldValue,
          newValue,
          replaceType,
        }
        onSave([newRule])
      } else {
        if (!column) {
          setError('请选择目标列')
          return
        }
        if (!batchText.trim()) {
          setError('请输入批量规则')
          return
        }

        const rules: ProcessingRule[] = []
        const lines = batchText.split('\n')

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          let parts: string[] = []
          if (trimmedLine.includes('→')) {
            parts = trimmedLine.split('→', 2)
          } else if (trimmedLine.includes('->')) {
            parts = trimmedLine.split('->', 2)
          } else {
            continue
          }

          if (parts.length === 2) {
            const oldVal = parts[0].trim()
            const newVal = parts[1].trim()

            if (oldVal) {
              rules.push({
                id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                column,
                oldValue: oldVal,
                newValue: newVal,
                replaceType,
              })
            }
          }
        }

        if (rules.length === 0) {
          setError('未解析到有效规则，请检查格式')
          return
        }

        onSave(rules)
      }

      if (!isEditMode) {
        setOldValue('')
        setNewValue('')
        setBatchText('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const getBatchRuleCount = () => {
    if (!batchText.trim()) return 0
    return batchText
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        return trimmed && (trimmed.includes('→') || trimmed.includes('->'))
      }).length
  }

  if (!isOpen) return null

  return (
    <div className="rule-editor-overlay">
      <div className="rule-editor-modal">
        {/* 标题栏 */}
        <div className="rule-editor-header">
          <h3 className="rule-editor-title">
            {isEditMode ? '编辑规则' : '添加规则'}
          </h3>
          <button
            onClick={onClose}
            className="rule-editor-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rule-editor-body">
          {/* 目标列选择 */}
          <div className="rule-editor-field">
            <label className="rule-editor-label">
              目标列 <span className="rule-editor-required">*</span>
            </label>
            <Select
              value={column}
              onChange={setColumn}
              options={columnOptions}
              width="100%"
              placeholder="请选择列"
            />
          </div>

          {/* 添加模式切换 */}
          {!isEditMode && (
            <div className="rule-editor-mode-toggle">
              <button
                onClick={() => setMode('single')}
                className={`rule-editor-mode-btn ${mode === 'single' ? 'active' : ''}`}
              >
                <Plus className="w-4 h-4" />
                单条添加
              </button>
              <button
                onClick={() => setMode('batch')}
                className={`rule-editor-mode-btn ${mode === 'batch' ? 'active' : ''}`}
              >
                <List className="w-4 h-4" />
                批量添加
              </button>
            </div>
          )}

          {/* 替换类型 */}
          <div className="rule-editor-field">
            <label className="rule-editor-label">替换类型</label>
            <div className="rule-editor-radio-group">
              <label
                className={`rule-editor-radio-card ${replaceType === 'whole' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  value="whole"
                  checked={replaceType === 'whole'}
                  onChange={(e) => setReplaceType(e.target.value as ReplaceType)}
                  className="rule-editor-radio"
                />
                <div className="rule-editor-radio-content">
                  <span className="rule-editor-radio-title">整体替换</span>
                  <span className="rule-editor-radio-desc">完整内容匹配时替换</span>
                </div>
              </label>
              <label
                className={`rule-editor-radio-card ${replaceType === 'partial' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  value="partial"
                  checked={replaceType === 'partial'}
                  onChange={(e) => setReplaceType(e.target.value as ReplaceType)}
                  className="rule-editor-radio"
                />
                <div className="rule-editor-radio-content">
                  <span className="rule-editor-radio-title">局部替换</span>
                  <span className="rule-editor-radio-desc">查找并替换所有匹配项</span>
                </div>
              </label>
            </div>
          </div>

          {/* 单条添加表单 */}
          {mode === 'single' && (
            <div className="rule-editor-form">
              <div className="rule-editor-field">
                <label className="rule-editor-label">
                  旧值 <span className="rule-editor-required">*</span>
                </label>
                <input
                  type="text"
                  value={oldValue}
                  onChange={(e) => setOldValue(e.target.value)}
                  placeholder="输入要替换的值"
                  className="rule-editor-input"
                />
              </div>
              <div className="rule-editor-field">
                <label className="rule-editor-label">新值</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="输入替换后的值"
                  className="rule-editor-input"
                />
              </div>
            </div>
          )}

          {/* 批量添加表单 */}
          {mode === 'batch' && !isEditMode && (
            <div className="rule-editor-batch">
              <label className="rule-editor-label">
                批量规则 <span className="rule-editor-required">*</span>
              </label>
              <div className="rule-editor-batch-hint">
                <Info className="rule-editor-batch-hint-icon" />
                <div className="rule-editor-batch-hint-content">
                  <p className="rule-editor-batch-hint-title">格式说明</p>
                  <p>每行输入一条规则，格式为 <code className="rule-editor-code">旧值→新值</code> 或 <code className="rule-editor-code">旧值-&gt;新值</code></p>
                  <p className="rule-editor-batch-hint-example">示例：张三→李四 或 DK001-&gt;DK999</p>
                </div>
              </div>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="在此输入批量替换规则，每行一条&#10;格式：旧值→新值 或 旧值->新值&#10;&#10;例如：&#10;张三→李四&#10;222403203208→33&#10;DK001→DK999"
                rows={6}
                className="rule-editor-textarea"
              />
              <p className="rule-editor-batch-count">
                已识别 <span className="rule-editor-batch-count-num">{getBatchRuleCount()}</span> 条规则
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rule-editor-error">
              <AlertCircle className="rule-editor-error-icon" />
              <span className="rule-editor-error-text">{error}</span>
            </div>
          )}
        </div>

        {/* 按钮栏 */}
        <div className="rule-editor-footer">
          <button
            onClick={onClose}
            className="rule-editor-btn-cancel"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rule-editor-btn-save"
          >
            {isEditMode ? '保存' : mode === 'batch' ? `批量添加 (${getBatchRuleCount()})` : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
