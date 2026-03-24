// src/tools/data/XmlJsonConverter.tsx
import { useState, useCallback } from 'react'
import { Copy, ArrowLeftRight, Trash2, Wand2 } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type Mode = 'xml2json' | 'json2xml' | 'auto'

// ============================================================
// XML → JSON 转换 (使用 DOMParser)
// ============================================================
function xmlToJson(node: Element | Document): any {
  if (!node) return null

  // 文本节点
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim() ?? ''
    return text || null
  }

  // 元素节点
  if (node.nodeType === Node.ELEMENT_NODE) {
    const elem = node as Element
    const obj: any = {}

    // 处理属性
    if (elem.attributes.length > 0) {
      obj._attributes = {}
      for (let i = 0; i < elem.attributes.length; i++) {
        const attr = elem.attributes[i]
        obj._attributes[attr.name] = attr.value
      }
    }

    // 处理子节点
    const children = Array.from(elem.childNodes).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
    )

    if (children.length === 0) {
      // 无子节点，返回文本内容
      const text = elem.textContent?.trim() ?? ''
      if (elem.attributes.length === 0) {
        return text || null
      }
      return text || null
    }

    // 按标签名分组
    const groups: Record<string, any[]> = {}
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childElem = child as Element
        const tagName = childElem.tagName
        if (!groups[tagName]) groups[tagName] = []
        groups[tagName].push(xmlToJson(childElem))
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim() ?? ''
        if (text) {
          // 混合内容
          const parentTag = elem.tagName
          if (!groups[parentTag]) groups[parentTag] = []
          groups[parentTag].push(text)
        }
      }
    }

    // 构建结果
    for (const [tagName, values] of Object.entries(groups)) {
      if (tagName === elem.tagName && values.length === 1 && typeof values[0] === 'string') {
        // 纯文本内容
        obj._text = values[0]
      } else if (values.length === 1) {
        obj[tagName] = values[0]
      } else {
        obj[tagName] = values
      }
    }

    return obj
  }

  return null
}

function parseXml(xmlString: string): any {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  
  // 检查解析错误
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    const errorText = parseError.textContent ?? 'XML 解析错误'
    throw new Error(errorText.split('\n')[0] || 'XML 解析错误')
  }

  return xmlToJson(doc.documentElement)
}

// ============================================================
// JSON → XML 转换
// ============================================================
function jsonToXmlValue(value: any, _indent: number, _indentStr: string): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    // 检查是否需要转义
    if (value.includes('<') || value.includes('>') || value.includes('&') || value.includes('"') || value.includes("'") || value.includes('\n')) {
      return `<![CDATA[${value}]]>`
    }
    return value
  }
  return ''
}

function jsonToXml(obj: any, _indent = 0, indentStr = '  '): string {
  const pad = indentStr.repeat(_indent)

  if (obj === null || obj === undefined) return ''
  if (typeof obj !== 'object') return jsonToXmlValue(obj, _indent, indentStr)

  // 根对象处理
  const keys = Object.keys(obj)
  if (keys.length === 0) return ''

  const parts: string[] = []

  // 处理 _attributes (XML 属性)
  const attributes = obj._attributes
  const attrStr = attributes 
    ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ')
    : ''

  // 处理 _text (文本内容)
  const text = obj._text

  // 处理子元素
  const childKeys = keys.filter((k) => k !== '_attributes' && k !== '_text')

  if (childKeys.length === 0 && text !== undefined) {
    // 只有文本内容
    const textStr = jsonToXmlValue(text, _indent, indentStr)
    return textStr
  }

  if (childKeys.length === 1 && text === undefined) {
    // 单个子元素
    const key = childKeys[0]
    const value = obj[key]

    if (Array.isArray(value)) {
      // 数组
      return value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return `${pad}<${key}${attrStr}>\n${jsonToXml(item, _indent + 1, indentStr)}\n${pad}</${key}>`
        }
        return `${pad}<${key}${attrStr}>${jsonToXmlValue(item, _indent, indentStr)}</${key}>`
      }).join('\n')
    } else if (typeof value === 'object' && value !== null) {
      return `${pad}<${key}${attrStr}>\n${jsonToXml(value, _indent + 1, indentStr)}\n${pad}</${key}>`
    } else {
      const valueStr = jsonToXmlValue(value, _indent, indentStr)
      return `${pad}<${key}${attrStr}>${valueStr}</${key}>`
    }
  }

  // 多个子元素
  for (const key of childKeys) {
    const value = obj[key]

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          parts.push(`${pad}<${key}${attrStr}>\n${jsonToXml(item, _indent + 1, indentStr)}\n${pad}</${key}>`)
        } else {
          parts.push(`${pad}<${key}${attrStr}>${jsonToXmlValue(item, _indent, indentStr)}</${key}>`)
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      parts.push(`${pad}<${key}${attrStr}>\n${jsonToXml(value, _indent + 1, indentStr)}\n${pad}</${key}>`)
    } else {
      parts.push(`${pad}<${key}${attrStr}>${jsonToXmlValue(value, _indent, indentStr)}</${key}>`)
    }
  }

  return parts.join('\n')
}

// ============================================================
// 语法高亮
// ============================================================
function highlightJson(json: string): React.ReactNode {
  if (!json) return null
  
  const lines = json.split('\n')
  return lines.map((line, i) => {
    const highlighted = line
      .replace(/"([^"]+)":/g, '<span style="color:#9cdcfe">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span style="color:#ce9178">"$1"</span>')
      .replace(/: (true|false)/g, ': <span style="color:#569cd6">$1</span>')
      .replace(/: (null)/g, ': <span style="color:#569cd6">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:#b5cea8">$1</span>')
      .replace(/([{}\[\]])/g, '<span style="color:#ffd700">$1</span>')
    
    return (
      <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
    )
  })
}

function highlightXml(xml: string): React.ReactNode {
  if (!xml) return null
  
  const lines = xml.split('\n')
  return lines.map((line, i) => {
    const highlighted = line
      .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span style="color:#569cd6">$2</span>')
      .replace(/(&lt;)([\w:-]+)/g, '<span style="color:#4ec9b0">$1$2</span>')
      .replace(/(&lt;\/?)([\w:-]+)(&gt;)/g, '<span style="color:#4ec9b0">$1</span><span style="color:#569cd6">$2</span><span style="color:#4ec9b0">$3</span>')
      .replace(/(\s)([\w:-]+)(=)/g, '$1<span style="color:#9cdcfe">$2</span>$3')
      .replace(/(=)(")(.*?)(")/g, '$1<span style="color:#ce9178">$2$3$4</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/(&lt;!\[CDATA\[)([\s\S]*?)(\]\]&gt;)/g, '<span style="color:#dcdcaa">$1$2$3</span>')
    
    return (
      <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
    )
  })
}

// ============================================================
// 主组件
// ============================================================
export default function XmlJsonConverter() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('auto')
  const [error, setError] = useState('')
  const [formatted, setFormatted] = useState(true)
  const [output, setOutput] = useState('')
  const [outputType, setOutputType] = useState<'xml' | 'json'>('json')
  const [copied, setCopied] = useState(false)

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

    const trimmed = input.trim()

    // 自动检测模式
    let effectiveMode = mode
    if (mode === 'auto') {
      if (trimmed.startsWith('<')) {
        effectiveMode = 'xml2json'
      } else {
        effectiveMode = 'json2xml'
      }
    }

    try {
      if (effectiveMode === 'xml2json') {
        const json = parseXml(trimmed)
        const jsonStr = formatted 
          ? JSON.stringify(json, null, 2)
          : JSON.stringify(json)
        setOutput(jsonStr)
        setOutputType('json')
      } else {
        // JSON → XML
        const parsed = JSON.parse(trimmed)
        const indentStr = formatted ? '  ' : ''
        const xmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parsed, 0, indentStr)}`
        setOutput(xmlStr)
        setOutputType('xml')
      }
    } catch (e: any) {
      setError(e.message || '转换失败')
      setOutput('')
    }
  }, [input, mode, formatted])

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setError('')
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败')
    }
  }

  const handleSwap = () => {
    if (!output) return
    setInput(output)
    setMode(outputType === 'json' ? 'xml2json' : 'json2xml')
    setError('')
  }

  return (
    <ToolLayout title="XML ↔ JSON 转换器" description="XML 与 JSON 格式互转，支持属性、命名空间和 CDATA">
      {/* 模式选择 */}
      <div className="btn-group" style={{ marginBottom: 12 }}>
        <button className={`btn ${mode === 'auto' ? '' : 'btn-outline'}`} onClick={() => handleModeChange('auto')}>
          自动检测
        </button>
        <button className={`btn ${mode === 'xml2json' ? '' : 'btn-outline'}`} onClick={() => handleModeChange('xml2json')}>
          XML → JSON
        </button>
        <button className={`btn ${mode === 'json2xml' ? '' : 'btn-outline'}`} onClick={() => handleModeChange('json2xml')}>
          JSON → XML
        </button>
      </div>

      {/* 输入区域 */}
      <div style={{ marginBottom: 12 }}>
        <div className="tool-label">输入</div>
        <textarea
          className="textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'auto' ? '粘贴 XML 或 JSON...' : mode === 'xml2json' ? '粘贴 XML...' : '粘贴 JSON...'}
          style={{ 
            minHeight: 180,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 13,
          }}
        />
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={convert}>
          <Wand2 size={16} /> 转换
        </button>
        <button className="btn" onClick={handleSwap} disabled={!output} title="交换输入输出">
          <ArrowLeftRight size={16} /> 交换
        </button>
        <button className="btn btn-outline" onClick={handleClear}>
          <Trash2 size={16} /> 清空
        </button>
        <button className="btn btn-outline" onClick={() => setFormatted(!formatted)} style={{ marginLeft: 'auto' }}>
          {formatted ? '压缩' : '格式化'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: 13, 
          margin: '8px 0',
          padding: 8,
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 4,
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 输出区域 */}
      <div>
        <div className="tool-output-label" style={{ marginBottom: 8 }}>
          <span className="tool-label">输出 {outputType === 'json' ? '(JSON)' : '(XML)'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleCopy} disabled={!output}>
              <Copy size={12} /> {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <div
          className="tool-output"
          style={{
            background: outputType === 'json' ? '#1e1e1e' : '#2d2d2d',
            minHeight: 180,
            maxHeight: 400,
            overflow: 'auto',
            padding: 12,
            borderRadius: 6,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {outputType === 'json' ? highlightJson(output) : highlightXml(output.replace(/</g, '&lt;').replace(/>/g, '&gt;'))}
          {!output && <span style={{ color: '#666' }}>—</span>}
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        <p>💡 <strong>提示：</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>自动检测会根据输入内容判断格式</li>
          <li>XML 属性会以 <code>_attributes</code> 形式保存在 JSON 中</li>
          <li>XML 文本内容会以 <code>_text</code> 形式保存</li>
          <li>转换后可点击「交换」按钮将输出作为输入进行反向转换</li>
        </ul>
      </div>
    </ToolLayout>
  )
}
