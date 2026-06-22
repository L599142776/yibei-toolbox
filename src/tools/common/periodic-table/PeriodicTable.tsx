// src/tools/common/periodic-table/PeriodicTable.tsx
// 交互式元素周期表 - 为孩子学习化学设计

import { useState, useMemo, useCallback } from 'react'
import { Search, Sparkles, Atom, Beaker, Zap, Info, X, HelpCircle } from 'lucide-react'
import ToolLayout from '../../../components/ToolLayout'
import { elements, categoryColors, categoryNames, type Element, type ElementCategory } from './elements'

// 专业术语解释
const termExplanations: Record<string, string> = {
  '原子量': '一个原子的质量，单位是"原子质量单位"(u)。碳-12 的原子量被定义为 12。',
  '电子构型': '电子在原子中的排布方式，告诉我们电子在哪些轨道上运动。',
  '周期': '元素在周期表中的行数，同一周期的元素电子层数相同。',
  '族': '元素在周期表中的列数，同一族的元素化学性质相似。',
  '区': '根据价电子所在的轨道划分：s区(1-2族)、p区(13-18族)、d区(3-12族)、f区(镧锕系)。',
  '电负性': '原子吸引电子能力的大小，数值越大越容易吸引电子。氟的电负性最大(4.0)。',
  '密度': '单位体积的质量，g/cm³ 表示每立方厘米有多少克。',
  '熔点': '固体变成液体的温度，如冰的熔点是 0°C。',
  '沸点': '液体变成气体的温度，如水的沸点是 100°C。',
  '镧系': '第6周期的15个元素(原子序数57-71)，从镧到镥，都是稀土金属，化学性质很相似。',
  '锕系': '第7周期的15个元素(原子序数89-103)，从锕到铹，很多具有放射性。',
  '碱金属': '第1族（除氢外）：锂、钠、钾等。非常活泼，遇水剧烈反应，质地柔软可用刀切。',
  '碱土金属': '第2族：铍、镁、钙等。比碱金属稳定，但也能与水反应。骨骼中的钙就属于碱土金属。',
  '过渡金属': '第3-12族：铁、铜、金等。大多坚硬耐热，有多种化合价，常有颜色。铁、铜、金都是过渡金属。',
  '后过渡金属': '铝、镓、铟、锡等。位于过渡金属之后，性质介于金属和准金属之间。',
  '准金属': '硼、硅、锗等。既有金属性又有非金属性，是半导体材料。芯片就是用硅做的！',
  '非金属': '碳、氮、氧、磷等。通常不导电，是生命必需的元素。我们呼吸的氧气就是非金属。',
  '卤素': '氟、氯、溴、碘等。非常活泼，能与大多数元素反应。食盐里的氯就是卤素。',
  '稀有气体': '氦、氖、氩等。化学性质极不活泼，几乎不与其他元素反应。霓虹灯里就充有稀有气体。',
  '镧系元素': '镧到镥的15个元素，都是稀土金属。磁铁、荧光粉、手机屏幕都用到镧系元素。',
  '锕系元素': '锕到铹的15个元素，大多具有放射性。铀和钚是核能的燃料，属于锕系元素。',
}

function Tooltip({ term, children }: { term: string; children: React.ReactNode }) {
  const explanation = termExplanations[term]
  if (!explanation) return <>{children}</>

  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip-icon">
        <HelpCircle size={12} />
        <span className="tooltip-content">{explanation}</span>
      </span>
    </span>
  )
}

export default function PeriodicTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [filterCategory, setFilterCategory] = useState<ElementCategory | null>(null)

  const filteredElements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return elements.filter((el) => {
      const matchSearch = !q ||
        el.name.includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        el.symbol.toLowerCase().includes(q) ||
        String(el.number).includes(q)
      const matchCategory = !filterCategory || el.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [searchQuery, filterCategory])

  const filteredSet = useMemo(() => new Set(filteredElements.map(e => e.number)), [filteredElements])

  const handleElementClick = useCallback((el: Element) => {
    setSelectedElement(prev => prev?.number === el.number ? null : el)
  }, [])

  const getBlockIcon = (block: string) => {
    switch (block) {
      case 's': return <Zap size={12} />
      case 'p': return <Atom size={12} />
      case 'd': return <Beaker size={12} />
      case 'f': return <Sparkles size={12} />
      default: return null
    }
  }

  const getCategoryEmoji = (category: ElementCategory): string => {
    const map: Record<ElementCategory, string> = {
      'alkali-metal': '🔥',
      'alkaline-earth': '✨',
      'transition-metal': '⚙️',
      'post-transition': '🔩',
      'metalloid': '💎',
      'nonmetal': '🌿',
      'halogen': '⚡',
      'noble-gas': '🎈',
      'lanthanide': '🌈',
      'actinide': '☢️',
    }
    return map[category]
  }

  const renderElement = (el: Element) => {
    const isFiltered = filteredSet.has(el.number)
    const isSelected = selectedElement?.number === el.number
    const color = categoryColors[el.category]

    return (
      <button
        key={el.number}
        className={`periodic-element ${isSelected ? 'selected' : ''} ${!isFiltered ? 'dimmed' : ''}`}
        style={{
          '--el-color': color,
          '--el-color-alpha': `${color}33`,
        } as React.CSSProperties}
        onClick={() => handleElementClick(el)}
        title={`${el.name} (${el.symbol}) - ${el.nameEn}`}
      >
        <span className="element-number">{el.number}</span>
        <span className="element-symbol">{el.symbol}</span>
        <span className="element-name">{el.name}</span>
        <span className="element-mass">{el.atomicMass}</span>
      </button>
    )
  }

  const renderGrid = () => {
    const rows: React.ReactNode[] = []
    for (let r = 1; r <= 7; r++) {
      const cols: React.ReactNode[] = []
      for (let c = 1; c <= 18; c++) {
        const el = elements.find(e => e.row === r && e.col === c)
        if (el) {
          cols.push(renderElement(el))
        } else {
          cols.push(<div key={`empty-${r}-${c}`} className="periodic-element empty" />)
        }
      }
      rows.push(
        <div key={`row-${r}`} className="periodic-row">
          {cols}
        </div>
      )
    }

    const lanthanides = elements.filter(e => e.category === 'lanthanide')
    const actinides = elements.filter(e => e.category === 'actinide')

    rows.push(
      <div key="separator" className="periodic-separator">
        <Tooltip term="镧系">
          <span className="separator-label">▼ 镧系 (57-71)</span>
        </Tooltip>
        <Tooltip term="锕系">
          <span className="separator-label">▼ 锕系 (89-103)</span>
        </Tooltip>
      </div>
    )

    rows.push(
      <div key="lanthanides" className="periodic-row lanthanide-row">
        <div className="periodic-element empty" />
        <div className="periodic-element empty" />
        {lanthanides.map(el => renderElement(el))}
      </div>
    )

    rows.push(
      <div key="actinides" className="periodic-row actinide-row">
        <div className="periodic-element empty" />
        <div className="periodic-element empty" />
        {actinides.map(el => renderElement(el))}
      </div>
    )

    return rows
  }

  return (
    <ToolLayout title="元素周期表" description="点击元素探索化学世界的奥秘！">
      <div className="pt-container">
        {/* 搜索和筛选 */}
        <div className="pt-toolbar">
          <div className="pt-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜索元素（名称、符号、原子序数）"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="pt-clear" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <div className="pt-categories">
            {(Object.keys(categoryColors) as ElementCategory[]).map(cat => (
              <button
                key={cat}
                className={`pt-cat-btn ${filterCategory === cat ? 'active' : ''}`}
                style={{ '--cat-color': categoryColors[cat] } as React.CSSProperties}
                onClick={() => setFilterCategory(prev => prev === cat ? null : cat)}
              >
                <span className="cat-dot" />
                <Tooltip term={categoryNames[cat]}>
                  <span>{categoryNames[cat]}</span>
                </Tooltip>
              </button>
            ))}
          </div>
        </div>

        {/* 周期表 */}
        <div className="pt-grid-wrapper">
          <div className="pt-grid">
            {renderGrid()}
          </div>
        </div>
      </div>

      {/* 元素详情面板 */}
      {selectedElement && (
        <div className="pt-detail-overlay" onClick={() => setSelectedElement(null)}>
          <div className="pt-detail" onClick={e => e.stopPropagation()}>
            <button className="pt-detail-close" onClick={() => setSelectedElement(null)}>
              <X size={20} />
            </button>

            <div className="detail-header" style={{ background: `${categoryColors[selectedElement.category]}22` }}>
              <div className="detail-number">{selectedElement.number}</div>
              <div className="detail-symbol" style={{ color: categoryColors[selectedElement.category] }}>
                {selectedElement.symbol}
              </div>
              <div className="detail-names">
                <span className="detail-cn">{selectedElement.name}</span>
                <span className="detail-en">{selectedElement.nameEn}</span>
              </div>
              <div className="detail-category" style={{ background: categoryColors[selectedElement.category] }}>
                {getCategoryEmoji(selectedElement.category)} {categoryNames[selectedElement.category]}
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-section">
                <h3><Info size={16} /> 基本信息</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="item-label">
                      <Tooltip term="原子量">原子量</Tooltip>
                    </span>
                    <span className="item-value">{selectedElement.atomicMass} u</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">
                      <Tooltip term="电子构型">电子构型</Tooltip>
                    </span>
                    <span className="item-value mono">{selectedElement.electronConfig}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">
                      <Tooltip term="周期">周期</Tooltip>
                    </span>
                    <span className="item-value">{selectedElement.period}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">
                      <Tooltip term="族">族</Tooltip>
                    </span>
                    <span className="item-value">{selectedElement.group}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">
                      <Tooltip term="区">区</Tooltip>
                    </span>
                    <span className="item-value">{selectedElement.block}-区 {getBlockIcon(selectedElement.block)}</span>
                  </div>
                  {selectedElement.electronegativity && (
                    <div className="detail-item">
                      <span className="item-label">
                        <Tooltip term="电负性">电负性</Tooltip>
                      </span>
                      <span className="item-value">{selectedElement.electronegativity}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3><Beaker size={16} /> 物理性质</h3>
                <div className="detail-grid">
                  {selectedElement.density !== undefined && selectedElement.density > 0 && (
                    <div className="detail-item">
                      <span className="item-label">
                        <Tooltip term="密度">密度</Tooltip>
                      </span>
                      <span className="item-value">{selectedElement.density} g/cm³</span>
                    </div>
                  )}
                  {selectedElement.meltingPoint !== undefined && selectedElement.meltingPoint > -300 && (
                    <div className="detail-item">
                      <span className="item-label">
                        <Tooltip term="熔点">熔点</Tooltip>
                      </span>
                      <span className="item-value">{selectedElement.meltingPoint}°C</span>
                    </div>
                  )}
                  {selectedElement.boilingPoint !== undefined && selectedElement.boilingPoint > 0 && (
                    <div className="detail-item">
                      <span className="item-label">
                        <Tooltip term="沸点">沸点</Tooltip>
                      </span>
                      <span className="item-value">{selectedElement.boilingPoint}°C</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedElement.discoveredBy || selectedElement.yearDiscovered) && (
                <div className="detail-section">
                  <h3><Sparkles size={16} /> 发现历史</h3>
                  <div className="detail-grid">
                    {selectedElement.discoveredBy && (
                      <div className="detail-item">
                        <span className="item-label">发现者</span>
                        <span className="item-value">{selectedElement.discoveredBy}</span>
                      </div>
                    )}
                    {selectedElement.yearDiscovered && (
                      <div className="detail-item">
                        <span className="item-label">发现年份</span>
                        <span className="item-value">
                          {selectedElement.yearDiscovered < 0
                            ? `公元前 ${Math.abs(selectedElement.yearDiscovered)} 年`
                            : `${selectedElement.yearDiscovered} 年`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section fun-fact">
                <h3><Zap size={16} /> 趣味小知识</h3>
                <p>{selectedElement.funFact}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pt-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
        }

        .pt-toolbar {
          flex-shrink: 0;
          margin-bottom: 10px;
        }

        .pt-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 14px;
          margin-bottom: 10px;
        }

        .pt-search svg {
          color: var(--text-dim);
          flex-shrink: 0;
        }

        .pt-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }

        .pt-search input::placeholder {
          color: var(--text-dim);
        }

        .pt-clear {
          background: var(--bg-card-hover);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-dim);
        }

        .pt-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .pt-cat-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 16px;
          border: 1px solid var(--cat-color, #555);
          background: transparent;
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pt-cat-btn:hover {
          background: var(--cat-color);
          color: #fff;
        }

        .pt-cat-btn.active {
          background: var(--cat-color);
          color: #fff;
        }

        .cat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--cat-color);
        }

        .pt-cat-btn.active .cat-dot {
          background: #fff;
        }

        .pt-grid-wrapper {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          container-type: inline-size;
        }

        .pt-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          max-width: 1200px;
        }

        .periodic-row {
          display: grid;
          grid-template-columns: repeat(18, 1fr);
          gap: 2px;
          position: relative;
          z-index: 1;
        }

        .periodic-element {
          position: relative;
          aspect-ratio: 1;
          border-radius: 3px;
          border: 1px solid var(--el-color, #444);
          background: var(--el-color-alpha, #222);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s ease;
          padding: 1px;
          overflow: hidden;
          font-size: clamp(10px, 1.1cqi, 16px);
          color: var(--text);
        }

        .periodic-element.empty {
          border: none;
          background: transparent;
          cursor: default;
        }

        .periodic-element:not(.empty):hover {
          transform: scale(1.3);
          z-index: 20;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
          background: var(--el-color, #444);
          color: #fff;
          border-color: var(--el-color, #444);
        }

        .periodic-element.selected {
          transform: scale(1.2);
          z-index: 15;
          box-shadow: 0 0 0 2px var(--el-color, #444), 0 2px 12px rgba(0,0,0,0.2);
          background: var(--el-color, #444);
          color: #fff;
        }

        .periodic-element.dimmed {
          opacity: 0.15;
        }

        .element-number {
          font-size: 0.55em;
          position: absolute;
          top: 2px;
          left: 3px;
          opacity: 0.7;
          line-height: 1;
        }

        .element-symbol {
          font-size: 1em;
          font-weight: 700;
          font-family: 'Georgia', serif;
          line-height: 1;
        }

        .element-name {
          font-size: 0.5em;
          opacity: 0.8;
          line-height: 1;
        }

        .element-mass {
          font-size: 0.4em;
          opacity: 0.5;
          line-height: 1;
        }

        .periodic-separator {
          display: flex;
          gap: 24px;
          padding: 4px 0;
          font-size: 11px;
          color: var(--text-dim);
        }

        .separator-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: help;
        }

        /* Tooltip 样式 */
        .tooltip-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .tooltip-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: help;
          color: var(--text-dim);
          transition: color 0.2s;
        }

        .pt-cat-btn .tooltip-icon {
          color: inherit;
          opacity: 0.7;
        }

        .pt-cat-btn .tooltip-icon:hover {
          opacity: 1;
        }

        .tooltip-icon:hover {
          color: var(--accent, #6366f1);
        }

        .tooltip-content {
          display: none;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--text);
          white-space: normal;
          width: max-content;
          max-width: 260px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          pointer-events: none;
          font-weight: normal;
          text-transform: none;
          letter-spacing: normal;
        }

        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: var(--border);
        }

        .tooltip-icon:hover .tooltip-content {
          display: block;
        }

        /* Detail Modal */
        .pt-detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pt-detail {
          background: var(--bg-card);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          position: relative;
          animation: scaleIn 0.25s ease;
          border: 1px solid var(--border);
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .pt-detail-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--bg-card-hover);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text);
          z-index: 10;
        }

        .detail-header {
          padding: 24px;
          text-align: center;
          border-radius: 16px 16px 0 0;
          position: relative;
        }

        .detail-number {
          font-size: 14px;
          opacity: 0.6;
          color: var(--text);
        }

        .detail-symbol {
          font-size: 72px;
          font-weight: 700;
          font-family: 'Georgia', serif;
          line-height: 1;
          margin: 4px 0;
        }

        .detail-names {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
        }

        .detail-cn {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
        }

        .detail-en {
          font-size: 14px;
          color: var(--text-dim);
        }

        .detail-category {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          color: #fff;
          font-size: 12px;
        }

        .detail-body {
          padding: 20px 24px;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section h3 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-label {
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .item-value {
          font-size: 14px;
          color: var(--text);
          font-weight: 500;
        }

        .item-value.mono {
          font-family: 'SF Mono', 'Consolas', monospace;
          font-size: 12px;
        }

        .fun-fact p {
          background: var(--bg-input);
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
          margin: 0;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .pt-container {
            height: auto;
          }

          .pt-grid-wrapper {
            overflow-x: auto;
            justify-content: flex-start;
          }

          .pt-grid {
            min-width: 800px;
          }

          .periodic-element {
            font-size: 10px;
          }

          .element-mass {
            display: none;
          }

          .pt-categories {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
          }

          .detail-symbol {
            font-size: 56px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .tooltip-content {
            max-width: 200px;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
