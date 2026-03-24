// src/tools/text/MarkdownPreview.tsx
import ToolLayout from '../../components/ToolLayout'
import {
  Bold, Italic, Link, Image, Code, List, ListOrdered,
  Eye, Columns, FileText, Copy, Check, Heading1, Heading2
} from 'lucide-react'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'

type ViewMode = 'split' | 'editor' | 'preview'

const STORAGE_KEY = 'markdown-preview-content'

// ─────────────────────────────────────────────────────────────
// 简单的 Markdown 解析器
// ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function highlightCode(code: string, lang: string): string {
  // 简单的语法高亮实现
  const escaped = escapeHtml(code)
  
  if (!lang || lang === 'text' || lang === 'plain') {
    return escaped
  }

  // 关键字列表
  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'interface', 'type', 'extends', 'implements', 'enum', 'namespace', 'as', 'is'],
    jsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    tsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'interface', 'type', 'extends', 'implements', 'enum', 'namespace', 'as', 'is'],
    python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'raise', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'pass', 'break', 'continue', 'yield', 'global', 'nonlocal'],
    html: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside'],
    css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'flex', 'grid', 'font', 'text', 'align', 'justify', 'transform', 'transition', 'animation', 'opacity', 'visibility', 'overflow', 'z-index'],
    json: ['true', 'false', 'null'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'],
    bash: ['echo', 'export', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'sed', 'awk', 'find', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'npm', 'git', 'ssh', 'scp', 'curl', 'wget', 'tar', 'zip', 'unzip'],
  }

  const langKeywords = keywords[lang.toLowerCase()] || []

  let result = escaped

  // 高亮注释
  if (['javascript', 'typescript', 'jsx', 'tsx', 'python', 'bash', 'java', 'c', 'cpp', 'csharp', 'go', 'rust'].includes(lang.toLowerCase())) {
    // 单行注释
    result = result.replace(/(\/\/.*$)/gm, '<span class="md-code-comment">$1</span>')
    // 多行注释
    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="md-code-comment">$1</span>')
  }
  if (['python', 'bash'].includes(lang.toLowerCase())) {
    // Python/Shell 注释
    result = result.replace(/(#.*$)/gm, '<span class="md-code-comment">$1</span>')
  }
  if (['html', 'xml'].includes(lang.toLowerCase())) {
    // HTML 注释
    result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="md-code-comment">$1</span>')
    // HTML 标签
    result = result.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="md-code-tag">$2</span>')
    result = result.replace(/([\w-]+)(=)/g, '<span class="md-code-attr">$1</span>$2')
    result = result.replace(/"([^"]*)"/g, '"<span class="md-code-string">$1</span>"')
  }
  if (['css'].includes(lang.toLowerCase())) {
    // CSS 选择器
    result = result.replace(/([.#]?[\w-]+)(\s*\{)/g, '<span class="md-code-tag">$1</span>$2')
    // CSS 属性
    result = result.replace(/([\w-]+)(\s*:)/g, '<span class="md-code-attr">$1</span>$2')
    // CSS 值
    result = result.replace(/:\s*([^;}\n]+)/g, ': <span class="md-code-string">$1</span>')
  }
  if (['json'].includes(lang.toLowerCase())) {
    // JSON 键
    result = result.replace(/"([^"]+)"(\s*:)/g, '<span class="md-code-attr">"$1"</span>$2')
    // JSON 值
    result = result.replace(/:\s*("([^"]*)")/g, ': <span class="md-code-string">$1</span>')
  }
  if (['sql'].includes(lang.toLowerCase())) {
    // SQL 关键字
    result = result.replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|UNION|ALL|INSERT INTO|VALUES|SET)\b/gi, '<span class="md-code-keyword">$1</span>')
  }

  // 高亮关键字
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
    result = result.replace(regex, '<span class="md-code-keyword">$1</span>')
  })

  // 高亮字符串
  result = result.replace(/("([^"]|\\")*"|'([^']|\\')*'|`([^`]|\\`)*`)/g, '<span class="md-code-string">$1</span>')

  // 高亮数字
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="md-code-number">$1</span>')

  return result
}

function parseInline(text: string): string {
  // HTML 转义（用于内联代码和链接URL等）
  let result = escapeHtml(text)
  
  // 内联代码
  result = result.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  
  // 加粗 **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // 斜体 *text*
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // 删除线 ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  
  // 图片 ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-image" />')
  
  // 链接 [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  return result
}

function parseMarkdown(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 跳过空行但保留段落分隔
    if (line.trim() === '') {
      result.push('')
      i++
      continue
    }

    // 标题 h1-h6
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      result.push(`<h${level} class="md-heading md-h${level}">${parseInline(text)}</h${level}>`)
      i++
      continue
    }

    // 代码块 ```lang\ncode\n```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const code = codeLines.join('\n')
      const highlighted = highlightCode(code, lang)
      result.push(`<pre class="md-code-block"><code class="language-${lang}">${highlighted}</code></pre>`)
      i++ // 跳过结束 ```
      continue
    }

    // 区块引用 >
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '')) {
        if (lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''))
        }
        i++
      }
      const quoteContent = quoteLines.join('<br/>')
      result.push(`<blockquote class="md-blockquote">${parseInline(quoteContent)}</blockquote>`)
      continue
    }

    // 有序列表 1. item
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(`<li>${parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      result.push(`<ol class="md-list md-ordered-list">${listItems.join('')}</ol>`)
      continue
    }

    // 无序列表 - item 或 * item 或 + item
    if (/^[-*+]\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        listItems.push(`<li>${parseInline(lines[i].replace(/^[-*+]\s/, ''))}</li>`)
        i++
      }
      result.push(`<ul class="md-list md-unordered-list">${listItems.join('')}</ul>`)
      continue
    }

    // 水平线 --- or *** or ___
    if (/^([-*_]){3,}$/.test(line.trim())) {
      result.push('<hr class="md-hr"/>')
      i++
      continue
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|')) {
      let hasSeparator = false
      
      // 收集表格行
      const rowLines: string[] = [line]
      i++
      while (i < lines.length && lines[i].includes('|')) {
        rowLines.push(lines[i])
        if (/^\|?\s*[-:]+\s*[-:|\s]+\|?$/.test(lines[i])) {
          hasSeparator = true
        }
        i++
      }
      
      // 解析表头
      const headerCells = rowLines[0].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(cell => parseInline(cell.trim()))
      
      // 检查是否有分隔行（有效的表格）
      if (hasSeparator && rowLines.length > 1) {
        const thead = `<thead><tr>${headerCells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`
        
        // 解析表格数据行
        const tbodyRows: string[] = []
        for (let j = 2; j < rowLines.length; j++) {
          const cells = rowLines[j].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(cell => parseInline(cell.trim()))
          tbodyRows.push(`<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
        }
        
        result.push(`<table class="md-table"><tbody>${thead.replace('<thead>', '').replace('</thead>', '')}${tbodyRows.join('')}</tbody></table>`)
      } else {
        // 没有有效的表格格式，按普通文本处理
        rowLines.forEach(row => {
          result.push(`<p>${parseInline(row)}</p>`)
        })
      }
      continue
    }

    // 普通段落
    const paragraphLines: string[] = [line]
    while (i + 1 < lines.length && lines[i + 1].trim() !== '' && 
           !lines[i + 1].match(/^(#{1,6})\s+/) && 
           !lines[i + 1].startsWith('```') &&
           !lines[i + 1].startsWith('>') &&
           !/^[-*+]\s/.test(lines[i + 1]) &&
           !/^\d+\.\s/.test(lines[i + 1]) &&
           !/^([-*_]){3,}$/.test(lines[i + 1].trim())) {
      i++
      paragraphLines.push(lines[i])
    }
    result.push(`<p class="md-paragraph">${parseInline(paragraphLines.join(' '))}</p>`)
    i++
  }

  return result.filter(line => line !== '').join('\n')
}

// ─────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────

function insertText(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string = ''
): void {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)
  
  const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end)
  const newCursorPos = start + prefix.length + selectedText.length + suffix.length
  
  textarea.value = newText
  textarea.setSelectionRange(newCursorPos, newCursorPos)
  textarea.focus()
  
  // 触发 React state 更新
  const event = new Event('input', { bubbles: true })
  textarea.dispatchEvent(event)
}

// ─────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────

const DEFAULT_MARKDOWN = `# Markdown 预览工具

这是一个支持**实时预览**的 Markdown 编辑器。

## 功能特点

- 📝 实时预览编辑内容
- 🎨 语法高亮显示
- 📋 一键复制 HTML

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('世界'));
\`\`\`

## 列表

### 无序列表
- 苹果
- 香蕉
- 橙子

### 有序列表
1. 第一步
2. 第二步
3. 第三步

## 引用

> 这是一段引用文本。
> 可以包含多行内容。

## 表格

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25 | 北京 |
| 李四 | 30 | 上海 |

## 链接和图片

[访问 GitHub](https://github.com)

---

> 试试编辑上面的内容，右侧会实时预览效果！
`

function getInitialContent(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_MARKDOWN
  }
  return DEFAULT_MARKDOWN
}

export default function MarkdownPreview() {
  const [content, setContent] = useState(getInitialContent)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // 自动保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, content)
  }, [content])

  // 计算行数和字符数
  const stats = useMemo(() => {
    const lines = content.split('\n')
    return {
      lineCount: lines.length,
      charCount: content.length,
      wordCount: content.trim() ? content.trim().split(/\s+/).length : 0
    }
  }, [content])

  // 解析 Markdown
  const renderedHtml = useMemo(() => {
    return parseMarkdown(content)
  }, [content])

  // 复制 HTML
  const handleCopyHtml = useCallback(() => {
    navigator.clipboard.writeText(renderedHtml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [renderedHtml])

  // 工具栏按钮处理
  const toolbarActions = {
    bold: () => textareaRef.current && insertText(textareaRef.current, '**', '**'),
    italic: () => textareaRef.current && insertText(textareaRef.current, '*', '*'),
    link: () => textareaRef.current && insertText(textareaRef.current, '[', '](url)'),
    image: () => textareaRef.current && insertText(textareaRef.current, '![alt](', ')'),
    code: () => textareaRef.current && insertText(textareaRef.current, '`', '`'),
    codeBlock: () => textareaRef.current && insertText(textareaRef.current, '\n```\n', '\n```\n'),
    ulList: () => textareaRef.current && insertText(textareaRef.current, '- ', ''),
    olList: () => textareaRef.current && insertText(textareaRef.current, '1. ', ''),
    h1: () => textareaRef.current && insertText(textareaRef.current, '# ', ''),
    h2: () => textareaRef.current && insertText(textareaRef.current, '## ', ''),
  }

  // 滚动同步
  const handleEditorScroll = useCallback(() => {
    if (textareaRef.current && previewRef.current && viewMode === 'split') {
      const { scrollTop, scrollHeight, clientHeight } = textareaRef.current
      const scrollRatio = scrollTop / (scrollHeight - clientHeight)
      previewRef.current.scrollTop = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight)
    }
  }, [viewMode])

  return (
    <ToolLayout title="Markdown 预览" description="实时 Markdown 编辑预览，支持语法高亮">
      <style>{`
        .md-editor-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
          min-height: 400px;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-secondary);
        }
        
        .md-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        
        .md-toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .md-toolbar-btn:hover {
          background: var(--bg-hover);
          color: var(--text);
        }
        
        .md-toolbar-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          margin: 0 8px;
        }
        
        .md-toolbar-spacer {
          flex: 1;
        }
        
        .md-view-toggle {
          display: flex;
          gap: 2px;
          background: var(--bg-primary);
          padding: 2px;
          border-radius: 6px;
        }
        
        .md-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .md-view-btn.active {
          background: var(--accent);
          color: white;
        }
        
        .md-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .md-editor-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          ${viewMode === 'preview' ? 'display: none;' : ''}
        }
        
        .md-preview-pane {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          background: var(--bg-primary);
          ${viewMode === 'editor' ? 'display: none;' : ''}
        }
        
        .md-editor-wrapper {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .md-line-numbers {
          padding: 12px 8px 12px 12px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.6;
          text-align: right;
          user-select: none;
          min-width: 40px;
          overflow: hidden;
        }
        
        .md-textarea {
          flex: 1;
          padding: 12px;
          border: none;
          background: var(--bg-primary);
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
        }
        
        .md-textarea::placeholder {
          color: var(--text-secondary);
        }
        
        .md-preview-content {
          max-width: 800px;
        }
        
        .md-preview-content .md-heading {
          margin: 1.5em 0 0.5em;
          color: var(--text);
          font-weight: 600;
        }
        
        .md-preview-content .md-h1 { font-size: 1.8em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
        .md-preview-content .md-h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
        .md-preview-content .md-h3 { font-size: 1.25em; }
        .md-preview-content .md-h4 { font-size: 1.1em; }
        .md-preview-content .md-h5, .md-preview-content .md-h6 { font-size: 1em; }
        
        .md-preview-content .md-paragraph {
          margin: 0.8em 0;
          line-height: 1.7;
        }
        
        .md-preview-content .md-blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid var(--accent);
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }
        
        .md-preview-content .md-list {
          margin: 0.8em 0;
          padding-left: 1.5em;
        }
        
        .md-preview-content .md-unordered-list {
          list-style-type: disc;
        }
        
        .md-preview-content .md-ordered-list {
          list-style-type: decimal;
        }
        
        .md-preview-content .md-list li {
          margin: 0.3em 0;
        }
        
        .md-preview-content .md-code-block {
          margin: 1em 0;
          padding: 1em;
          background: #1e1e1e;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .md-preview-content .md-code-block code {
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.5;
          color: #d4d4d4;
        }
        
        .md-preview-content .md-inline-code {
          padding: 0.2em 0.4em;
          background: var(--bg-secondary);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.9em;
          color: var(--accent);
        }
        
        .md-preview-content .md-code-keyword { color: #569cd6; }
        .md-preview-content .md-code-string { color: #ce9178; }
        .md-preview-content .md-code-number { color: #b5cea8; }
        .md-preview-content .md-code-comment { color: #6a9955; }
        .md-preview-content .md-code-tag { color: #4ec9b0; }
        .md-preview-content .md-code-attr { color: #9cdcfe; }
        
        .md-preview-content .md-hr {
          margin: 2em 0;
          border: none;
          border-top: 1px solid var(--border);
        }
        
        .md-preview-content .md-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          font-size: 14px;
        }
        
        .md-preview-content .md-table th,
        .md-preview-content .md-table td {
          padding: 8px 12px;
          border: 1px solid var(--border);
          text-align: left;
        }
        
        .md-preview-content .md-table th {
          background: var(--bg-secondary);
          font-weight: 600;
        }
        
        .md-preview-content .md-table tr:hover {
          background: var(--bg-hover);
        }
        
        .md-preview-content .md-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 0.5em 0;
        }
        
        .md-preview-content a {
          color: var(--accent);
          text-decoration: none;
        }
        
        .md-preview-content a:hover {
          text-decoration: underline;
        }
        
        .md-preview-content strong {
          font-weight: 600;
        }
        
        .md-preview-content em {
          font-style: italic;
        }
        
        .md-preview-content del {
          text-decoration: line-through;
          color: var(--text-secondary);
        }
        
        .md-status-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .md-status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .md-copy-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border: none;
          border-radius: 4px;
          background: var(--accent);
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .md-copy-btn:hover {
          opacity: 0.9;
        }
        
        .md-copy-btn.copied {
          background: #22c55e;
        }
        
        .md-empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
          text-align: center;
        }
        
        .md-empty-preview svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        @media (max-width: 768px) {
          .md-editor-container {
            height: calc(100vh - 160px);
          }
          
          .md-main {
            flex-direction: column;
          }
          
          .md-preview-pane {
            border-top: 1px solid var(--border);
          }
        }
      `}</style>

      <div className="md-editor-container">
        {/* 工具栏 */}
        <div className="md-toolbar">
          <button className="md-toolbar-btn" onClick={toolbarActions.h1} title="标题1 (H1)">
            <Heading1 size={18} />
          </button>
          <button className="md-toolbar-btn" onClick={toolbarActions.h2} title="标题2 (H2)">
            <Heading2 size={18} />
          </button>
          
          <div className="md-toolbar-divider" />
          
          <button className="md-toolbar-btn" onClick={toolbarActions.bold} title="加粗">
            <Bold size={18} />
          </button>
          <button className="md-toolbar-btn" onClick={toolbarActions.italic} title="斜体">
            <Italic size={18} />
          </button>
          
          <div className="md-toolbar-divider" />
          
          <button className="md-toolbar-btn" onClick={toolbarActions.link} title="链接">
            <Link size={18} />
          </button>
          <button className="md-toolbar-btn" onClick={toolbarActions.image} title="图片">
            <Image size={18} />
          </button>
          
          <div className="md-toolbar-divider" />
          
          <button className="md-toolbar-btn" onClick={toolbarActions.code} title="行内代码">
            <Code size={18} />
          </button>
          
          <div className="md-toolbar-divider" />
          
          <button className="md-toolbar-btn" onClick={toolbarActions.ulList} title="无序列表">
            <List size={18} />
          </button>
          <button className="md-toolbar-btn" onClick={toolbarActions.olList} title="有序列表">
            <ListOrdered size={18} />
          </button>
          
          <div className="md-toolbar-spacer" />
          
          <button className={`md-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyHtml}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制 HTML'}
          </button>
          
          <div className="md-view-toggle">
            <button
              className={`md-view-btn ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="仅编辑"
            >
              <FileText size={16} />
            </button>
            <button
              className={`md-view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="分屏"
            >
              <Columns size={16} />
            </button>
            <button
              className={`md-view-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="仅预览"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="md-main">
          {/* 编辑器 */}
          <div className="md-editor-pane">
            <div className="md-editor-wrapper">
              <div className="md-line-numbers">
                {Array.from({ length: stats.lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="md-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder="在此输入 Markdown 内容..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* 预览 */}
          <div className="md-preview-pane" ref={previewRef}>
            {renderedHtml ? (
              <div
                className="md-preview-content"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            ) : (
              <div className="md-empty-preview">
                <FileText size={48} />
                <p>预览区域</p>
              </div>
            )}
          </div>
        </div>

        {/* 状态栏 */}
        <div className="md-status-bar">
          <span className="md-status-item">
            行数: {stats.lineCount}
          </span>
          <span className="md-status-item">
            字符: {stats.charCount}
          </span>
          <span className="md-status-item">
            词数: {stats.wordCount}
          </span>
        </div>
      </div>
    </ToolLayout>
  )
}
