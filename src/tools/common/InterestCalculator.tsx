import { useState } from 'react'
import { Calculator, TrendingUp, Banknote } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type CalcMode = 'deposit' | 'loan'

interface DepositResult {
  totalInterest: number
  totalAmount: number
}

interface LoanResult {
  totalInterest: number
  totalPayment: number
  monthlyPayment: number
}

export default function InterestCalculator() {
  const [mode, setMode] = useState<CalcMode>('deposit')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [years, setYears] = useState('')
  const [result, setResult] = useState<DepositResult | LoanResult | null>(null)

  const calculate = () => {
    const p = parseFloat(principal)
    const r = parseFloat(rate) / 100
    const y = parseFloat(years)

    if (isNaN(p) || isNaN(r) || isNaN(y)) {
      setResult(null)
      return
    }

    if (mode === 'deposit') {
      const totalInterest = p * r * y
      const totalAmount = p + totalInterest
      setResult({ totalInterest, totalAmount })
    } else {
      const monthlyRate = r / 12
      const months = y * 12
      if (monthlyRate === 0) {
        setResult({
          totalInterest: 0,
          totalPayment: p,
          monthlyPayment: p / months,
        })
        return
      }
      const factor = Math.pow(1 + monthlyRate, months)
      const monthlyPayment = (p * monthlyRate * factor) / (factor - 1)
      const totalPayment = monthlyPayment * months
      const totalInterest = totalPayment - p
      setResult({ totalInterest, totalPayment, monthlyPayment })
    }
  }

  return (
    <ToolLayout
      title="利息计算器"
      description="计算存款利息和贷款月供，支持定期存款和等额本息贷款"
    >
      <div className="btn-group" style={{ marginBottom: 16 }}>
        <button
          className={`btn ${mode === 'deposit' ? '' : 'btn-outline'}`}
          onClick={() => { setMode('deposit'); setResult(null) }}
        >
          <Banknote size={16} /> 存款利息
        </button>
        <button
          className={`btn ${mode === 'loan' ? '' : 'btn-outline'}`}
          onClick={() => { setMode('loan'); setResult(null) }}
        >
          <TrendingUp size={16} /> 贷款月供
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            {mode === 'deposit' ? '存款本金 (元)' : '贷款金额 (元)'}
          </label>
          <input
            type="number"
            className="input"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder={mode === 'deposit' ? '例如: 100000' : '例如: 500000'}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            年利率 (%)
          </label>
          <input
            type="number"
            className="input"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="例如: 3.5"
            step="0.01"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            存期/贷款期限 (年)
          </label>
          <input
            type="number"
            className="input"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="例如: 1"
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn" onClick={calculate} style={{ marginTop: 8 }}>
          <Calculator size={16} /> 计算
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          {mode === 'deposit' ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="result-item">
                <span className="result-label">到期利息</span>
                <span className="result-value">{(result as DepositResult).totalInterest.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</span>
              </div>
              <div className="result-item">
                <span className="result-label">到期本息合计</span>
                <span className="result-value">{(result as DepositResult).totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="result-item">
                <span className="result-label">每月月供</span>
                <span className="result-value">{(result as LoanResult).monthlyPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</span>
              </div>
              <div className="result-item">
                <span className="result-label">还款总额</span>
                <span className="result-value">{(result as LoanResult).totalPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</span>
              </div>
              <div className="result-item">
                <span className="result-label">利息总额</span>
                <span className="result-value">{(result as LoanResult).totalInterest.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="tool-tip" style={{ marginTop: 20 }}>
        <strong>说明：</strong>
        <br />• 存款：按简单利息计算（本金 × 年利率 × 存期）
        <br />• 贷款：按等额本息方式计算（月供固定）
        <br />• 实际银行利率可能有微小差异，请以银行计算为准
      </div>
    </ToolLayout>
  )
}
