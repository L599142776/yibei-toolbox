// 数据批量整理工具 - 主入口

import { useState } from 'react'
import { FileUp, Play, RotateCcw, CheckCircle, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { FileUploader } from './components/FileUploader'
import { DataPreview } from './components/DataPreview'
import { RuleManager } from './components/RuleManager'
import { useFileParser } from './hooks/useFileParser'
import { useRuleEngine } from './hooks/useRuleEngine'
import { useDataProcessor } from './hooks/useDataProcessor'
import type { FileParseOptions, ProcessingRule } from './types'

export default function DataProcessor() {
  const { parsedData, isParsing, error: parseError, parseFile, clearData } = useFileParser()

  const {
    rules,
    addRule,
    editRule,
    removeRule,
    moveRuleUp,
    moveRuleDown,
    clearRules,
    exportRules,
    importRules,
  } = useRuleEngine()

  const {
    isProcessing,
    progress,
    error: processError,
    processAndExport,
    clearProcessedData,
  } = useDataProcessor()

  const [showSuccess, setShowSuccess] = useState(false)

  const handleFileSelect = async (file: File, options?: FileParseOptions) => {
    await parseFile(file, options)
    clearRules()
    clearProcessedData()
    setShowSuccess(false)
  }

  const handleAddRule = (rule: ProcessingRule) => {
    addRule(rule.column, rule.oldValue, rule.newValue, rule.replaceType)
  }

  const handleAddBatchRules = (newRules: ProcessingRule[]) => {
    newRules.forEach((rule) => {
      addRule(rule.column, rule.oldValue, rule.newValue, rule.replaceType)
    })
  }

  const handleEditRule = (id: string, rule: ProcessingRule) => {
    editRule(id, rule)
  }

  const handleProcessAndExport = async () => {
    if (!parsedData) return

    try {
      await processAndExport(parsedData, rules)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      // 处理完成后清空规则
      clearRules()
    } catch (error) {
      console.error('处理失败:', error)
    }
  }

  const handleReset = () => {
    clearData()
    clearRules()
    clearProcessedData()
    setShowSuccess(false)
  }

  return (
    <ToolLayout
      title="数据批量整理"
      description="支持 Excel、CSV、JSON 文件的数据批量整理，可添加多条处理规则进行值替换"
    >
      <div className="data-processor">
        {/* 文件上传区域 */}
        <section className="data-processor-section">
          <div className="data-processor-section-header">
            <div className="data-processor-section-icon blue">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="data-processor-section-title">上传文件</h3>
              <p className="data-processor-section-desc">支持 Excel、CSV、JSON 格式</p>
            </div>
          </div>
          <div className="data-processor-section-content">
            <FileUploader
              onFileSelect={handleFileSelect}
              isLoading={isParsing}
              error={parseError}
            />
          </div>
        </section>

        {/* 数据预览区域 */}
        {parsedData && (
          <section className="data-processor-section">
            <div className="data-processor-section-header">
              <div className="data-processor-section-icon blue">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="data-processor-section-title">数据预览</h3>
                <p className="data-processor-section-desc">预览前 100 行数据</p>
              </div>
            </div>
            <div className="data-processor-section-content">
              <DataPreview data={parsedData} maxPreviewRows={100} />
            </div>
          </section>
        )}

        {/* 规则管理区域 */}
        {parsedData && (
          <section className="data-processor-section">
            <div className="data-processor-section-header">
              <div className="data-processor-section-icon purple">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="data-processor-section-title">处理规则</h3>
                <p className="data-processor-section-desc">添加数据替换规则</p>
              </div>
            </div>
            <div className="data-processor-section-content">
              <RuleManager
                rules={rules}
                columns={parsedData.columns}
                columnLabels={parsedData.columnLabels}
                onAddRule={handleAddRule}
                onAddBatchRules={handleAddBatchRules}
                onEditRule={handleEditRule}
                onRemoveRule={removeRule}
                onMoveRuleUp={moveRuleUp}
                onMoveRuleDown={moveRuleDown}
                onClearRules={clearRules}
                onExportRules={exportRules}
                onImportRules={importRules}
              />
            </div>
          </section>
        )}

        {/* 处理操作区域 */}
        {parsedData && rules.length > 0 && (
          <section className="data-processor-section">
            <div className="data-processor-section-header">
              <div className="data-processor-section-icon emerald">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h3 className="data-processor-section-title">处理并导出</h3>
                <p className="data-processor-section-desc">应用规则并导出处理后的文件</p>
              </div>
            </div>

            <div className="data-processor-section-content">
              {/* 进度显示 */}
              {isProcessing && progress && (
                <div className="data-processor-progress">
                  <div className="data-processor-progress-info">
                    <span className="data-processor-progress-message">
                      {progress.message}
                    </span>
                    <span className="data-processor-progress-count">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="data-processor-progress-bar">
                    <div
                      className="data-processor-progress-fill"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {processError && (
                <div className="data-processor-error">
                  <AlertCircle className="data-processor-error-icon" />
                  <span>{processError}</span>
                </div>
              )}

              {/* 成功提示 */}
              {showSuccess && (
                <div className="data-processor-success">
                  <div className="data-processor-success-icon">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="data-processor-success-title">数据处理完成！</p>
                    <p className="data-processor-success-desc">文件已自动下载到本地</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="data-processor-actions">
                <button
                  onClick={handleProcessAndExport}
                  disabled={isProcessing || rules.length === 0}
                  className="data-processor-btn-primary"
                >
                  <Play className="w-4 h-4" />
                  {isProcessing ? '处理中...' : '处理并导出'}
                </button>

                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="data-processor-btn-secondary"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新开始
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 使用说明 */}
        <section className="data-processor-help">
          <div className="data-processor-help-header">
            <div className="data-processor-help-icon">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="data-processor-help-title">使用说明</h4>
          </div>
          <div className="data-processor-help-content">
            <div>
              <h5 className="data-processor-help-subtitle">操作步骤</h5>
              <ol className="data-processor-help-list">
                <li>上传 Excel、CSV 或 JSON 文件</li>
                <li>预览数据，确认列名和数据内容</li>
                <li>添加处理规则，支持"整体替换"和"局部替换"</li>
                <li>规则按顺序匹配，第一条匹配成功的规则生效</li>
                <li>点击"处理并导出"生成处理后的文件</li>
              </ol>
            </div>
            <div>
              <h5 className="data-processor-help-subtitle">替换类型说明</h5>
              <div className="data-processor-help-cards">
                <div className="data-processor-help-card">
                  <div className="data-processor-help-card-header">
                    <span className="data-processor-help-card-badge whole">整体替换</span>
                  </div>
                  <p className="data-processor-help-card-desc">只有当单元格完整内容与旧值完全相同时才替换</p>
                </div>
                <div className="data-processor-help-card">
                  <div className="data-processor-help-card-header">
                    <span className="data-processor-help-card-badge partial">局部替换</span>
                  </div>
                  <p className="data-processor-help-card-desc">在单元格内容中查找旧值并替换所有匹配项</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}
