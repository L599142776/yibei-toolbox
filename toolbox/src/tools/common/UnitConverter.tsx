// src/tools/common/UnitConverter.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

type UnitCategory = 'length' | 'weight' | 'temperature'

const unitData: Record<UnitCategory, { name: string; units: { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  length: {
    name: '长度',
    units: [
      { id: 'mm', label: '毫米', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'cm', label: '厘米', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'm', label: '米', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', label: '千米', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'in', label: '英寸', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', label: '英尺', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  weight: {
    name: '重量',
    units: [
      { id: 'mg', label: '毫克', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'g', label: '克', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'kg', label: '千克', toBase: (v) => v, fromBase: (v) => v },
      { id: 't', label: '吨', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'lb', label: '磅', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { id: 'oz', label: '盎司', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    ],
  },
  temperature: {
    name: '温度',
    units: [
      { id: 'c', label: '摄氏度 °C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: '华氏度 °F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: 'k', label: '开尔文 K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
}

export default function UnitConverter() {
  const [cat, setCat] = useState<UnitCategory>('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('km')
  const [inputVal, setInputVal] = useState('1')

  const data = unitData[cat]
  const from = data.units.find((u) => u.id === fromUnit)!
  const to = data.units.find((u) => u.id === toUnit)!

  const base = from.toBase(Number(inputVal) || 0)
  const result = to.fromBase(base)

  return (
    <ToolLayout title="单位转换" description="长度、重量、温度等常用单位换算">
      <div className="btn-group">
        {(Object.keys(unitData) as UnitCategory[]).map((k) => (
          <button key={k} className={`btn ${cat === k ? '' : 'btn-outline'}`} onClick={() => {
            setCat(k)
            setFromUnit(unitData[k].units[0].id)
            setToUnit(unitData[k].units[1].id)
          }}>
            {unitData[k].name}
          </button>
        ))}
      </div>
      <div className="tool-row">
        <input className="input" type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)} style={{ flex: 1 }} />
        <Select
          value={fromUnit}
          onChange={v => setFromUnit(v)}
          options={data.units.map(u => ({ value: u.id, label: u.label }))}
        />
      </div>
      <div style={{ textAlign: 'center', fontSize: 24, margin: '16px 0', color: 'var(--accent)' }}>↓</div>
      <div className="tool-row">
        <div className="tool-output" style={{ flex: 1, fontSize: 20, textAlign: 'center' }}>
          {Number.isFinite(result) ? result.toPrecision(10).replace(/\.?0+$/, '') : '—'}
        </div>
        <Select
          value={toUnit}
          onChange={v => setToUnit(v)}
          options={data.units.map(u => ({ value: u.id, label: u.label }))}
        />
      </div>
    </ToolLayout>
  )
}
