// src/tools/common/LoremIpsum.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

const loremEn = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

const loremCn = '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。金生丽水，玉出昆冈。剑号巨阙，珠称夜光。果珍李柰，菜重芥姜。海咸河淡，鳞潜羽翔。龙师火帝，鸟官人皇。始制文字，乃服衣裳。推位让国，有虞陶唐。吊民伐罪，周发殷汤。坐朝问道，垂拱平章。爱育黎首，臣伏戎羌。遐迩一体，率宾归王。鸣凤在竹，白驹食场。化被草木，赖及万方。'

function generate(text: string, count: number, unit: 'paragraphs' | 'sentences' | 'words'): string {
  const sentences = text.match(/[^.。！？!?]+[.。！？!]?/g) || [text]
  const words = text.split(/[\s，。、！？]+/).filter(Boolean)

  if (unit === 'sentences') {
    return Array.from({ length: count }, () => sentences[Math.floor(Math.random() * sentences.length)]).join(' ')
  }
  if (unit === 'words') {
    return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(' ')
  }
  return Array.from({ length: count }, () => text).join('\n\n')
}

export default function LoremIpsum() {
  const [lang, setLang] = useState<'en' | 'cn'>('en')
  const [count, setCount] = useState(3)
  const [unit, setUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')

  const text = lang === 'en' ? loremEn : loremCn
  const output = generate(text, count, unit)

  return (
    <ToolLayout title="Lorem Ipsum 生成器" description="生成占位文本，支持英文和中文">
      <div className="btn-group">
        <button className={`btn ${lang === 'en' ? '' : 'btn-outline'}`} onClick={() => setLang('en')}>英文</button>
        <button className={`btn ${lang === 'cn' ? '' : 'btn-outline'}`} onClick={() => setLang('cn')}>中文</button>
      </div>
      <div className="tool-row">
        <input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} style={{ width: 70 }} />
        <Select
          value={unit}
          onChange={v => setUnit(v as 'paragraphs' | 'sentences' | 'words')}
          options={[
            { value: 'paragraphs', label: '段落' },
            { value: 'sentences', label: '句子' },
            { value: 'words', label: '词' },
          ]}
        />
      </div>
      <div className="tool-output-label" style={{ marginTop: 12 }}>
        <span className="tool-label">生成结果 ({output.length} 字符)</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto', lineHeight: 1.8 }}>{output}</div>
    </ToolLayout>
  )
}
