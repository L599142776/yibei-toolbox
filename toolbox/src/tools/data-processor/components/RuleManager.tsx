// 规则管理器组件 - 优化样式

import { useState, useRef } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  ListOrdered,
  ShieldAlert,
} from 'lucide-react'
import { RuleEditor } from './RuleEditor'
import type { ProcessingRule } from '../types'

interface RuleManagerProps {
  rules: ProcessingRule[]
  columns: string[]
  columnLabels?: string[]
  onAddRule: (rule: ProcessingRule) => void
  onAddBatchRules: (rules: ProcessingRule[]) => void
  onEditRule: (id: string, rule: ProcessingRule) => void
  onRemoveRule: (id: string) => void
  onMoveRuleUp: (id: string) => void
  onMoveRuleDown: (id: string) => void
  onClearRules: () => void
  onExportRules: () => string
  onImportRules: (jsonString: string) => void
}

/**
 * 规则管理器组件 - 优化样式版本
 * 展示规则列表，支持增删改查、排序、导入导出
 */
export function RuleManager({
  rules,
  columns,
  columnLabels,
  onAddRule,
  onAddBatchRules,
  onEditRule,
  onRemoveRule,
  onMoveRuleUp,
  onMoveRuleDown,
  onClearRules,
  onExportRules,
  onImportRules,
}: RuleManagerProps) {
  // 使用 columnLabels 用于显示（如果有），columns 用于数据处理
  const displayColumns = columnLabels && columnLabels.length > 0 ? columnLabels : columns

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ProcessingRule | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddClick = () => {
    setEditingRule(null)
    setIsEditorOpen(true)
  }

  const handleEditClick = (rule: ProcessingRule) => {
    setEditingRule(rule)
    setIsEditorOpen(true)
  }

  const handleEditorSave = (savedRules: ProcessingRule[]) => {
    if (editingRule) {
      onEditRule(editingRule.id, savedRules[0])
    } else if (savedRules.length === 1) {
      onAddRule(savedRules[0])
    } else {
      onAddBatchRules(savedRules)
    }
    setIsEditorOpen(false)
    setEditingRule(null)
  }

  const handleEditorClose = () => {
    setIsEditorOpen(false)
    setEditingRule(null)
  }

  const handleExport = () => {
    const jsonString = onExportRules()
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rules_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        onImportRules(content)
      } catch (error) {
        alert('导入规则失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getReplaceTypeInfo = (type: string) => {
    return type === 'whole'
      ? { text: '整体', className: 'replace-type-whole' }
      : { text: '局部', className: 'replace-type-partial' }
  }

  return (
    <div className="rule-manager">
      {/* 规则匹配说明 */}
      <div className="rule-manager-alert">
        <ShieldAlert className="rule-manager-alert-icon" />
        <div className="rule-manager-alert-content">
          <p className="rule-manager-alert-title">规则匹配说明</p>
          <p className="rule-manager-alert-desc">
            规则按列表顺序从上到下匹配，<strong>第一条匹配成功的规则生效</strong>，后续规则不再执行。
            可通过"上移"/"下移"按钮调整规则顺序。
          </p>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="rule-manager-toolbar">
        <button
          onClick={handleAddClick}
          disabled={columns.length === 0}
          className="rule-manager-btn-primary"
        >
          <Plus className="w-4 h-4" />
          添加规则
        </button>

        <div className="rule-manager-toolbar-spacer" />

        <button
          onClick={handleExport}
          disabled={rules.length === 0}
          className="rule-manager-btn-secondary"
        >
          <Download className="w-4 h-4" />
          导出规则
        </button>

        <button
          onClick={handleImportClick}
          className="rule-manager-btn-secondary"
        >
          <Upload className="w-4 h-4" />
          导入规则
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />

        {rules.length > 0 && (
          <button
            onClick={onClearRules}
            className="rule-manager-btn-danger"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        )}
      </div>

      {/* 规则列表 */}
      {rules.length === 0 ? (
        <div className="rule-manager-empty">
          <div className="rule-manager-empty-icon">
            <ListOrdered className="w-8 h-8" />
          </div>
          <p className="rule-manager-empty-text">暂无规则</p>
          <p className="rule-manager-empty-hint">点击"添加规则"开始创建数据处理规则</p>
        </div>
      ) : (
        <div className="rule-manager-table-wrap">
          <table className="rule-manager-table">
            <thead className="rule-manager-thead">
              <tr>
                <th className="rule-manager-th-num">序号</th>
                <th className="rule-manager-th">目标列</th>
                <th className="rule-manager-th">旧值</th>
                <th className="rule-manager-th">新值</th>
                <th className="rule-manager-th-type">类型</th>
                <th className="rule-manager-th-action">操作</th>
              </tr>
            </thead>
            <tbody className="rule-manager-tbody">
              {rules.map((rule, index) => {
                const typeInfo = getReplaceTypeInfo(rule.replaceType)
                return (
                  <tr
                    key={rule.id}
                    className="rule-manager-row"
                  >
                    <td className="rule-manager-td-num">
                      <span className="rule-manager-num-badge">
                        {index + 1}
                      </span>
                    </td>
                    <td className="rule-manager-td">
                      <span className="rule-manager-column">
                        {/* 显示中文列名，如果找不到则显示原始列名 */}
                        {columns.indexOf(rule.column) >= 0 
                          ? displayColumns[columns.indexOf(rule.column)] 
                          : rule.column}
                      </span>
                    </td>
                    <td className="rule-manager-td-value">
                      <span className="rule-manager-old-value" title={rule.oldValue}>
                        {rule.oldValue || '(空)'}
                      </span>
                    </td>
                    <td className="rule-manager-td-value">
                      <span className="rule-manager-new-value" title={rule.newValue}>
                        {rule.newValue || '(空)'}
                      </span>
                    </td>
                    <td className="rule-manager-td">
                      <span className={`rule-manager-type-badge ${typeInfo.className}`}>
                        {typeInfo.text}
                      </span>
                    </td>
                    <td className="rule-manager-td-action">
                      <div className="rule-manager-actions">
                        <button
                          onClick={() => onMoveRuleUp(rule.id)}
                          disabled={index === 0}
                          className="rule-manager-action-btn"
                          title="上移"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onMoveRuleDown(rule.id)}
                          disabled={index === rules.length - 1}
                          className="rule-manager-action-btn"
                          title="下移"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(rule)}
                          className="rule-manager-action-btn rule-manager-action-btn-edit"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveRule(rule.id)}
                          className="rule-manager-action-btn rule-manager-action-btn-delete"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 规则统计 */}
      {rules.length > 0 && (
        <div className="rule-manager-stats">
          <ListOrdered className="w-4 h-4" />
          <span>共 {rules.length} 条规则</span>
        </div>
      )}

      {/* 规则编辑器弹窗 */}
      <RuleEditor
        columns={columns}
        columnLabels={displayColumns}
        rule={editingRule}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    </div>
  )
}
