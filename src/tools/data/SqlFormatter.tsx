// src/tools/data/SqlFormatter.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

function formatSql(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INDEX', 'UNION', 'UNION ALL', 'DISTINCT',
    'AS', 'IN', 'NOT IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END']

  let result = sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')

  for (const kw of keywords.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi')
    result = result.replace(re, `\n${kw}`)
  }

  return result
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')

  const output = input.trim() ? formatSql(input) : ''

  return (
    <ToolLayout title="SQL 格式化" description="SQL 语句美化与格式化">
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="SELECT u.id, u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 1 ORDER BY o.amount DESC LIMIT 10"
        style={{ minHeight: 150, fontSize: 13 }} />
      {output && (
        <>
          <div className="tool-output-label" style={{ marginTop: 16 }}>
            <span className="tool-label" style={{ color: '#10b981' }}>✓ 格式化结果</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>{output}</div>
        </>
      )}
    </ToolLayout>
  )
}
