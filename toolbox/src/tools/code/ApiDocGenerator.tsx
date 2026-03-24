// src/tools/code/ApiDocGenerator.tsx
import { useState, useEffect } from 'react'
import { Copy, Download, FileText, FileCode, AlertCircle, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type OutputFormat = 'markdown' | 'openapi' | 'html'
type TemplateStyle = 'basic' | 'detailed'

// JSON Schema types
interface SchemaProperty {
  name: string
  type: string
  required: boolean
  description?: string
  enum?: string[]
  default?: unknown
  format?: string
  items?: SchemaProperty[]
  properties?: SchemaProperty[]
}

interface ParsedSchema {
  name: string
  properties: SchemaProperty[]
  requiredFields: Set<string>
}

// Parse JSON Schema or sample JSON into structured format
function parseJsonInput(input: string): { schema: ParsedSchema | null; error: string } {
  try {
    const json = JSON.parse(input)
    
    // Check if it's a JSON Schema (has $schema or type)
    if (json.$schema || (json.type === 'object' && json.properties)) {
      return parseJsonSchema(json, 'Schema')
    }
    
    // Treat as sample JSON data
    return parseSampleJson(json, 'Data')
  } catch (e: any) {
    return { schema: null, error: `JSON 解析错误: ${e.message}` }
  }
}

function parseJsonSchema(schema: any, name: string): { schema: ParsedSchema | null; error: string } {
  const properties: SchemaProperty[] = []
  const requiredFields = new Set<string>(schema.required || [])
  
  const parseProperty = (propName: string, prop: any, required: boolean): SchemaProperty => {
    const property: SchemaProperty = {
      name: propName,
      type: mapJsonSchemaType(prop.type),
      required: required,
      description: prop.description || prop.title,
      format: prop.format,
    }
    
    if (prop.enum) {
      property.enum = prop.enum
    }
    if (prop.default !== undefined) {
      property.default = prop.default
    }
    
    // Handle array items
    if (prop.type === 'array' && prop.items) {
      if (prop.items.properties) {
        property.items = Object.entries(prop.items.properties).map(([key, val]: [string, any]) =>
          parseProperty(key, val, (prop.items.required || []).includes(key))
        )
      } else if (prop.items.$ref) {
        property.type = `${mapJsonSchemaType(prop.items.type)}[]`
      } else {
        property.type = `${mapJsonSchemaType(prop.items.type)}[]`
      }
    }
    
    // Handle nested object properties
    if (prop.type === 'object' && prop.properties) {
      property.properties = Object.entries(prop.properties).map(([key, val]: [string, any]) =>
        parseProperty(key, val, (prop.required || []).includes(key))
      )
    }
    
    return property
  }
  
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      properties.push(parseProperty(key, value as any, requiredFields.has(key)))
    }
  }
  
  return {
    schema: { name, properties, requiredFields },
    error: '',
  }
}

function parseSampleJson(data: any, name: string): { schema: ParsedSchema | null; error: string } {
  if (Array.isArray(data) && data.length > 0) {
    // Parse first item of array
    return parseSampleJson(data[0], name)
  }
  
  if (typeof data !== 'object' || data === null) {
    return { schema: null, error: '输入必须是对象或数组' }
  }
  
  const properties: SchemaProperty[] = []
  const requiredFields = new Set(Object.keys(data))
  
  const inferType = (value: unknown): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }
  
  const parseValue = (key: string, value: unknown, required: boolean): SchemaProperty => {
    const type = inferType(value)
    const property: SchemaProperty = {
      name: key,
      type: mapJsonSchemaType(type),
      required,
    }
    
    if (Array.isArray(value) && value.length > 0) {
      const itemType = inferType(value[0])
      property.type = `${mapJsonSchemaType(itemType)}[]`
      
      if (typeof value[0] === 'object' && value[0] !== null) {
        property.items = Object.keys(value[0]).map(k =>
          parseValue(k, (value[0] as any)[k], false)
        )
      }
    } else if (typeof value === 'object' && value !== null) {
      property.properties = Object.keys(value).map(k =>
        parseValue(k, (value as any)[k], false)
      )
    }
    
    return property
  }
  
  for (const [key, value] of Object.entries(data)) {
    properties.push(parseValue(key, value, requiredFields.has(key)))
  }
  
  return {
    schema: { name, properties, requiredFields },
    error: '',
  }
}

function mapJsonSchemaType(type: string | undefined): string {
  if (!type) return 'any'
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
    null: 'null',
  }
  return typeMap[type] || type
}

// Generate Markdown documentation
function generateMarkdown(schema: ParsedSchema, template: TemplateStyle, includeExamples: boolean): string {
  const sections: string[] = []
  
  sections.push(`# ${schema.name}\n`)
  
  if (template === 'detailed') {
    sections.push(`> Generated on ${new Date().toISOString().split('T')[0]}\n`)
  }
  
  // Properties table
  sections.push(`## 属性列表\n`)
  sections.push(`| 字段 | 类型 | 必填 | 描述 |`)
  sections.push(`|------|------|------|------|`)
  
  for (const prop of schema.properties) {
    const typeStr = formatPropertyType(prop)
    const desc = prop.description || (template === 'detailed' ? '-' : '')
    sections.push(`| ${prop.name} | ${typeStr} | ${prop.required ? '是' : '否'} | ${desc} |`)
  }
  
  sections.push('')
  
  // Enum values
  const enumProps = schema.properties.filter(p => p.enum)
  if (enumProps.length > 0 && template === 'detailed') {
    sections.push(`## 枚举值\n`)
    for (const prop of enumProps) {
      sections.push(`### ${prop.name}`)
      sections.push(`可选值: \`${prop.enum!.join('`, `')}\`\n`)
    }
  }
  
  // Nested objects
  const nestedProps = schema.properties.filter(p => p.properties)
  if (nestedProps.length > 0) {
    sections.push(`## 嵌套对象\n`)
    for (const prop of nestedProps) {
      sections.push(`### ${prop.name}\n`)
      sections.push(`| 字段 | 类型 | 必填 | 描述 |`)
      sections.push(`|------|------|------|------|`)
      for (const nested of prop.properties!) {
        const typeStr = formatPropertyType(nested)
        const desc = nested.description || ''
        sections.push(`| ${nested.name} | ${typeStr} | ${nested.required ? '是' : '否'} | ${desc} |`)
      }
      sections.push('')
    }
  }
  
  // Example
  if (includeExamples && template === 'detailed') {
    sections.push(`## 示例\n`)
    sections.push('```json')
    sections.push(JSON.stringify(generateExample(schema), null, 2))
    sections.push('```\n')
  }
  
  return sections.join('\n')
}

function formatPropertyType(prop: SchemaProperty): string {
  let type = prop.type
  if (prop.format) {
    type += ` (${prop.format})`
  }
  if (prop.enum) {
    type = prop.enum.map(e => `'${e}'`).join(' | ')
  }
  return type
}

function generateExample(schema: ParsedSchema): Record<string, unknown> {
  const example: Record<string, unknown> = {}
  
  for (const prop of schema.properties) {
    example[prop.name] = generateExampleValue(prop)
  }
  
  return example
}

function generateExampleValue(prop: SchemaProperty): unknown {
  if (prop.enum) {
    return prop.enum[0]
  }
  if (prop.default !== undefined) {
    return prop.default
  }
  
  const typeMap: Record<string, () => unknown> = {
    string: () => 'example',
    integer: () => 1,
    number: () => 1.0,
    boolean: () => true,
    array: () => prop.items ? [generateExampleValue(prop.items[0])] : [],
    object: () => {
      const obj: Record<string, unknown> = {}
      if (prop.properties) {
        for (const p of prop.properties) {
          obj[p.name] = generateExampleValue(p)
        }
      }
      return obj
    },
  }
  
  return typeMap[prop.type]?.() ?? null
}

// Generate OpenAPI 3.0 specification
function generateOpenApi(schema: ParsedSchema, template: TemplateStyle, includeExamples: boolean): string {
  const components: Record<string, any> = {
    schemas: {}
  }
  
  const schemaName = schema.name.replace(/\s+/g, '')
  
  const openApiSchema: Record<string, any> = {
    type: 'object',
    properties: {},
    required: [],
  }
  
  for (const prop of schema.properties) {
    openApiSchema.properties[prop.name] = buildOpenApiProperty(prop, includeExamples)
    if (prop.required) {
      openApiSchema.required.push(prop.name)
    }
  }
  
  components.schemas[schemaName] = openApiSchema
  
  const spec: Record<string, any> = {
    openapi: '3.0.0',
    info: {
      title: schema.name,
      version: '1.0.0',
      description: template === 'detailed' ? `${schema.name} API 文档` : undefined,
    },
    paths: template === 'detailed' ? {
      [`/${schema.name.toLowerCase().replace(/\s+/g, '-')}`]: {
        get: {
          summary: `获取${schema.name}列表`,
          tags: [schema.name],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: `#/components/schemas/${schemaName}` }
                      },
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } : {},
    components,
  }
  
  return JSON.stringify(spec, null, 2)
}

function buildOpenApiProperty(prop: SchemaProperty, includeExamples: boolean): Record<string, any> {
  const result: Record<string, any> = {}
  
  // Map types
  if (prop.type === 'array') {
    result.type = 'array'
    if (prop.items) {
      result.items = buildOpenApiProperty(prop.items[0], includeExamples)
    } else {
      result.items = { type: 'string' }
    }
  } else if (prop.type === 'object' && prop.properties) {
    result.type = 'object'
    result.properties = {}
    result.required = []
    for (const p of prop.properties) {
      result.properties[p.name] = buildOpenApiProperty(p, includeExamples)
      if (p.required) {
        result.required.push(p.name)
      }
    }
  } else {
    const typeMap: Record<string, string> = {
      string: 'string',
      integer: 'integer',
      number: 'number',
      boolean: 'boolean',
      null: 'null',
    }
    result.type = typeMap[prop.type] || 'string'
  }
  
  if (prop.format) {
    result.format = prop.format
  }
  if (prop.description) {
    result.description = prop.description
  }
  if (prop.enum) {
    delete result.type
    result.enum = prop.enum
  }
  if (prop.default !== undefined) {
    result.default = prop.default
  }
  
  if (includeExamples) {
    result.example = generateExampleValue(prop)
  }
  
  return result
}

// Generate HTML documentation
function generateHtml(schema: ParsedSchema, template: TemplateStyle, includeExamples: boolean): string {
  // Simple HTML template with styling
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schema.name} - API 文档</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a2e;
      border-bottom: 3px solid #4361ee;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      color: #1a1a2e;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-left: 0.5rem;
      border-left: 4px solid #4361ee;
    }
    h3 {
      color: #4361ee;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      background: white;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border: 1px solid #e0e0e0;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #1a1a2e;
    }
    tr:hover {
      background: #f8f9fa;
    }
    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
      color: #e63946;
    }
    pre {
      background: #1a1a2e;
      color: #eee;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .badge-required {
      background: #fee2e2;
      color: #dc2626;
    }
    .badge-optional {
      background: #e0e7ff;
      color: #4f46e5;
    }
    .type-tag {
      display: inline-block;
      padding: 0.15rem 0.4rem;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.85em;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .enum-values {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    .enum-value {
      background: #fef3c7;
      color: #92400e;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85em;
    }
    footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${schema.name}</h1>
    ${template === 'detailed' ? `<p class="meta">生成时间: ${new Date().toLocaleString('zh-CN')}</p>` : ''}
    
    <h2>属性列表</h2>
    <table>
      <thead>
        <tr>
          <th>字段</th>
          <th>类型</th>
          <th>必填</th>
          <th>描述</th>
        </tr>
      </thead>
      <tbody>
        ${schema.properties.map(prop => `
          <tr>
            <td><code>${prop.name}</code></td>
            <td><span class="type-tag">${formatPropertyType(prop)}</span></td>
            <td><span class="badge ${prop.required ? 'badge-required' : 'badge-optional'}">${prop.required ? '是' : '否'}</span></td>
            <td>${prop.description || '-'}</td>
          </tr>
          ${prop.enum ? `
          <tr>
            <td colspan="4">
              <strong>可选值:</strong>
              <div class="enum-values">
                ${prop.enum.map(v => `<span class="enum-value">'${v}'</span>`).join('')}
              </div>
            </td>
          </tr>
          ` : ''}
        `).join('')}
      </tbody>
    </table>
    
    ${schema.properties.some(p => p.properties) ? `
    <h2>嵌套对象</h2>
    ${schema.properties.filter(p => p.properties).map(prop => `
      <h3>${prop.name}</h3>
      <table>
        <thead>
          <tr>
            <th>字段</th>
            <th>类型</th>
            <th>必填</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          ${prop.properties!.map(nested => `
            <tr>
              <td><code>${nested.name}</code></td>
              <td><span class="type-tag">${formatPropertyType(nested)}</span></td>
              <td><span class="badge ${nested.required ? 'badge-required' : 'badge-optional'}">${nested.required ? '是' : '否'}</span></td>
              <td>${nested.description || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `).join('')}
    ` : ''}
    
    ${includeExamples && template === 'detailed' ? `
    <h2>示例</h2>
    <pre><code>${JSON.stringify(generateExample(schema), null, 2)}</code></pre>
    ` : ''}
    
    <footer>
      Generated by API Documentation Generator
    </footer>
  </div>
</body>
</html>`
}

export default function ApiDocGenerator() {
  const [input, setInput] = useState('')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown')
  const [template, setTemplate] = useState<TemplateStyle>('basic')
  const [includeExamples, setIncludeExamples] = useState(true)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Generate documentation when inputs change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }
    
    const { schema, error: parseError } = parseJsonInput(input)
    
    if (parseError) {
      setError(parseError)
      setOutput('')
      return
    }
    
    if (!schema) {
      setError('无法解析输入数据')
      setOutput('')
      return
    }
    
    setError('')
    
    switch (outputFormat) {
      case 'markdown':
        setOutput(generateMarkdown(schema, template, includeExamples))
        break
      case 'openapi':
        setOutput(generateOpenApi(schema, template, includeExamples))
        break
      case 'html':
        setOutput(generateHtml(schema, template, includeExamples))
        break
    }
  }, [input, outputFormat, template, includeExamples])
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleDownload = () => {
    const extensions: Record<OutputFormat, string> = {
      markdown: 'md',
      openapi: 'json',
      html: 'html',
    }
    
    const mimeTypes: Record<OutputFormat, string> = {
      markdown: 'text/markdown',
      openapi: 'application/json',
      html: 'text/html',
    }
    
    const blob = new Blob([output], { type: mimeTypes[outputFormat] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-doc.${extensions[outputFormat]}`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }
  
  const sampleJson = `{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 28,
  "isActive": true,
  "role": "admin",
  "tags": ["developer", "frontend"],
  "address": {
    "city": "北京",
    "district": "朝阳区"
  }
}`

  return (
    <ToolLayout 
      title="API 文档生成器" 
      description="根据 JSON Schema 或示例 JSON 生成 Markdown / OpenAPI / HTML 格式的 API 文档"
    >
      {/* Sample Data Button */}
      <button 
        className="btn btn-outline" 
        style={{ marginBottom: 12 }}
        onClick={() => setInput(sampleJson)}
      >
        <FileText size={14} />
        加载示例数据
      </button>
      
      {/* Format Selection */}
      <div className="btn-group">
        <button 
          className={`btn ${outputFormat === 'markdown' ? '' : 'btn-outline'}`}
          onClick={() => setOutputFormat('markdown')}
        >
          <FileText size={14} /> Markdown
        </button>
        <button 
          className={`btn ${outputFormat === 'openapi' ? '' : 'btn-outline'}`}
          onClick={() => setOutputFormat('openapi')}
        >
          <FileCode size={14} /> OpenAPI 3.0
        </button>
        <button 
          className={`btn ${outputFormat === 'html' ? '' : 'btn-outline'}`}
          onClick={() => setOutputFormat('html')}
        >
          <FileText size={14} /> HTML
        </button>
      </div>
      
      {/* Input Area */}
      <label className="tool-label">输入 JSON Schema 或示例数据</label>
      <textarea
        className="textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="粘贴 JSON Schema 或示例 JSON 数据..."
        style={{ minHeight: 200, fontFamily: 'monospace' }}
      />
      
      {error && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: 13, 
          margin: '8px 0',
          padding: '8px 12px',
          background: '#fef2f2',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      
      {/* Options */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginTop: 16,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tool-label" style={{ margin: 0 }}>模板:</span>
          <select 
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateStyle)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <option value="basic">简洁</option>
            <option value="detailed">详细</option>
          </select>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={includeExamples}
            onChange={(e) => setIncludeExamples(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span className="tool-label" style={{ margin: 0 }}>包含示例</span>
        </label>
        
        <button 
          className="btn btn-outline" 
          style={{ marginLeft: 'auto', padding: '6px 12px' }}
          onClick={handleClear}
        >
          清空
        </button>
      </div>
      
      {/* Output Actions */}
      {output && (
        <div className="tool-output-label" style={{ marginTop: 16 }}>
          <span className="tool-label" style={{ color: '#10b981' }}>
            ✓ 生成结果 ({outputFormat.toUpperCase()})
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={handleCopy}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={handleDownload}
            >
              <Download size={12} /> 下载
            </button>
          </div>
        </div>
      )}
      
      {/* Preview */}
      {output && (
        <div 
          className="tool-output" 
          style={{ 
            maxHeight: 500, 
            overflow: 'auto',
            marginTop: 12,
            padding: outputFormat === 'html' ? 0 : undefined,
          }}
        >
          {outputFormat === 'html' ? (
            <iframe
              srcDoc={output}
              style={{
                width: '100%',
                minHeight: 400,
                border: 'none',
                borderRadius: 6,
              }}
              title="HTML Preview"
            />
          ) : (
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap',
              fontFamily: outputFormat === 'openapi' ? 'monospace' : undefined,
            }}>
              {output}
            </pre>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
