// src/tools/text/RegexCheatsheet.tsx
import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { Copy, Check, Search, Info } from 'lucide-react'

interface PatternItem {
  name: string
  pattern: string
  desc: string
  example: string
}

interface CategoryItem {
  id: string
  name: string
  icon: string
  patterns: PatternItem[]
}

const PATTERNS: CategoryItem[] = [
  {
    id: 'charMatch',
    name: '字符匹配',
    icon: '⌨️',
    patterns: [
      { name: '任意字符', pattern: '.', desc: '匹配任意单个字符（换行符除外）', example: 'a.c 匹配 "abc", "adc"' },
      { name: '数字', pattern: '\\d', desc: '匹配任意数字字符 [0-9]', example: '\\d+ 匹配 "123", "0"' },
      { name: '非数字', pattern: '\\D', desc: '匹配任意非数字字符', example: '\\D+ 匹配 "abc"' },
      { name: '单词字符', pattern: '\\w', desc: '匹配 [a-zA-Z0-9_]', example: '\\w+ 匹配 "hello_123"' },
      { name: '非单词字符', pattern: '\\W', desc: '匹配非单词字符', example: '\\W 匹配 "@", "!"' },
      { name: '空白字符', pattern: '\\s', desc: '匹配空格、制表符、换行等', example: 'a\\sb 匹配 "a b"' },
      { name: '非空白字符', pattern: '\\S', desc: '匹配非空白字符', example: '\\S+ 匹配 "hello"' },
      { name: '字符集', pattern: '[abc]', desc: '匹配方括号内的任意字符', example: '[aeiou] 匹配元音字母' },
      { name: '否定字符集', pattern: '[^abc]', desc: '匹配不在方括号内的字符', example: '[^0-9] 匹配非数字' },
      { name: '字符范围', pattern: '[a-z]', desc: '匹配指定范围内的字符', example: '[A-Z] 匹配大写字母' },
    ],
  },
  {
    id: 'quantifiers',
    name: '数量词',
    icon: '🔢',
    patterns: [
      { name: '零个或多个', pattern: '*', desc: '匹配前一个元素零次或多次（贪婪）', example: 'ab*c 匹配 "ac", "abc", "abbc"' },
      { name: '一个或多个', pattern: '+', desc: '匹配前一个元素一次或多次（贪婪）', example: 'ab+c 匹配 "abc", "abbc"' },
      { name: '零个或一个', pattern: '?', desc: '匹配前一个元素零次或一次', example: 'colou?r 匹配 "color", "colour"' },
      { name: '恰好 n 个', pattern: '{n}', desc: '匹配前一个元素恰好 n 次', example: '\\d{4} 匹配 "2024"' },
      { name: 'n 个或更多', pattern: '{n,}', desc: '匹配前一个元素至少 n 次（贪婪）', example: '\\d{2,} 匹配 "12", "123"' },
      { name: 'n 到 m 个', pattern: '{n,m}', desc: '匹配前一个元素 n 到 m 次（贪婪）', example: '\\d{2,4} 匹配 "12", "1234"' },
      { name: '非贪婪匹配', pattern: '*?', desc: '非贪婪模式，尽可能少匹配', example: '<.*?> 匹配单个标签' },
      { name: '最多一个', pattern: '??', desc: '非贪婪的 ? 修饰符', example: 'colou??r 非贪婪匹配' },
    ],
  },
  {
    id: 'anchors',
    name: '锚点',
    icon: '⚓',
    patterns: [
      { name: '行首', pattern: '^', desc: '匹配字符串或行的开头', example: '^Hello 匹配行首的 Hello' },
      { name: '行尾', pattern: '$', desc: '匹配字符串或行的结尾', example: 'world$ 匹配行尾的 world' },
      { name: '单词边界', pattern: '\\b', desc: '匹配单词的边界位置', example: '\\bword\\b 匹配完整单词' },
      { name: '非单词边界', pattern: '\\B', desc: '匹配非单词边界位置', example: '\\Bend 匹配 "friend" 中的 end' },
      { name: '字符串开头', pattern: '\\A', desc: '仅匹配字符串开头（多行模式下）', example: '\\AStart 仅匹配开头' },
      { name: '字符串结尾', pattern: '\\Z', desc: '仅匹配字符串结尾（多行模式下）', example: 'end\\Z 仅匹配结尾' },
    ],
  },
  {
    id: 'groups',
    name: '分组',
    icon: '📦',
    patterns: [
      { name: '捕获组', pattern: '(...)', desc: '捕获匹配的内容，可通过编号引用', example: '(\\w+)@(\\w+) 捕获用户名和域名' },
      { name: '非捕获组', pattern: '(?:...)', desc: '分组但不捕获，用于提高性能', example: '(?:ab)+ 匹配 "abab"' },
      { name: '命名捕获组', pattern: '(?<name>...)', desc: '给捕获组命名，便于引用', example: '(?<year>\\d{4}) 捕获为 year' },
      { name: '反向引用', pattern: '\\1, \\2', desc: '引用前面捕获组的内容', example: '(\\w)\\1 匹配 "aa", "bb"' },
      { name: '分支选择', pattern: '|', desc: '匹配多个模式中的任意一个', example: 'cat|dog 匹配 "cat" 或 "dog"' },
    ],
  },
  {
    id: 'lookaround',
    name: '预查',
    icon: '🔮',
    patterns: [
      { name: '正向预查', pattern: '(?=...)', desc: '断言后面跟着指定模式（不消耗字符）', example: '\\d+(?=px) 匹配 "10px" 中的 "10"' },
      { name: '负向预查', pattern: '(?!...)', desc: '断言后面不跟着指定模式', example: '\\d+(?!px) 不匹配 "10px"' },
      { name: '正向后查', pattern: '(?<=...)', desc: '断言前面是指定模式（部分引擎）', example: '(?<=\\$)\\d+ 匹配 "$100" 中的 "100"' },
      { name: '负向后查', pattern: '(?<!...)', desc: '断言前面不是指定模式（部分引擎）', example: '(?<!\\$)\\d+ 不匹配 "$100"' },
    ],
  },
  {
    id: 'practical',
    name: '实用示例',
    icon: '🛠️',
    patterns: [
      { name: '中国手机号', pattern: '1[3-9]\\d{9}', desc: '匹配中国手机号码', example: '13812345678' },
      { name: '电子邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+', desc: '匹配常见邮箱格式', example: 'user@example.com' },
      { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?', desc: '匹配 HTTP/HTTPS URL', example: 'https://example.com/path' },
      { name: 'IPv4 地址', pattern: '(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)', desc: '匹配有效 IPv4 地址', example: '192.168.1.1' },
      { name: 'IPv6 地址', pattern: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', desc: '匹配标准 IPv6 地址', example: '2001:0db8:85a3::8a2e:0370:7334' },
      { name: '中国身份证号', pattern: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]', desc: '匹配 18 位身份证号码', example: '110101199003074518' },
      { name: '中文姓名', pattern: '[\\u4e00-\\u9fa5]{2,4}', desc: '匹配 2-4 个中文字符', example: '张三丰' },
      { name: '日期 (YYYY-MM-DD)', pattern: '(?:19|20)\\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', desc: '匹配标准日期格式', example: '2024-03-15' },
      { name: '日期 (YYYY/MM/DD)', pattern: '(?:19|20)\\d{2}/(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\\d|3[01])', desc: '匹配斜杠分隔日期', example: '2024/03/15' },
      { name: '时间 (HH:MM:SS)', pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d', desc: '匹配 24 小时制时间', example: '14:30:00' },
      { name: '价格/金额', pattern: '¥?\\d+(?:,\\d{3})*(?:\\.\\d{1,2})?', desc: '匹配人民币或带千分位的金额', example: '¥1,234.56' },
      { name: '邮政编码', pattern: '[1-9]\\d{5}', desc: '匹配中国邮政编码', example: '100000' },
      { name: 'HTML 标签', pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', desc: '匹配 HTML 标签及内容', example: '<div>content</div>' },
      { name: '强密码', pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}', desc: '至少8位，含大小写字母和数字', example: 'Pass1234' },
    ],
  },
]

const FLAGS_INFO = [
  { flag: 'g', name: '全局匹配', desc: '找到所有匹配，而非仅第一个' },
  { flag: 'i', name: '忽略大小写', desc: '匹配时不区分大小写' },
  { flag: 'm', name: '多行模式', desc: '^ 和 $ 匹配每行的开始和结束' },
  { flag: 's', name: '单行模式', desc: '. 匹配包括换行符的所有字符' },
  { flag: 'u', name: 'Unicode 模式', desc: '启用完整的 Unicode 支持' },
]

export default function RegexCheatsheet() {
  const [selectedCategory, setSelectedCategory] = useState('charMatch')
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testPattern, setTestPattern] = useState('')
  const [testFlags, setTestFlags] = useState('g')
  const [testError, setTestError] = useState('')

  const currentCategory = PATTERNS.find((c) => c.id === selectedCategory)

  const testMatches = useMemo(() => {
    if (!testPattern || !testInput) {
      setTestError('')
      return []
    }
    try {
      const re = new RegExp(testPattern, testFlags)
      const matches = [...testInput.matchAll(re)].map((m) => ({
        text: m[0],
        index: m.index ?? 0,
        groups: m.slice(1),
      }))
      setTestError('')
      return matches
    } catch (e: any) {
      setTestError(e.message)
      return []
    }
  }, [testPattern, testInput, testFlags])

  const copyToClipboard = async (pattern: string) => {
    try {
      await navigator.clipboard.writeText(pattern)
      setCopiedPattern(pattern)
      setTimeout(() => setCopiedPattern(null), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  const insertPattern = (pattern: string) => {
    setTestPattern(pattern)
  }

  return (
    <ToolLayout
      title="正则表达式速查表"
      description="常用正则表达式模板库，支持一键复制和在线测试"
    >
      <div className="regex-cheatsheet">
        {/* 左侧分类导航 */}
        <nav className="regex-sidebar">
          <div className="regex-sidebar-title">分类</div>
          {PATTERNS.map((cat) => (
            <button
              key={cat.id}
              className={`regex-nav-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="regex-nav-icon">{cat.icon}</span>
              <span className="regex-nav-name">{cat.name}</span>
              <span className="regex-nav-count">{cat.patterns.length}</span>
            </button>
          ))}
        </nav>

        {/* 中间模式卡片 */}
        <main className="regex-main">
          <div className="regex-patterns-header">
            <h2>{currentCategory?.icon} {currentCategory?.name}</h2>
            <span className="regex-patterns-count">{currentCategory?.patterns.length} 个模式</span>
          </div>
          <div className="regex-patterns-grid">
            {currentCategory?.patterns.map((p, idx) => (
              <div key={idx} className="regex-pattern-card">
                <div className="regex-pattern-header">
                  <span className="regex-pattern-name">{p.name}</span>
                  <button
                    className={`regex-copy-btn ${copiedPattern === p.pattern ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(p.pattern)}
                    title="复制模式"
                  >
                    {copiedPattern === p.pattern ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="regex-pattern-code" onClick={() => insertPattern(p.pattern)} title="点击测试">
                  <code>/{p.pattern}/{testFlags}</code>
                </div>
                <p className="regex-pattern-desc">{p.desc}</p>
                <div className="regex-pattern-example">
                  <Info size={12} />
                  <span>{p.example}</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 右侧测试区域 */}
        <aside className="regex-tester">
          <div className="regex-tester-header">
            <Search size={16} />
            <span>在线测试</span>
          </div>

          <div className="regex-tester-inputs">
            <div className="regex-tester-pattern">
              <span className="regex-tester-slash">/</span>
              <input
                className="input"
                value={testPattern}
                onChange={(e) => setTestPattern(e.target.value)}
                placeholder="输入正则表达式"
                style={{ fontFamily: 'monospace', flex: 1 }}
              />
              <span className="regex-tester-slash">/</span>
              <input
                className="input"
                value={testFlags}
                onChange={(e) => setTestFlags(e.target.value)}
                placeholder="g"
                style={{ width: 50, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {testError && (
            <div className="regex-tester-error">{testError}</div>
          )}

          <textarea
            className="textarea"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="输入测试文本..."
            style={{ marginTop: 8, minHeight: 100 }}
          />

          <div className="regex-tester-result">
            <div className="regex-tester-result-header">
              <span>匹配结果</span>
              <span className="regex-tester-match-count">{testMatches.length} 个匹配</span>
            </div>
            <div className="regex-tester-result-content">
              {testMatches.length > 0 ? (
                <ul className="regex-tester-matches">
                  {testMatches.map((m, i) => (
                    <li key={i}>
                      <span className="regex-match-index">#{i + 1}</span>
                      <span className="regex-match-text">"{m.text}"</span>
                      <span className="regex-match-pos">@{m.index}</span>
                      {m.groups.length > 0 && (
                        <span className="regex-match-groups">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="regex-match-group">
                              ${gi + 1}: "{g}"
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="regex-tester-empty">
                  {testPattern && testInput ? '无匹配' : '输入模式和文本开始测试'}
                </div>
              )}
            </div>
          </div>

          {/* 常用标志 */}
          <div className="regex-tester-flags">
            <div className="regex-tester-flags-title">常用标志</div>
            <div className="regex-tester-flags-list">
              {FLAGS_INFO.map((f) => (
                <button
                  key={f.flag}
                  className={`regex-flag-btn ${testFlags.includes(f.flag) ? 'active' : ''}`}
                  onClick={() => {
                    if (testFlags.includes(f.flag)) {
                      setTestFlags(testFlags.replace(f.flag, ''))
                    } else {
                      setTestFlags(testFlags + f.flag)
                    }
                  }}
                  title={f.desc}
                >
                  <span className="regex-flag-code">{f.flag}</span>
                  <span className="regex-flag-name">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .regex-cheatsheet {
          display: grid;
          grid-template-columns: 180px 1fr 320px;
          gap: 16px;
          height: calc(100vh - 180px);
        }

        @media (max-width: 1024px) {
          .regex-cheatsheet {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .regex-sidebar {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 12px;
          height: fit-content;
          position: sticky;
          top: 16px;
        }

        @media (max-width: 1024px) {
          .regex-sidebar {
            position: static;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
        }

        .regex-sidebar-title {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 4px 8px 8px;
          letter-spacing: 0.5px;
        }

        .regex-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          color: var(--text);
        }

        @media (max-width: 1024px) {
          .regex-nav-item {
            width: auto;
            padding: 8px 12px;
          }
        }

        .regex-nav-item:hover {
          background: var(--hover-bg);
        }

        .regex-nav-item.active {
          background: var(--accent);
          color: white;
        }

        .regex-nav-icon {
          font-size: 16px;
        }

        .regex-nav-name {
          flex: 1;
          font-size: 14px;
        }

        .regex-nav-count {
          font-size: 11px;
          background: var(--border);
          padding: 2px 6px;
          border-radius: 10px;
        }

        .regex-nav-item.active .regex-nav-count {
          background: rgba(255,255,255,0.2);
        }

        .regex-main {
          overflow-y: auto;
          padding-right: 8px;
        }

        .regex-patterns-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .regex-patterns-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .regex-patterns-count {
          font-size: 13px;
          color: var(--text-dim);
        }

        .regex-patterns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .regex-pattern-card {
          background: var(--card-bg);
          border-radius: 10px;
          padding: 14px;
          border: 1px solid var(--border);
          transition: border-color 0.15s;
        }

        .regex-pattern-card:hover {
          border-color: var(--accent);
        }

        .regex-pattern-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .regex-pattern-name {
          font-weight: 600;
          font-size: 15px;
        }

        .regex-copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: var(--hover-bg);
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-dim);
          transition: all 0.15s;
        }

        .regex-copy-btn:hover {
          background: var(--accent);
          color: white;
        }

        .regex-copy-btn.copied {
          background: #22c55e;
          color: white;
        }

        .regex-pattern-code {
          background: var(--code-bg, #1e1e2e);
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .regex-pattern-code:hover {
          background: var(--code-bg-hover, #2a2a3e);
        }

        .regex-pattern-code code {
          font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
          font-size: 13px;
          color: var(--accent);
        }

        .regex-pattern-desc {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0 0 8px;
          line-height: 1.4;
        }

        .regex-pattern-example {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 12px;
          color: var(--text-dim);
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }

        .regex-pattern-example svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .regex-tester {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 16px;
          height: fit-content;
          position: sticky;
          top: 16px;
        }

        @media (max-width: 1024px) {
          .regex-tester {
            position: static;
          }
        }

        .regex-tester-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--accent);
        }

        .regex-tester-inputs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .regex-tester-pattern {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .regex-tester-slash {
          font-size: 18px;
          color: var(--text-dim);
          font-family: monospace;
        }

        .regex-tester-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          margin-top: 8px;
        }

        .regex-tester-result {
          margin-top: 16px;
        }

        .regex-tester-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .regex-tester-match-count {
          background: var(--accent);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
        }

        .regex-tester-result-content {
          background: var(--code-bg, #1e1e2e);
          border-radius: 8px;
          padding: 12px;
          min-height: 80px;
          max-height: 200px;
          overflow-y: auto;
        }

        .regex-tester-matches {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .regex-tester-matches li {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
        }

        .regex-tester-matches li:last-child {
          border-bottom: none;
        }

        .regex-match-index {
          color: var(--text-dim);
          font-size: 11px;
        }

        .regex-match-text {
          color: var(--accent);
          font-family: monospace;
        }

        .regex-match-pos {
          color: var(--text-dim);
          font-size: 11px;
        }

        .regex-match-groups {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .regex-match-group {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        .regex-tester-empty {
          color: var(--text-dim);
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }

        .regex-tester-flags {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .regex-tester-flags-title {
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .regex-tester-flags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .regex-flag-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid var(--border);
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text);
          transition: all 0.15s;
        }

        .regex-flag-btn:hover {
          border-color: var(--accent);
        }

        .regex-flag-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .regex-flag-code {
          font-family: monospace;
          font-weight: 600;
        }

        .regex-flag-name {
          font-size: 11px;
        }
      `}</style>
    </ToolLayout>
  )
}
