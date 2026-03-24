// src/tools/image/SvgOptimizer.tsx
import ToolLayout from '../../components/ToolLayout'
import { Copy, Download, Trash2, Upload } from 'lucide-react'
import { useState, useCallback, useRef } from 'react'

interface OptimizeOptions {
  removeComments: boolean
  removeMetadata: boolean
  removeEmptyGroups: boolean
  removeUnusedDefs: boolean
  optimizePaths: boolean
  removeDefaults: boolean
  shortColors: boolean
}

interface OptimizeStats {
  before: number
  after: number
}

// Default SVG attribute values
const DEFAULT_ATTRS: Record<string, Record<string, string>> = {
  svg: { version: '1.1', xmlns: 'http://www.w3.org/2000/svg' },
  path: { fill: 'none', stroke: 'none', 'stroke-width': '1' },
  text: { 'font-family': 'sans-serif', 'font-size': '16' },
}

// Short color map
const SHORT_COLORS: Record<string, string> = {
  '#000000': '#000',
  '#ffffff': '#fff',
  '#ff0000': 'red',
  '#00ff00': 'lime',
  '#0000ff': 'blue',
  '#ffff00': 'yellow',
  '#00ffff': 'cyan',
  '#ff00ff': 'magenta',
}

// Attribute groups that can be removed as metadata
const METADATA_TAGS = ['metadata', 'title', 'desc', 'defs > title', 'defs > desc']
const METADATA_ATTRS = ['data-name', 'inkscape', 'sodipodi', 'xmlns:inkscape', 'xmlns:sodipodi', 'xmlns:dc', 'xmlns:cc', 'xmlns:rdf']

export default function SvgOptimizer() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [options, setOptions] = useState<OptimizeOptions>({
    removeComments: true,
    removeMetadata: true,
    removeEmptyGroups: true,
    removeUnusedDefs: true,
    optimizePaths: true,
    removeDefaults: true,
    shortColors: true,
  })
  const [stats, setStats] = useState<OptimizeStats>({ before: 0, after: 0 })
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Remove XML/HTML comments
  const removeComments = (svg: string): string => {
    return svg.replace(/<!--[\s\S]*?-->/g, '')
  }

  // Remove metadata elements and attributes
  const removeMetadata = (svg: string): string => {
    let result = svg
    
    // Remove metadata tags
    METADATA_TAGS.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag.split(' >')[0]}>`, 'gi')
      result = result.replace(regex, '')
    })
    
    // Remove standalone metadata closing tags
    result = result.replace(/<\/metadata>/gi, '')
    
    // Remove metadata attributes
    METADATA_ATTRS.forEach(attr => {
      const regex = new RegExp(`\\s*${attr}="[^"]*"`, 'gi')
      result = result.replace(regex, '')
    })
    
    return result
  }

  // Remove empty groups
  const removeEmptyGroups = (svg: string): string => {
    let result = svg
    
    // Remove empty <g> tags (multiple passes to handle nested)
    let iterations = 0
    const maxIterations = 10
    
    while (iterations < maxIterations) {
      const before = result
      result = result.replace(/<g[^>]*>\s*<\/g>/gi, '')
      result = result.replace(/<g[^>]*\/\s*>/gi, '')
      if (result === before) break
      iterations++
    }
    
    return result
  }

  // Remove unused definitions
  const removeUnusedDefs = (svg: string): string => {
    // Find all defined IDs
    const defsRegex = /<defs[^>]*>([\s\S]*?)<\/defs>/gi
    const definedIds = new Set<string>()
    
    let defsMatch
    while ((defsMatch = defsRegex.exec(svg)) !== null) {
      const defsContent = defsMatch[1]
      // Find IDs in defs
      const idMatches = defsContent.match(/id="([^"]+)"/g) || []
      idMatches.forEach(m => definedIds.add(m.match(/id="([^"]+)"/)?.[1] || ''))
    }
    
    if (definedIds.size === 0) return svg
    
    // Find all used references (url(#id) or #id)
    const usedRefs = new Set<string>()
    const refRegexes = [
      /url\(#([^)]+)\)/g,
      /url\(['"]#([^'"]+)['"]\)/g,
      /#[a-zA-Z_][\w.-]*/g,
    ]
    
    refRegexes.forEach(regex => {
      let match
      while ((match = regex.exec(svg)) !== null) {
        usedRefs.add(match[1] || match[0].slice(1))
      }
    })
    
      // Find IDs that are defined but never used
      const unusedIds = Array.from(definedIds).filter(id => id && !usedRefs.has(id))
    
    if (unusedIds.length === 0) return svg
    
    let result = svg
    
    // Remove elements with unused IDs from defs
    unusedIds.forEach(id => {
      // Remove whole element with this id
      const elementRegex = new RegExp(`<[^>]+(?:id|xml:id)=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi')
      result = result.replace(elementRegex, '')
      // Also remove self-closing elements with this id
      const selfClosingRegex = new RegExp(`<[^>]+(?:id|xml:id)=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^/]*\\/\\s*>`, 'gi')
      result = result.replace(selfClosingRegex, '')
    })
    
    return result
  }

  // Optimize path data
  const optimizePaths = (svg: string): string => {
    let result = svg
    
    // Optimize path d attribute
    const pathRegex = /d="([^"]+)"/gi
    result = result.replace(pathRegex, (_, d: string) => {
      // Remove unnecessary whitespace
      let optimized = d
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ',')
        .replace(/\s*([+-])\s*/g, '$1')
        .trim()
      
      // Remove space after number before letter
      optimized = optimized.replace(/(\d)\s+([a-zA-Z])/gi, '$1$2')
      optimized = optimized.replace(/([a-zA-Z])\s+(\d)/gi, '$1$2')
      
      // Remove trailing zeros
      optimized = optimized.replace(/(\d)\.0+(?=\s|$|[^0-9])/g, '$1')
      optimized = optimized.replace(/(\d)\.(\d*[1-9])0+(?=\s|$|[^0-9])/g, '$1.$2')
      
      // Use relative commands where shorter (h, v instead of H, V)
      optimized = optimized.replace(/H(\d+)/g, 'h$1')
      optimized = optimized.replace(/V(\d+)/g, 'v$1')
      
      return `d="${optimized}"`
    })
    
    return result
  }

  // Remove default attribute values
  const removeDefaults = (svg: string): string => {
    let result = svg
    
    Object.entries(DEFAULT_ATTRS).forEach(([tag, attrs]) => {
      const tagRegex = new RegExp(`<(${tag})([^>]*)(>|\\s)`, 'gi')
      result = result.replace(tagRegex, (_match, tagName, attrsStr, ending) => {
        let modified = attrsStr
        
        Object.entries(attrs).forEach(([attr, defaultVal]) => {
          const attrRegex = new RegExp(`\\s*${attr}="${defaultVal}"`, 'gi')
          modified = modified.replace(attrRegex, '')
        })
        
        // Also remove fill="currentColor" if present (common default)
        modified = modified.replace(/\s*fill="currentColor"/gi, '')
        
        if (modified.trim() === '') {
          return `<${tagName}${ending}`
        }
        return `<${tagName}${modified}${ending}`
      })
    })
    
    return result
  }

  // Convert colors to shorter format
  const shortColors = (svg: string): string => {
    let result = svg
    
    // Replace known short colors
    Object.entries(SHORT_COLORS).forEach(([long, short]) => {
      const regex = new RegExp(`="${long}"`, 'gi')
      result = result.replace(regex, `="${short}"`)
    })
    
    // Convert rgb() to hex
    result = result.replace(/fill="rgb\((\d+),\s*(\d+),\s*(\d+)\)"/gi, (_, r, g, b) => {
      const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
      return `fill="${hex}"`
    })
    
    result = result.replace(/stroke="rgb\((\d+),\s*(\d+),\s*(\d+)\)"/gi, (_, r, g, b) => {
      const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
      return `stroke="${hex}"`
    })
    
    // Shorten 6-char hex colors where possible
    result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/gi, '#$1$2$3')
    
    return result
  }

  // Whitespace normalization
  const normalizeWhitespace = (svg: string): string => {
    let result = svg
    
    // Remove unnecessary whitespace between tags
    result = result.replace(/>\s+</g, '><')
    
    // Remove whitespace at start/end
    result = result.trim()
    
    // Collapse multiple spaces to single space (outside quotes)
    result = result.replace(/(?<!")\s{2,}(?!")/g, ' ')
    
    return result
  }

  // Main optimization function
  const optimize = useCallback((svg: string) => {
    if (!svg.trim()) {
      setOutput('')
      setStats({ before: 0, after: 0 })
      setError('')
      return
    }

    try {
      // Basic validation
      if (!svg.includes('<svg') || !svg.includes('</svg>')) {
        throw new Error('Invalid SVG: Missing <svg> tags')
      }

      let result = svg

      if (options.removeComments) {
        result = removeComments(result)
      }

      if (options.removeMetadata) {
        result = removeMetadata(result)
      }

      if (options.removeEmptyGroups) {
        result = removeEmptyGroups(result)
      }

      if (options.removeUnusedDefs) {
        result = removeUnusedDefs(result)
      }

      if (options.optimizePaths) {
        result = optimizePaths(result)
      }

      if (options.removeDefaults) {
        result = removeDefaults(result)
      }

      if (options.shortColors) {
        result = shortColors(result)
      }

      // Always normalize whitespace
      result = normalizeWhitespace(result)

      // Calculate stats
      const beforeSize = new Blob([svg]).size
      const afterSize = new Blob([result]).size

      setOutput(result)
      setStats({ before: beforeSize, after: afterSize })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed')
      setOutput('')
      setStats({ before: 0, after: 0 })
    }
  }, [options])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setError('Please upload an SVG file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setInput(content)
      optimize(content)
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    optimize(value)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setStats({ before: 0, after: 0 })
    setError('')
  }

  const reduction = stats.before > 0 ? ((stats.before - stats.after) / stats.before * 100).toFixed(1) : '0'

  const toggleOption = (key: keyof OptimizeOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <ToolLayout title="SVG 优化器" description="压缩、清理、格式化 SVG 文件">
      <div className="svg-optimizer">
        {/* Options Panel */}
        <div className="options-panel">
          <h3>优化选项</h3>
          <div className="options-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.removeComments}
                onChange={() => toggleOption('removeComments')}
              />
              <span>移除注释</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.removeMetadata}
                onChange={() => toggleOption('removeMetadata')}
              />
              <span>移除元数据</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.removeEmptyGroups}
                onChange={() => toggleOption('removeEmptyGroups')}
              />
              <span>移除空分组</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.removeUnusedDefs}
                onChange={() => toggleOption('removeUnusedDefs')}
              />
              <span>移除未使用定义</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.optimizePaths}
                onChange={() => toggleOption('optimizePaths')}
              />
              <span>优化路径</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.removeDefaults}
                onChange={() => toggleOption('removeDefaults')}
              />
              <span>移除默认值</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.shortColors}
                onChange={() => toggleOption('shortColors')}
              />
              <span>颜色格式简化</span>
            </label>
          </div>
        </div>

        {/* Main Content */}
        <div className="optimizer-main">
          {/* Left: Input */}
          <div className="optimizer-panel">
            <div className="panel-header">
              <span className="panel-title">输入 SVG</span>
              <div className="panel-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  上传
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleClear}>
                  <Trash2 size={14} />
                  清空
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
            <textarea
              className="svg-textarea"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="粘贴 SVG 代码或上传文件..."
              spellCheck={false}
            />
          </div>

          {/* Right: Output */}
          <div className="optimizer-panel">
            <div className="panel-header">
              <span className="panel-title">优化结果</span>
              <div className="panel-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCopy}
                  disabled={!output}
                >
                  <Copy size={14} />
                  复制
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleDownload}
                  disabled={!output}
                >
                  <Download size={14} />
                  下载
                </button>
              </div>
            </div>
            <textarea
              className="svg-textarea"
              value={output}
              readOnly
              placeholder="优化后的 SVG 将显示在这里..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Stats Bar */}
        {stats.before > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">原始大小</span>
              <span className="stat-value">{stats.before} 字节</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">优化后</span>
              <span className="stat-value">{stats.after} 字节</span>
            </div>
            <div className="stat-item stat-reduction">
              <span className="stat-label">减少</span>
              <span className="stat-value">{reduction}%</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      <style>{`
        .svg-optimizer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .options-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
        }

        .options-panel h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .optimizer-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .optimizer-main {
            grid-template-columns: 1fr;
          }
        }

        .optimizer-panel {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
        }

        .panel-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .panel-actions {
          display: flex;
          gap: 8px;
        }

        .btn-sm {
          padding: 4px 10px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .svg-textarea {
          flex: 1;
          min-height: 300px;
          padding: 12px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          background: var(--bg-primary);
          color: var(--text-primary);
          border: none;
          resize: vertical;
          outline: none;
        }

        .svg-textarea::placeholder {
          color: var(--text-tertiary);
        }

        .svg-textarea[readonly] {
          background: var(--bg-secondary);
          cursor: default;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Consolas', monospace;
        }

        .stat-reduction .stat-value {
          color: #22c55e;
        }

        .error-message {
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 13px;
        }
      `}</style>
    </ToolLayout>
  )
}
