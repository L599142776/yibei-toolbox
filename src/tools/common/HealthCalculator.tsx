import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { Activity, Heart, Scale, Flame, Calculator } from 'lucide-react'

type TabId = 'bmi' | 'bodyFat' | 'bmr' | 'idealWeight'

interface Tab {
  id: TabId
  name: string
  icon: React.ReactNode
  description: string
}

const TABS: Tab[] = [
  { id: 'bmi', name: 'BMI', icon: <Scale size={18} />, description: '身体质量指数' },
  { id: 'bodyFat', name: '体脂率', icon: <Activity size={18} />, description: '体脂百分比' },
  { id: 'bmr', name: '基础代谢', icon: <Flame size={18} />, description: '每日热量消耗' },
  { id: 'idealWeight', name: '理想体重', icon: <Heart size={18} />, description: '健康体重范围' },
]

// BMI 计算
function BMICalculator() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<{ bmi: number; category: string; color: string; range: string } | null>(null)

  const calculate = () => {
    const h = parseFloat(height) / 100 // 转换为米
    const w = parseFloat(weight)
    if (h <= 0 || w <= 0) return

    const bmi = w / (h * h)
    let category = ''
    let color = ''
    let range = ''

    if (bmi < 18.5) {
      category = '偏瘦'
      color = '#3b82f6'
      range = '< 18.5'
    } else if (bmi < 24) {
      category = '正常'
      color = '#22c55e'
      range = '18.5 - 24'
    } else if (bmi < 28) {
      category = '偏胖'
      color = '#f59e0b'
      range = '24 - 28'
    } else {
      category = '肥胖'
      color = '#ef4444'
      range = '≥ 28'
    }

    setResult({ bmi, category, color, range })
  }

  return (
    <div className="hc-calc-section">
      <div className="hc-input-group">
        <div className="hc-input-item">
          <label className="hc-label">身高 (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="170"
            className="hc-input"
          />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">体重 (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="65"
            className="hc-input"
          />
        </div>
      </div>
      <button className="btn btn-primary" onClick={calculate} disabled={!height || !weight}>
        <Calculator size={18} /> 计算 BMI
      </button>

      {result && (
        <div className="hc-result">
          <div className="hc-result-header">
            <span className="hc-result-label">BMI 指数</span>
            <span className="hc-result-value" style={{ color: result.color }}>{result.bmi.toFixed(1)}</span>
          </div>
          <div className="hc-result-category" style={{ color: result.color, background: `${result.color}15` }}>
            {result.category}
          </div>
          <div className="hc-result-info">
            <div className="hc-info-row">
              <span>参考范围</span>
              <span>{result.range}</span>
            </div>
            <div className="hc-info-row">
              <span>健康建议</span>
              <span>{result.bmi < 18.5 ? '建议适当增加营养' : result.bmi < 24 ? '请继续保持' : result.bmi < 28 ? '建议控制饮食，增加运动' : '建议咨询医生，制定减重计划'}</span>
            </div>
          </div>
          <div className="hc-bmi-scale">
            <div className="hc-scale-bar">
              <div className="hc-scale-segment" style={{ background: '#3b82f6', flex: 18.5 }}>
                <span className="hc-scale-label">偏瘦</span>
              </div>
              <div className="hc-scale-segment" style={{ background: '#22c55e', flex: 5.5 }}>
                <span className="hc-scale-label">正常</span>
              </div>
              <div className="hc-scale-segment" style={{ background: '#f59e0b', flex: 4 }}>
                <span className="hc-scale-label">偏胖</span>
              </div>
              <div className="hc-scale-segment" style={{ background: '#ef4444', flex: 12 }}>
                <span className="hc-scale-label">肥胖</span>
              </div>
            </div>
            <div className="hc-scale-pointer" style={{ left: `${Math.min(Math.max((result.bmi - 10) / 30 * 100, 0), 100)}%` }}>
              <div className="hc-pointer-arrow" />
              <span className="hc-pointer-value">{result.bmi.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="hc-reference">
        <h4 className="hc-ref-title">BMI 分类标准（中国）</h4>
        <div className="hc-ref-table">
          <div className="hc-ref-row">
            <span className="hc-ref-category">偏瘦</span>
            <span className="hc-ref-range">&lt; 18.5</span>
          </div>
          <div className="hc-ref-row">
            <span className="hc-ref-category">正常</span>
            <span className="hc-ref-range">18.5 - 23.9</span>
          </div>
          <div className="hc-ref-row">
            <span className="hc-ref-category">偏胖</span>
            <span className="hc-ref-range">24 - 27.9</span>
          </div>
          <div className="hc-ref-row">
            <span className="hc-ref-category">肥胖</span>
            <span className="hc-ref-range">≥ 28</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 体脂率计算器
function BodyFatCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hip, setHip] = useState('')
  const [result, setResult] = useState<{ bodyFat: number; category: string; color: string } | null>(null)

  // 美国海军法计算体脂率
  const calculate = () => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const a = parseFloat(age)
    const waistCm = parseFloat(waist)
    const neckCm = parseFloat(neck)
    const hipCm = parseFloat(hip)

    if (h <= 0 || w <= 0 || a <= 0 || waistCm <= 0 || neckCm <= 0) return

    let bodyFat = 0
    if (gender === 'male') {
      // 男性：体脂% = 86.010 × log10(腰围 - 颈围) - 70.041 × log10(身高) + 36.76
      bodyFat = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(h) + 36.76
    } else {
      // 女性：体脂% = 163.205 × log10(腰围 + 臀围 - 颈围) - 97.684 × log10(身高) - 78.387
      if (hipCm <= 0) return
      bodyFat = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(h) - 78.387
    }

    let category = ''
    let color = ''

    if (gender === 'male') {
      if (bodyFat < 6) { category = '必需脂肪'; color = '#3b82f6' }
      else if (bodyFat < 14) { category = '运动员'; color = '#22c55e' }
      else if (bodyFat < 18) { category = '健康'; color = '#22c55e' }
      else if (bodyFat < 25) { category = '可接受'; color = '#f59e0b' }
      else { category = '肥胖'; color = '#ef4444' }
    } else {
      if (bodyFat < 14) { category = '必需脂肪'; color = '#3b82f6' }
      else if (bodyFat < 21) { category = '运动员'; color = '#22c55e' }
      else if (bodyFat < 25) { category = '健康'; color = '#22c55e' }
      else if (bodyFat < 32) { category = '可接受'; color = '#f59e0b' }
      else { category = '肥胖'; color = '#ef4444' }
    }

    setResult({ bodyFat, category, color })
  }

  return (
    <div className="hc-calc-section">
      <div className="hc-gender-select">
        <button
          className={`hc-gender-btn${gender === 'male' ? ' active' : ''}`}
          onClick={() => { setGender('male'); setResult(null) }}
        >
          👨 男性
        </button>
        <button
          className={`hc-gender-btn${gender === 'female' ? ' active' : ''}`}
          onClick={() => { setGender('female'); setResult(null) }}
        >
          👩 女性
        </button>
      </div>

      <div className="hc-input-group">
        <div className="hc-input-item">
          <label className="hc-label">身高 (cm)</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="hc-input" />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">体重 (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className="hc-input" />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">年龄</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="hc-input" />
        </div>
      </div>

      <div className="hc-input-group">
        <div className="hc-input-item">
          <label className="hc-label">颈围 (cm)</label>
          <input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="37" className="hc-input" />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">腰围 (cm)</label>
          <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="80" className="hc-input" />
        </div>
        {gender === 'female' && (
          <div className="hc-input-item">
            <label className="hc-label">臀围 (cm)</label>
            <input type="number" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="95" className="hc-input" />
          </div>
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={calculate}
        disabled={!height || !weight || !age || !waist || !neck || (gender === 'female' && !hip)}
      >
        <Calculator size={18} /> 计算体脂率
      </button>

      {result && (
        <div className="hc-result">
          <div className="hc-result-header">
            <span className="hc-result-label">体脂率</span>
            <span className="hc-result-value" style={{ color: result.color }}>{result.bodyFat.toFixed(1)}%</span>
          </div>
          <div className="hc-result-category" style={{ color: result.color, background: `${result.color}15` }}>
            {result.category}
          </div>
          <div className="hc-result-info">
            <div className="hc-info-row">
              <span>脂肪重量</span>
              <span>{(parseFloat(weight) * result.bodyFat / 100).toFixed(1)} kg</span>
            </div>
            <div className="hc-info-row">
              <span>瘦体重</span>
              <span>{(parseFloat(weight) * (100 - result.bodyFat) / 100).toFixed(1)} kg</span>
            </div>
          </div>
        </div>
      )}

      <div className="hc-reference">
        <h4 className="hc-ref-title">体脂率分类标准</h4>
        <div className="hc-ref-table">
          <div className="hc-ref-row hc-ref-header">
            <span>分类</span>
            <span>男性</span>
            <span>女性</span>
          </div>
          <div className="hc-ref-row">
            <span>必需脂肪</span>
            <span>2-5%</span>
            <span>10-13%</span>
          </div>
          <div className="hc-ref-row">
            <span>运动员</span>
            <span>6-13%</span>
            <span>14-20%</span>
          </div>
          <div className="hc-ref-row">
            <span>健康</span>
            <span>14-17%</span>
            <span>21-24%</span>
          </div>
          <div className="hc-ref-row">
            <span>可接受</span>
            <span>18-24%</span>
            <span>25-31%</span>
          </div>
          <div className="hc-ref-row">
            <span>肥胖</span>
            <span>25%+</span>
            <span>32%+</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 基础代谢率计算器
function BMRCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [activity, setActivity] = useState('1.2')
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null)

  // Mifflin-St Jeor 公式
  const calculate = () => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const a = parseFloat(age)
    if (h <= 0 || w <= 0 || a <= 0) return

    let bmr = 0
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161
    }

    const tdee = bmr * parseFloat(activity)
    setResult({ bmr, tdee })
  }

  const activityLevels = [
    { value: '1.2', label: '久坐不动', desc: '办公室工作，很少运动' },
    { value: '1.375', label: '轻度活动', desc: '每周运动 1-3 次' },
    { value: '1.55', label: '中度活动', desc: '每周运动 3-5 次' },
    { value: '1.725', label: '高度活动', desc: '每周运动 6-7 次' },
    { value: '1.9', label: '极高活动', desc: '体力劳动或高强度训练' },
  ]

  return (
    <div className="hc-calc-section">
      <div className="hc-gender-select">
        <button
          className={`hc-gender-btn${gender === 'male' ? ' active' : ''}`}
          onClick={() => { setGender('male'); setResult(null) }}
        >
          👨 男性
        </button>
        <button
          className={`hc-gender-btn${gender === 'female' ? ' active' : ''}`}
          onClick={() => { setGender('female'); setResult(null) }}
        >
          👩 女性
        </button>
      </div>

      <div className="hc-input-group">
        <div className="hc-input-item">
          <label className="hc-label">身高 (cm)</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="hc-input" />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">体重 (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className="hc-input" />
        </div>
        <div className="hc-input-item">
          <label className="hc-label">年龄</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="hc-input" />
        </div>
      </div>

      <div className="hc-activity-section">
        <label className="hc-label">活动水平</label>
        <div className="hc-activity-options">
          {activityLevels.map((level) => (
            <label key={level.value} className={`hc-activity-option${activity === level.value ? ' active' : ''}`}>
              <input
                type="radio"
                name="activity"
                value={level.value}
                checked={activity === level.value}
                onChange={(e) => setActivity(e.target.value)}
              />
              <div className="hc-activity-content">
                <span className="hc-activity-label">{level.label}</span>
                <span className="hc-activity-desc">{level.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={calculate} disabled={!height || !weight || !age}>
        <Calculator size={18} /> 计算基础代谢
      </button>

      {result && (
        <div className="hc-result">
          <div className="hc-result-row">
            <div className="hc-result-card">
              <span className="hc-card-label">基础代谢率 (BMR)</span>
              <span className="hc-card-value">{Math.round(result.bmr)} <small>kcal/天</small></span>
              <span className="hc-card-desc">静息状态下消耗的热量</span>
            </div>
            <div className="hc-result-card hc-card-highlight">
              <span className="hc-card-label">每日总消耗 (TDEE)</span>
              <span className="hc-card-value">{Math.round(result.tdee)} <small>kcal/天</small></span>
              <span className="hc-card-desc">包含活动消耗的总热量</span>
            </div>
          </div>
          <div className="hc-result-info">
            <div className="hc-info-row">
              <span>减脂摄入（-20%）</span>
              <span>{Math.round(result.tdee * 0.8)} kcal/天</span>
            </div>
            <div className="hc-info-row">
              <span>维持体重</span>
              <span>{Math.round(result.tdee)} kcal/天</span>
            </div>
            <div className="hc-info-row">
              <span>增肌摄入（+20%）</span>
              <span>{Math.round(result.tdee * 1.2)} kcal/天</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 理想体重计算器
function IdealWeightCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState<{ ideal: number; range: [number, number]; methods: { name: string; value: number }[] } | null>(null)

  const calculate = () => {
    const h = parseFloat(height)
    if (h <= 0) return

    // BMI 法 (BMI 18.5-24)
    const bmiMin = 18.5 * (h / 100) * (h / 100)
    const bmiMax = 24 * (h / 100) * (h / 100)

    // Devine 公式
    const devine = gender === 'male'
      ? 50 + 2.3 * (h / 2.54 - 60)
      : 45.5 + 2.3 * (h / 2.54 - 60)

    // Robinson 公式
    const robinson = gender === 'male'
      ? 52 + 1.9 * (h / 2.54 - 60)
      : 49 + 1.7 * (h / 2.54 - 60)

    // Miller 公式
    const miller = gender === 'male'
      ? 56.2 + 1.41 * (h / 2.54 - 60)
      : 53.1 + 1.36 * (h / 2.54 - 60)

    const methods = [
      { name: 'Devine 公式', value: devine },
      { name: 'Robinson 公式', value: robinson },
      { name: 'Miller 公式', value: miller },
    ]

    const ideal = (devine + robinson + miller) / 3

    setResult({
      ideal,
      range: [Math.round(bmiMin), Math.round(bmiMax)],
      methods,
    })
  }

  return (
    <div className="hc-calc-section">
      <div className="hc-gender-select">
        <button
          className={`hc-gender-btn${gender === 'male' ? ' active' : ''}`}
          onClick={() => { setGender('male'); setResult(null) }}
        >
          👨 男性
        </button>
        <button
          className={`hc-gender-btn${gender === 'female' ? ' active' : ''}`}
          onClick={() => { setGender('female'); setResult(null) }}
        >
          👩 女性
        </button>
      </div>

      <div className="hc-input-group hc-input-single">
        <div className="hc-input-item">
          <label className="hc-label">身高 (cm)</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="hc-input" />
        </div>
      </div>

      <button className="btn btn-primary" onClick={calculate} disabled={!height}>
        <Calculator size={18} /> 计算理想体重
      </button>

      {result && (
        <div className="hc-result">
          <div className="hc-result-header">
            <span className="hc-result-label">理想体重</span>
            <span className="hc-result-value">{result.ideal.toFixed(1)} kg</span>
          </div>
          <div className="hc-result-info">
            <div className="hc-info-row">
              <span>健康体重范围（BMI 法）</span>
              <span>{result.range[0]} - {result.range[1]} kg</span>
            </div>
            {result.methods.map((m) => (
              <div key={m.name} className="hc-info-row">
                <span>{m.name}</span>
                <span>{m.value.toFixed(1)} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hc-reference">
        <h4 className="hc-ref-title">说明</h4>
        <p className="hc-ref-text">
          理想体重仅供参考，实际健康体重因人而异，受肌肉量、骨骼密度、年龄等因素影响。
          建议结合 BMI、体脂率等指标综合评估。
        </p>
      </div>
    </div>
  )
}

export default function HealthCalculator() {
  const [activeTab, setActiveTab] = useState<TabId>('bmi')

  const renderContent = () => {
    switch (activeTab) {
      case 'bmi': return <BMICalculator />
      case 'bodyFat': return <BodyFatCalculator />
      case 'bmr': return <BMRCalculator />
      case 'idealWeight': return <IdealWeightCalculator />
    }
  }

  return (
    <ToolLayout
      title="健康计算器"
      description="BMI、体脂率、基础代谢、理想体重等健康指标计算"
    >
      <div className="hc-inner">
        {/* 标签页 */}
        <div className="hc-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`hc-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="hc-tab-icon">{tab.icon}</span>
              <span className="hc-tab-name">{tab.name}</span>
              <span className="hc-tab-desc">{tab.description}</span>
            </button>
          ))}
        </div>

        {/* 内容区 */}
        {renderContent()}
      </div>

      <style>{`
        .hc-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hc-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .hc-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
        }

        .hc-tab:hover {
          background: var(--bg-hover);
        }

        .hc-tab.active {
          background: var(--primary);
          color: white;
        }

        .hc-tab-icon {
          display: flex;
          align-items: center;
        }

        .hc-tab-name {
          font-size: 14px;
          font-weight: 600;
        }

        .hc-tab-desc {
          font-size: 11px;
          opacity: 0.8;
        }

        .hc-calc-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hc-gender-select {
          display: flex;
          gap: 12px;
        }

        .hc-gender-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .hc-gender-btn:hover {
          border-color: var(--primary);
        }

        .hc-gender-btn.active {
          border-color: var(--primary);
          background: var(--primary-subtle);
          color: var(--primary);
        }

        .hc-input-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .hc-input-single {
          grid-template-columns: 1fr;
          max-width: 200px;
        }

        .hc-input-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hc-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .hc-input {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 15px;
        }

        .hc-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .hc-activity-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hc-activity-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hc-activity-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hc-activity-option input {
          display: none;
        }

        .hc-activity-option:hover {
          border-color: var(--primary);
        }

        .hc-activity-option.active {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .hc-activity-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hc-activity-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .hc-activity-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hc-result {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          animation: hcFadeIn 0.3s ease;
        }

        @keyframes hcFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hc-result-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
        }

        .hc-result-label {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .hc-result-value {
          font-size: 32px;
          font-weight: 700;
        }

        .hc-result-category {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .hc-result-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .hc-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .hc-info-row span:first-child {
          color: var(--text-secondary);
        }

        .hc-info-row span:last-child {
          font-weight: 500;
          color: var(--text);
        }

        .hc-result-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .hc-result-card {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          text-align: center;
        }

        .hc-card-highlight {
          background: var(--primary-subtle);
          border-color: var(--primary);
        }

        .hc-card-label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .hc-card-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }

        .hc-card-value small {
          font-size: 12px;
          font-weight: normal;
          color: var(--text-secondary);
        }

        .hc-card-desc {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .hc-bmi-scale {
          margin-top: 20px;
          position: relative;
        }

        .hc-scale-bar {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
        }

        .hc-scale-segment {
          position: relative;
        }

        .hc-scale-label {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .hc-scale-pointer {
          position: absolute;
          top: -8px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hc-pointer-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--primary);
        }

        .hc-pointer-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary);
          margin-top: 4px;
        }

        .hc-reference {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
        }

        .hc-ref-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .hc-ref-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hc-ref-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 8px 12px;
          background: var(--bg);
          border-radius: 6px;
        }

        .hc-ref-header {
          font-weight: 600;
          background: var(--bg-tertiary);
        }

        .hc-ref-category {
          color: var(--text);
        }

        .hc-ref-range {
          color: var(--text-secondary);
          font-family: monospace;
        }

        .hc-ref-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          .hc-tabs {
            grid-template-columns: repeat(2, 1fr);
          }

          .hc-tab-desc {
            display: none;
          }

          .hc-result-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
