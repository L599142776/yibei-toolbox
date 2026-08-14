import { useState } from 'react'
import { Copy, Sparkles } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

const EXAMPLE = `==> Preparing: UPDATE scloud_decryption_application SET state = ?, handler_id = ?, application_file_url = ? WHERE id = ?
==> Parameters: 2(String), 1(String), scloud/4452649c/49ab/4da0/8b8b/27e55d7697d1.json(String), 2087782488408637442(String)
<==    Updates: 1`

/** 解析 MyBatis 日志，返回多段 { sql, params, result } */
function parseMybatisLog(text: string): Array<{ sql: string; params: string[]; result?: string }> {
  const blocks: Array<{ sql: string; params: string[]; result?: string }> = []
  const lines = text.split('\n')

  let currentSql = ''
  let currentParams: string[] = []
  let currentResult = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // 匹配 Preparing 行
    const preparingMatch = trimmed.match(/(?:==>\s*)?Preparing:\s*(.+)/i)
    if (preparingMatch) {
      // 如果已有未完成的块，先保存
      if (currentSql) {
        blocks.push({ sql: currentSql, params: currentParams, result: currentResult || undefined })
      }
      currentSql = preparingMatch[1].trim()
      currentParams = []
      currentResult = ''
      continue
    }

    // 匹配 Parameters 行
    const paramsMatch = trimmed.match(/(?:==>\s*)?Parameters:\s*(.*)/i)
    if (paramsMatch) {
      currentParams = parseParameters(paramsMatch[1])
      continue
    }

    // 匹配 Updates / Update count 行
    const updatesMatch = trimmed.match(/(?:<==\s*)?(?:Updates?|Update count):\s*(\d+)/i)
    if (updatesMatch) {
      currentResult = `更新 ${updatesMatch[1]} 行`
      continue
    }

    // 匹配 Select 行（SELECT 查询结果）
    const selectMatch = trimmed.match(/(?:<==\s*)?(?:Total|Rows):\s*(\d+)/i)
    if (selectMatch) {
      currentResult = `返回 ${selectMatch[1]} 行`
    }
  }

  // 最后一个块
  if (currentSql) {
    blocks.push({ sql: currentSql, params: currentParams, result: currentResult || undefined })
  }

  return blocks
}

/** 解析参数字符串，处理含逗号的值 */
function parseParameters(paramsStr: string): string[] {
  if (!paramsStr.trim()) return []

  const params: string[] = []
  // 按 ", " 分割，但需要处理参数值本身含逗号的情况
  // MyBatis 参数格式：value(Type), value(Type), ...
  // 使用正则匹配：值 + 括号类型
  const regex = /([^,]+?)\((\w+(?:\([^)]*\))?)\)/g
  let match

  while ((match = regex.exec(paramsStr)) !== null) {
    params.push(match[1].trim())
  }

  // 如果正则没匹配到，尝试简单逗号分割（兼容非标准格式）
  if (params.length === 0 && paramsStr.trim()) {
    const parts = paramsStr.split(/,\s*(?=\S)/)
    for (const part of parts) {
      // 去掉类型标注
      const cleaned = part.replace(/\s*\(\w+(?:\([^)]*\))?\)\s*$/, '').trim()
      if (cleaned) params.push(cleaned)
    }
  }

  return params
}

/** 判断参数是否为数值类型 */
function isNumericParam(typeStr: string): boolean {
  return /Integer|Long|Double|Float|BigDecimal|Short|Byte|Number/i.test(typeStr)
}

/** 将参数替换到 SQL 中 */
function substituteParams(sql: string, params: string[], originalParamsStr?: string): string {
  if (params.length === 0) return sql

  // 提取原始参数中的类型信息
  const types: string[] = []
  if (originalParamsStr) {
    const regex = /\((\w+(?:\([^)]*\))?)\)/g
    let m
    while ((m = regex.exec(originalParamsStr)) !== null) {
      types.push(m[1])
    }
  }

  let idx = 0
  return sql.replace(/\?/g, () => {
    if (idx >= params.length) return '?'
    const value = params[idx]
    const type = types[idx] || 'String'

    // NULL 值不加引号
    if (value.toUpperCase() === 'NULL') {
      idx++
      return 'NULL'
    }

    // 数值类型不加引号
    if (isNumericParam(type)) {
      idx++
      return value
    }

    // 字符串等类型加单引号，转义内部单引号
    idx++
    return `'${value.replace(/'/g, "''")}'`
  })
}

/** 格式化 SQL 语句 */
function formatSql(sql: string): string {
  const majorKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
    'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN',
    'CROSS JOIN', 'JOIN', 'ON', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
  ]

  const minorKeywords = [
    'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'EXISTS', 'NOT EXISTS',
    'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'AS',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT',
    'ASC', 'DESC', 'SET',
  ]

  let result = sql.replace(/\s+/g, ' ').trim()

  // 先处理主关键字（换行 + 大写）
  for (const kw of majorKeywords.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    result = result.replace(re, `\n${kw}`)
  }

  // 处理 SET 子句中的逗号分隔 — 每个字段换行并缩进
  result = result.replace(/\bSET\b\n?(.+?)(?=\bWHERE\b|\bORDER\b|\bGROUP\b|\bLIMIT\b|$)/gis, (_match, setBody) => {
    const fields = setBody.split(/,\s*(?=\w)/).map((f: string) => f.trim()).filter(Boolean)
    if (fields.length <= 1) return `SET\n  ${setBody.trim()}`
    return `SET\n  ${fields.join(',\n  ')}`
  })

  // 处理次关键字（换行 + 大写，AND/OR 需要缩进）
  for (const kw of minorKeywords.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    if (kw === 'AND' || kw === 'OR') {
      result = result.replace(re, `\n  ${kw}`)
    } else {
      result = result.replace(re, ` ${kw}`)
    }
  }

  // WHERE 后面的内容换行缩进
  result = result.replace(/\bWHERE\b\s*/gi, 'WHERE\n  ')

  // 清理多余空行
  return result
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => !(l === '' && i > 0 && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

/** 格式化单个块 */
function formatBlock(block: { sql: string; params: string[]; result?: string }): string {
  const filledSql = substituteParams(block.sql, block.params)
  const formatted = formatSql(filledSql)
  let output = formatted
  if (block.result) {
    output += `\n-- ${block.result}`
  }
  return output
}

/** 格式化所有块 */
function formatAll(text: string): string {
  const blocks = parseMybatisLog(text)
  if (blocks.length === 0) {
    // 尝试当作普通 SQL 格式化
    return formatSql(text.trim())
  }
  return blocks.map((b) => formatBlock(b)).join('\n\n')
}

export default function MybatisSqlFormatter() {
  const [input, setInput] = useState('')

  const output = input.trim() ? formatAll(input) : ''

  const handleExample = () => setInput(EXAMPLE)

  return (
    <ToolLayout title="MyBatis SQL 格式化" description="将 MyBatis / MyBatis-Plus 日志转换为可执行的 SQL 语句，自动替换参数并格式化">
      <div className="tool-row">
        <span className="tool-label">输入 MyBatis 日志</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleExample}>
          <Sparkles size={12} /> 示例
        </button>
      </div>
      <textarea
        className="textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`粘贴 MyBatis 日志，例如：\n\n==> Preparing: SELECT * FROM users WHERE id = ? AND status = ?\n==> Parameters: 1001(Integer), 1(Integer)\n<==    Total: 1`}
        style={{ minHeight: 160, fontSize: 13, fontFamily: 'monospace' }}
      />
      {output && (
        <>
          <div className="tool-output-label" style={{ marginTop: 16 }}>
            <span className="tool-label" style={{ color: '#10b981' }}>✓ 格式化结果</span>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => navigator.clipboard.writeText(output)}
            >
              <Copy size={12} /> 复制
            </button>
          </div>
          <pre
            className="tool-output"
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.6,
              padding: '12px 16px',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            {output}
          </pre>
        </>
      )}
    </ToolLayout>
  )
}
