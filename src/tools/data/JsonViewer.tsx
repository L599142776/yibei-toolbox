// src/tools/data/JsonViewer.tsx
import { useState, useCallback, useMemo } from 'react'
import { Copy, ChevronRight, ChevronDown, Search, Minimize2, AlignLeft, ChevronUp } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// ─── Types ───────────────────────────────────────────────────────────────────
interface JsonNode {
  key: string
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  path: string
  depth: number
  children?: JsonNode[]
  index?: number
}

interface JsonStats {
  totalKeys: number
  totalValues: number
  maxDepth: number
  arrayCount: number
  objectCount: number
}

// ─── Color Scheme ─────────────────────────────────────────────────────────────
const COLORS: Record<string | 'object' | 'array', string> = {
  key: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#808080',
  bracket: '#808080',
  highlight: '#f59e0b',
  object: '#9cdcfe',
  array: '#9cdcfe',
}

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getType(value: unknown): JsonNode['type'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as JsonNode['type']
}

function buildTree(data: unknown, key = 'root', path = 'root', depth = 0): JsonNode {
  const type = getType(data)
  const node: JsonNode = { key, value: data, type, path, depth }

  if (type === 'object' && data !== null) {
    node.children = Object.entries(data as Record<string, unknown>).map(([k, v]) =>
      buildTree(v, k, path === 'root' ? k : `${path}.${k}`, depth + 1)
    )
  } else if (type === 'array') {
    node.children = (data as unknown[]).map((item, i) => {
      const childPath = `${path}[${i}]`
      return { ...buildTree(item, `[${i}]`, childPath, depth + 1), index: i }
    })
  }

  return node
}

function calculateStats(node: JsonNode): JsonStats {
  let totalKeys = 0
  let totalValues = 0
  let maxDepth = node.depth
  let arrayCount = 0
  let objectCount = 0

  function traverse(n: JsonNode) {
    if (n.type === 'object') {
      totalKeys += n.children?.length ?? 0
      totalValues += n.children?.length ?? 0
      objectCount++
    } else if (n.type === 'array') {
      totalValues += n.children?.length ?? 0
      arrayCount++
    } else {
      totalValues++
    }

    maxDepth = Math.max(maxDepth, n.depth)

    n.children?.forEach(traverse)
  }

  traverse(node)
  return { totalKeys, totalValues, maxDepth, arrayCount, objectCount }
}

function getValueString(value: unknown, type: JsonNode['type']): string {
  switch (type) {
    case 'string': return `"${value}"`
    case 'null': return 'null'
    case 'boolean': return String(value)
    case 'number': return String(value)
    default: return ''
  }
}

// ─── Tree Node Component ─────────────────────────────────────────────────────
interface TreeNodeProps {
  node: JsonNode
  expandedPaths: Set<string>
  onToggle: (path: string) => void
  selectedPath: string | null
  onSelect: (path: string, value: unknown) => void
  searchTerm: string
  onCopyPath: (path: string) => void
  onCopyValue: (value: unknown) => void
}

function TreeNode({
  node,
  expandedPaths,
  onToggle,
  selectedPath,
  onSelect,
  searchTerm,
  onCopyPath,
  onCopyValue,
}: TreeNodeProps) {
  const isExpanded = expandedPaths.has(node.path)
  const isSelectable = node.type !== 'object' && node.type !== 'array'
  const isSelected = selectedPath === node.path

  const highlightText = (text: string) => {
    if (!searchTerm) return text
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} style={{ background: COLORS.highlight, color: '#000', borderRadius: 2 }}>
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleClick = () => {
    if (node.type === 'object' || node.type === 'array') {
      onToggle(node.path)
    } else {
      onSelect(node.path, node.value)
    }
  }

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyPath(node.path)
  }

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyValue(node.value)
  }

  const renderValue = () => {
    const valueStr = getValueString(node.value, node.type)
    const color = COLORS[node.type]

    return (
      <>
        <span style={{ color }}>{highlightText(valueStr)}</span>
        <span style={{ color: COLORS.bracket }}>
          {node.type === 'string' && (
            <span
              className="json-viewer-action"
              onClick={handleCopyValue}
              title="Copy value"
            >
              <Copy size={10} />
            </span>
          )}
        </span>
      </>
    )
  }

  const renderMeta = () => {
    if (node.type === 'array') {
      const count = node.children?.length ?? 0
      return (
        <span className="json-viewer-meta">
          [{count} {count === 1 ? 'item' : 'items'}]
        </span>
      )
    }
    if (node.type === 'object') {
      const count = node.children?.length ?? 0
      return (
        <span className="json-viewer-meta">
          {'{'}{count} {count === 1 ? 'key' : 'keys}'}
        </span>
      )
    }
    return (
      <span className="json-viewer-type-badge" data-type={node.type}>
        {node.type}
      </span>
    )
  }

  return (
    <div className="json-viewer-node">
      <div
        className={`json-viewer-row ${isSelected ? 'selected' : ''} ${isSelectable ? 'selectable' : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: node.depth * 16 + 8 }}
      >
        {/* Expand/Collapse Icon */}
        <span className="json-viewer-toggle">
          {(node.type === 'object' || node.type === 'array') ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="json-viewer-dot" />
          )}
        </span>

        {/* Indent Guides */}
        {Array.from({ length: node.depth }).map((_, i) => (
          <span key={i} className="json-viewer-guide" style={{ left: i * 16 + 8 }} />
        ))}

        {/* Key */}
        <span className="json-viewer-key">{highlightText(node.key)}</span>

        {/* Colon */}
        <span className="json-viewer-colon">:</span>

        {/* Value or Bracket Info */}
        {node.type === 'object' || node.type === 'array' ? (
          <>
            <span className="json-viewer-bracket">
              {node.type === 'array' ? '[' : '{'}
            </span>
            {renderMeta()}
            <span className="json-viewer-bracket">
              {node.type === 'array' ? ']' : '}'}
            </span>
          </>
        ) : (
          renderValue()
        )}

        {/* Actions */}
        <span className="json-viewer-actions">
          <span
            className="json-viewer-action"
            onClick={handleCopyPath}
            title="Copy path"
          >
            <Copy size={10} />
          </span>
        </span>
      </div>

      {/* Children */}
      {isExpanded && node.children && (
        <div className="json-viewer-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelect={onSelect}
              searchTerm={searchTerm}
              onCopyPath={onCopyPath}
              onCopyValue={onCopyValue}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JsonViewer() {
  const [input, setInput] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState<unknown>(null)
  const [copiedPath, setCopiedPath] = useState(false)

  // Parse JSON using useMemo to avoid cascading renders
  const { parsedData, tree, error, stats } = useMemo(() => {
    if (!input.trim()) {
      return { parsedData: null, tree: null, error: '', stats: null }
    }

    try {
      const parsed = JSON.parse(input)
      const treeNode = buildTree(parsed)
      return { parsedData: parsed, tree: treeNode, error: '', stats: calculateStats(treeNode) }
    } catch (e) {
      return { parsedData: null, tree: null, error: (e as Error).message, stats: null }
    }
  }, [input])

  // Expand all / Collapse all
  const expandAll = useCallback(() => {
    if (!tree) return
    const paths = new Set<string>()
    const collectPaths = (node: JsonNode) => {
      if (node.type === 'object' || node.type === 'array') {
        paths.add(node.path)
        node.children?.forEach(collectPaths)
      }
    }
    collectPaths(tree)
    setExpandedPaths(paths)
  }, [tree])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['root']))
  }, [])

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback((path: string, value: unknown) => {
    setSelectedPath(path)
    setSelectedValue(value)
  }, [])

  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 1500)
  }, [])

  const handleCopyValue = useCallback((value: unknown) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    navigator.clipboard.writeText(str)
  }, [])

  const handleFormat = useCallback(() => {
    if (parsedData) {
      setInput(JSON.stringify(parsedData, null, 2))
    }
  }, [parsedData])

  const handleMinify = useCallback(() => {
    if (parsedData) {
      setInput(JSON.stringify(parsedData))
    }
  }, [parsedData])

  const handleSampleData = useCallback(() => {
    const sample = {
      name: "艺北工具箱",
      version: "1.0.0",
      features: ["JSON查看器", "格式化", "搜索"],
      stats: {
        users: 12345,
        active: true,
        rating: 4.8
      },
      tags: ["工具", "在线", "免费"],
      items: [
        { id: 1, name: "工具1" },
        { id: 2, name: "工具2" },
        { id: 3, name: "工具3" }
      ],
      metadata: null
    }
    setInput(JSON.stringify(sample, null, 2))
  }, [])

  // Auto-expand to show search matches
  const highlightedPaths = useMemo(() => {
    if (!tree || !searchTerm) return new Set<string>()
    const paths = new Set<string>()

    const search = (node: JsonNode) => {
      const keyMatch = node.key.toLowerCase().includes(searchTerm.toLowerCase())
      const valueMatch =
        node.type === 'string' && String(node.value).toLowerCase().includes(searchTerm.toLowerCase())

      if (keyMatch || valueMatch) {
        let path = node.path
        while (path !== 'root') {
          const parts = path.split(/[.[\]]/)
          parts.pop()
          const parent = parts.join('.').replace(/\.\[/g, '[') || 'root'
          paths.add(parent)
          path = parent
        }
      }

      node.children?.forEach(search)
    }

    search(tree)
    return paths
  }, [tree, searchTerm])

  // Derive expanded paths including search highlights
  const effectiveExpandedPaths = useMemo(() => {
    if (!searchTerm || highlightedPaths.size === 0) return expandedPaths
    return new Set([...expandedPaths, ...highlightedPaths])
  }, [expandedPaths, highlightedPaths, searchTerm])

  return (
    <ToolLayout title="JSON 查看器" description="可视化树形结构查看 JSON 数据，支持搜索和复制">
      {/* Toolbar */}
      <div className="json-viewer-toolbar">
        <div className="btn-group">
          <button className="btn btn-outline" onClick={handleFormat}>
            <AlignLeft size={14} /> 格式化
          </button>
          <button className="btn btn-outline" onClick={handleMinify}>
            <Minimize2 size={14} /> 压缩
          </button>
          <button className="btn btn-outline" onClick={expandAll}>
            <ChevronDown size={14} /> 展开全部
          </button>
          <button className="btn btn-outline" onClick={collapseAll}>
            <ChevronUp size={14} /> 折叠全部
          </button>
          <button className="btn btn-outline" onClick={handleSampleData}>
            示例数据
          </button>
        </div>

        {/* Search */}
        <div className="json-viewer-search">
          <Search size={14} />
          <input
            type="text"
            className="input"
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          {searchTerm && (
            <button className="json-viewer-search-clear" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="json-viewer-stats">
            <span className="json-viewer-stat">
              <strong>{stats.totalKeys}</strong> keys
            </span>
            <span className="json-viewer-stat">
              <strong>{stats.totalValues}</strong> values
            </span>
            <span className="json-viewer-stat">
              <strong>{stats.maxDepth}</strong> depth
            </span>
            <span className="json-viewer-stat">
              <strong>{stats.arrayCount}</strong> arrays
            </span>
            <span className="json-viewer-stat">
              <strong>{stats.objectCount}</strong> objects
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="json-viewer-main">
        {/* Input Panel */}
        <div className="json-viewer-panel">
          <div className="tool-label">JSON 输入</div>
          <textarea
            className="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='粘贴 JSON 数据...&#10;例如: {"name": "test"}'
            style={{ minHeight: 300, fontFamily: "'SF Mono', 'Cascadia Code', monospace" }}
          />
          {error && (
            <div className="json-viewer-error">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Tree Panel */}
        <div className="json-viewer-panel json-viewer-tree-panel">
          <div className="tool-label">树形视图</div>
          <div className="json-viewer-tree">
            {tree ? (
              <TreeNode
                node={tree}
                expandedPaths={effectiveExpandedPaths}
                onToggle={handleToggle}
                selectedPath={selectedPath}
                onSelect={handleSelect}
                searchTerm={searchTerm}
                onCopyPath={handleCopyPath}
                onCopyValue={handleCopyValue}
              />
            ) : (
              <div className="json-viewer-empty">
                {input.trim() ? 'JSON 解析错误' : '请在左侧输入 JSON 数据'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedPath && (
        <div className="json-viewer-selected-info">
          <div className="json-viewer-selected-path">
            <span className="tool-label">路径:</span>
            <code className="json-viewer-path-code">{selectedPath}</code>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => handleCopyPath(selectedPath)}
            >
              <Copy size={12} /> {copiedPath ? '已复制!' : '复制路径'}
            </button>
          </div>
          <div className="json-viewer-selected-value">
            <span className="tool-label">值:</span>
            <code className="json-viewer-value-code">
              {typeof selectedValue === 'string' ? `"${selectedValue}"` : String(selectedValue)}
            </code>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => handleCopyValue(selectedValue)}
            >
              <Copy size={12} /> 复制值
            </button>
          </div>
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        .json-viewer-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .json-viewer-search {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-dim);
        }

        .json-viewer-search .input {
          margin: 0;
        }

        .json-viewer-search-clear {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .json-viewer-search-clear:hover {
          background: var(--bg-hover);
          color: var(--text);
        }

        .json-viewer-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .json-viewer-stat {
          font-size: 13px;
          color: var(--text-dim);
        }

        .json-viewer-stat strong {
          color: var(--accent);
          font-weight: 600;
        }

        .json-viewer-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        @media (max-width: 900px) {
          .json-viewer-main {
            grid-template-columns: 1fr;
          }
        }

        .json-viewer-panel {
          display: flex;
          flex-direction: column;
        }

        .json-viewer-tree-panel {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 12px;
          max-height: 500px;
          overflow: auto;
        }

        .json-viewer-tree {
          flex: 1;
          overflow: auto;
        }

        .json-viewer-tree .tool-label {
          margin-bottom: 12px;
        }

        .json-viewer-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-dim);
          font-size: 14px;
        }

        .json-viewer-node {
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.8;
        }

        .json-viewer-row {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 4px;
          position: relative;
          white-space: nowrap;
          cursor: default;
          transition: background 0.15s;
        }

        .json-viewer-row.selectable {
          cursor: pointer;
        }

        .json-viewer-row.selectable:hover {
          background: var(--bg-hover);
        }

        .json-viewer-row.selected {
          background: rgba(var(--accent-rgb), 0.15);
        }

        .json-viewer-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          color: var(--text-dim);
          flex-shrink: 0;
        }

        .json-viewer-dot {
          width: 4px;
          height: 4px;
          background: var(--text-dim);
          border-radius: 50%;
        }

        .json-viewer-guide {
          position: absolute;
          top: 0;
          width: 1px;
          height: 100%;
          background: var(--border);
          pointer-events: none;
        }

        .json-viewer-key {
          color: ${COLORS.key};
          font-weight: 500;
        }

        .json-viewer-colon {
          color: var(--text-dim);
          margin-right: 4px;
        }

        .json-viewer-bracket {
          color: ${COLORS.bracket};
        }

        .json-viewer-meta {
          color: var(--text-muted);
          font-size: 11px;
          margin: 0 4px;
        }

        .json-viewer-type-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--bg-hover);
          color: var(--text-dim);
          text-transform: uppercase;
          margin-left: 6px;
        }

        .json-viewer-type-badge[data-type="string"] {
          color: ${COLORS.string};
          background: rgba(206, 145, 120, 0.15);
        }

        .json-viewer-type-badge[data-type="number"] {
          color: ${COLORS.number};
          background: rgba(181, 206, 168, 0.15);
        }

        .json-viewer-type-badge[data-type="boolean"] {
          color: ${COLORS.boolean};
          background: rgba(86, 156, 214, 0.15);
        }

        .json-viewer-type-badge[data-type="null"] {
          color: ${COLORS.null};
          background: rgba(128, 128, 128, 0.15);
        }

        .json-viewer-actions {
          display: flex;
          gap: 4px;
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .json-viewer-row:hover .json-viewer-actions {
          opacity: 1;
        }

        .json-viewer-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.15s;
        }

        .json-viewer-action:hover {
          background: var(--bg-hover);
          color: var(--accent);
        }

        .json-viewer-children {
          margin-left: 0;
        }

        .json-viewer-error {
          color: #ef4444;
          font-size: 13px;
          margin-top: 8px;
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-sm);
        }

        .json-viewer-selected-info {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .json-viewer-selected-path,
        .json-viewer-selected-value {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .json-viewer-path-code,
        .json-viewer-value-code {
          background: var(--bg-card);
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'SF Mono', 'Cascadia Code', monospace;
          font-size: 13px;
          color: var(--accent);
          flex: 1;
          word-break: break-all;
        }

        .json-viewer-value-code {
          color: var(--text);
        }

        .json-viewer-selected-info .tool-label {
          margin: 0;
          white-space: nowrap;
        }
      `}</style>
    </ToolLayout>
  )
}
