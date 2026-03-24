import { useState, useMemo } from 'react'
import { Copy, Check, Building2, CreditCard, ShieldCheck } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

interface BankInfo {
  name: string
  nameEn: string
  color: string
  cardType: '储蓄卡' | '信用卡' | '借记卡' | '预付费卡'
  cardBrand: '银联' | 'Visa' | 'MasterCard' | 'JCB' | 'American Express' | '其他'
}

type BinDatabase = Record<string, BankInfo>

const binDatabase: BinDatabase = {
  '620058': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621558': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621559': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621561': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '622202': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '622203': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '622208': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '借记卡', cardBrand: '银联' },
  '455880': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: 'Visa' },
  '524091': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: 'MasterCard' },
  '622230': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '622231': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '625330': { name: '工商银行', nameEn: 'ICBC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '620062': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '621700': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '621773': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622280': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622700': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '436742': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '信用卡', cardBrand: 'Visa' },
  '532458': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '信用卡', cardBrand: 'MasterCard' },
  '622166': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '625964': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '625965': { name: '建设银行', nameEn: 'CCB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '620013': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '储蓄卡', cardBrand: '银联' },
  '622848': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '储蓄卡', cardBrand: '银联' },
  '622849': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '储蓄卡', cardBrand: '银联' },
  '623052': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '储蓄卡', cardBrand: '银联' },
  '955950': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '信用卡', cardBrand: '银联' },
  '625996': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '信用卡', cardBrand: '银联' },
  '625998': { name: '农业银行', nameEn: 'ABC', color: '#228b22', cardType: '信用卡', cardBrand: '银联' },
  '620025': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621660': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621661': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621662': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '621788': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '储蓄卡', cardBrand: '银联' },
  '625333': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '625337': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '625338': { name: '中国银行', nameEn: 'BOC', color: '#c41e3a', cardType: '信用卡', cardBrand: '银联' },
  '621286': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622588': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622609': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '402658': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: 'Visa' },
  '439227': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: 'Visa' },
  '518710': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: 'MasterCard' },
  '625802': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '625803': { name: '招商银行', nameEn: 'CMB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '620021': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622260': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622261': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '522964': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '信用卡', cardBrand: 'MasterCard' },
  '625028': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '625505': { name: '交通银行', nameEn: 'BCM', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '621098': { name: '邮储银行', nameEn: 'PSBC', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622150': { name: '邮储银行', nameEn: 'PSBC', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622151': { name: '邮储银行', nameEn: 'PSBC', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622188': { name: '邮储银行', nameEn: 'PSBC', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '625919': { name: '邮储银行', nameEn: 'PSBC', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '622908': { name: '兴业银行', nameEn: 'CIB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '438600': { name: '兴业银行', nameEn: 'CIB', color: '#003399', cardType: '信用卡', cardBrand: 'Visa' },
  '524070': { name: '兴业银行', nameEn: 'CIB', color: '#003399', cardType: '信用卡', cardBrand: 'MasterCard' },
  '625086': { name: '兴业银行', nameEn: 'CIB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '621352': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '621793': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '621795': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '843900': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '622500': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '625970': { name: '浦发银行', nameEn: 'SPDB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '620015': { name: '民生银行', nameEn: 'CMBC', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '621691': { name: '民生银行', nameEn: 'CMBC', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '622622': { name: '民生银行', nameEn: 'CMBC', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '545619': { name: '民生银行', nameEn: 'CMBC', color: '#003366', cardType: '信用卡', cardBrand: 'MasterCard' },
  '625911': { name: '民生银行', nameEn: 'CMBC', color: '#003366', cardType: '信用卡', cardBrand: '银联' },
  '622298': { name: '平安银行', nameEn: 'PAB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622525': { name: '平安银行', nameEn: 'PAB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '998866': { name: '平安银行', nameEn: 'PAB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '625360': { name: '平安银行', nameEn: 'PAB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '625361': { name: '平安银行', nameEn: 'PAB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '620018': { name: '中信银行', nameEn: 'CITIC', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '621960': { name: '中信银行', nameEn: 'CITIC', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622690': { name: '中信银行', nameEn: 'CITIC', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '376968': { name: '中信银行', nameEn: 'CITIC', color: '#cc0000', cardType: '信用卡', cardBrand: 'American Express' },
  '625910': { name: '中信银行', nameEn: 'CITIC', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '620535': { name: '光大银行', nameEn: 'CEB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '620660': { name: '光大银行', nameEn: 'CEB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '622661': { name: '光大银行', nameEn: 'CEB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '625678': { name: '光大银行', nameEn: 'CEB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '625680': { name: '光大银行', nameEn: 'CEB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
  '622637': { name: '华夏银行', nameEn: 'HXB', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '623021': { name: '华夏银行', nameEn: 'HXB', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '625967': { name: '华夏银行', nameEn: 'HXB', color: '#003366', cardType: '信用卡', cardBrand: '银联' },
  '620037': { name: '广发银行', nameEn: 'CGB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '528931': { name: '广发银行', nameEn: 'CGB', color: '#cc0000', cardType: '信用卡', cardBrand: 'MasterCard' },
  '625809': { name: '广发银行', nameEn: 'CGB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '621268': { name: '渤海银行', nameEn: 'CBHB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '622884': { name: '渤海银行', nameEn: 'CBHB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '622309': { name: '浙商银行', nameEn: 'CZB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '625021': { name: '浙商银行', nameEn: 'CZB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '623078': { name: '恒丰银行', nameEn: 'EGB', color: '#003366', cardType: '储蓄卡', cardBrand: '银联' },
  '1568': { name: '支付宝', nameEn: 'Alipay', color: '#1677ff', cardType: '预付费卡', cardBrand: '银联' },
  '1588': { name: '支付宝', nameEn: 'Alipay', color: '#1677ff', cardType: '预付费卡', cardBrand: '银联' },
  '1567': { name: '微信支付', nameEn: 'WeChat Pay', color: '#07c160', cardType: '预付费卡', cardBrand: '银联' },
  '1589': { name: '微信支付', nameEn: 'WeChat Pay', color: '#07c160', cardType: '预付费卡', cardBrand: '银联' },
  '620060': { name: '北京银行', nameEn: 'BOB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622163': { name: '北京银行', nameEn: 'BOB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '625908': { name: '北京银行', nameEn: 'BOB', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '621000': { name: '上海银行', nameEn: 'BOS', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622892': { name: '上海银行', nameEn: 'BOS', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '625099': { name: '上海银行', nameEn: 'BOS', color: '#cc0000', cardType: '信用卡', cardBrand: '银联' },
  '621576': { name: '江苏银行', nameEn: 'JSB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '622173': { name: '江苏银行', nameEn: 'JSB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '625902': { name: '江苏银行', nameEn: 'JSB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '623091': { name: '浙江稠州银行', nameEn: 'CZCB', color: '#cc0000', cardType: '储蓄卡', cardBrand: '银联' },
  '622281': { name: '宁波银行', nameEn: 'NBCB', color: '#0066b3', cardType: '储蓄卡', cardBrand: '银联' },
  '625605': { name: '宁波银行', nameEn: 'NBCB', color: '#0066b3', cardType: '信用卡', cardBrand: '银联' },
  '621287': { name: '杭州银行', nameEn: 'HZB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '622397': { name: '杭州银行', nameEn: 'HZB', color: '#003399', cardType: '储蓄卡', cardBrand: '银联' },
  '625098': { name: '杭州银行', nameEn: 'HZB', color: '#003399', cardType: '信用卡', cardBrand: '银联' },
}

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

function detectCardBrand(cardNumber: string): BankInfo['cardBrand'] {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.startsWith('4')) return 'Visa'
  if (digits.startsWith('5') && parseInt(digits[1]) >= 1 && parseInt(digits[1]) <= 5) return 'MasterCard'
  if (digits.startsWith('35')) return 'JCB'
  if (digits.startsWith('34') || digits.startsWith('37')) return 'American Express'
  if (digits.startsWith('62') || digits.startsWith('60')) return '银联'
  return '其他'
}

function lookupBank(bin: string): BankInfo | null {
  if (binDatabase[bin]) return binDatabase[bin]
  if (bin.length >= 5 && binDatabase[bin.slice(0, 5)]) return binDatabase[bin.slice(0, 5)]
  if (bin.length >= 4 && binDatabase[bin.slice(0, 4)]) return binDatabase[bin.slice(0, 4)]
  return null
}

const CardBrandIcon = ({ brand }: { brand: BankInfo['cardBrand'] }) => {
  const brandStyles: Record<BankInfo['cardBrand'], { bg: string; color: string; text: string }> = {
    '银联': { bg: '#cc0000', color: '#fff', text: 'UP' },
    'Visa': { bg: '#1a1f71', color: '#fff', text: 'VISA' },
    'MasterCard': { bg: '#eb001b', color: '#fff', text: 'MC' },
    'JCB': { bg: '#cc0000', color: '#fff', text: 'JCB' },
    'American Express': { bg: '#006fcf', color: '#fff', text: 'AMEX' },
    '其他': { bg: '#666', color: '#fff', text: '?' },
  }

  const style = brandStyles[brand] || brandStyles['其他']

  return (
    <div className="bank-card-brand-badge" style={{ background: style.bg, color: style.color }}>
      {style.text}
    </div>
  )
}

const CardTypeBadge = ({ type }: { type: BankInfo['cardType'] }) => {
  const typeStyles: Record<BankInfo['cardType'], { bg: string; color: string }> = {
    '储蓄卡': { bg: '#e6f7ff', color: '#1677ff' },
    '信用卡': { bg: '#fff2e8', color: '#fa541c' },
    '借记卡': { bg: '#f6ffed', color: '#52c41a' },
    '预付费卡': { bg: '#fff7e6', color: '#fa8c16' },
  }

  const style = typeStyles[type]

  return (
    <span style={{ background: style.bg, color: style.color, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
      {type}
    </span>
  )
}

export default function BankCardLookup() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const digitsOnly = input.replace(/\D/g, '')

  const bankInfo = useMemo(() => {
    if (digitsOnly.length < 4) return null
    return lookupBank(digitsOnly.slice(0, 6))
  }, [digitsOnly])

  const isValidLuhn = useMemo(() => {
    if (digitsOnly.length < 13) return null
    return luhnCheck(digitsOnly)
  }, [digitsOnly])

  const detectedBrand = useMemo(() => {
    if (digitsOnly.length < 4) return '其他'
    return detectCardBrand(digitsOnly)
  }, [digitsOnly])

  const displayType = useMemo(() => {
    if (bankInfo) return bankInfo.cardType
    return '信用卡'
  }, [bankInfo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.replace(/\D/g, '').length <= 20) {
      setInput(value)
    }
  }

  const copyResult = () => {
    const text = bankInfo ? `${bankInfo.name} ${displayType} ${detectedBrand}` : ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout title="银行卡信息查询" description="输入银行卡号，查询发卡行信息和卡类型">
      <div className="tool-section">
        <label className="tool-label">银行卡号</label>
        <input
          type="text"
          className="tool-input bank-card-input"
          placeholder="请输入银行卡号 (4-20位)"
          value={input}
          onChange={handleInputChange}
          maxLength={23}
          autoComplete="off"
        />
        <div className="tool-hint">支持最多 20 位数字，自动格式化为每 4 位一组</div>
      </div>

      {digitsOnly.length >= 13 && (
        <div className={`luhn-result ${isValidLuhn ? 'valid' : 'invalid'}`}>
          <ShieldCheck size={18} />
          <span>{isValidLuhn ? '✓ Luhn 校验通过 (有效卡号)' : '✗ Luhn 校验失败 (无效卡号)'}</span>
        </div>
      )}

      {bankInfo && digitsOnly.length >= 4 && (
        <div className="bank-info-card" style={{ borderTopColor: bankInfo.color }}>
          <div className="bank-info-header">
            <div className="bank-info-icon" style={{ backgroundColor: bankInfo.color }}>
              <Building2 size={28} color="#fff" />
            </div>
            <div className="bank-info-title">
              <div className="bank-name">{bankInfo.name}</div>
              <div className="bank-name-en">{bankInfo.nameEn}</div>
            </div>
            <CardBrandIcon brand={bankInfo.cardBrand} />
          </div>

          <div className="bank-info-divider" />

          <div className="bank-info-details">
            <div className="bank-info-row">
              <span className="bank-info-label">卡类型</span>
              <CardTypeBadge type={bankInfo.cardType} />
            </div>
            <div className="bank-info-row">
              <span className="bank-info-label">卡组织</span>
              <span className="bank-info-value">{bankInfo.cardBrand}</span>
            </div>
            <div className="bank-info-row">
              <span className="bank-info-label">BIN</span>
              <span className="bank-info-value bank-bin">{digitsOnly.slice(0, 6)}</span>
            </div>
          </div>

          <button className="btn btn-outline copy-btn" onClick={copyResult}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制信息'}
          </button>
        </div>
      )}

      {!bankInfo && digitsOnly.length >= 6 && (
        <div className="bank-info-card unknown">
          <div className="bank-info-header">
            <div className="bank-info-icon" style={{ backgroundColor: '#999' }}>
              <CreditCard size={28} color="#fff" />
            </div>
            <div className="bank-info-title">
              <div className="bank-name">未知银行</div>
              <div className="bank-name-en">Unknown Bank</div>
            </div>
            <CardBrandIcon brand={detectedBrand} />
          </div>

          <div className="bank-info-divider" />

          <div className="bank-info-details">
            <div className="bank-info-row">
              <span className="bank-info-label">卡类型</span>
              <CardTypeBadge type={displayType} />
            </div>
            <div className="bank-info-row">
              <span className="bank-info-label">卡组织</span>
              <span className="bank-info-value">{detectedBrand}</span>
            </div>
            <div className="bank-info-row">
              <span className="bank-info-label">BIN</span>
              <span className="bank-info-value bank-bin">{digitsOnly.slice(0, 6)}</span>
            </div>
          </div>

          <p className="tool-hint" style={{ marginTop: 12, textAlign: 'center' }}>
            该 BIN 未收录，可能是地方性银行或新发行卡种
          </p>
        </div>
      )}

      {digitsOnly.length >= 4 && (
        <div className="bin-preview">
          <span className="bin-label">BIN 预览:</span>
          <span className="bin-value">
            {digitsOnly.slice(0, 4)}
            <span className="bin-mask">**</span>
            <span className="bin-mask">**</span>
          </span>
          <span className="bin-remaining">
            {digitsOnly.length > 6 ? `剩余 ${digitsOnly.length - 6} 位` : `${6 - digitsOnly.length} 位可输入`}
          </span>
        </div>
      )}

      <details className="supported-banks">
        <summary>支持的银行列表</summary>
        <div className="bank-grid">
          {Object.values(binDatabase).reduce((acc: BankInfo[], bank) => {
            if (!acc.find(b => b.name === bank.name)) acc.push(bank)
            return acc
          }, []).map((bank) => (
            <div key={bank.name} className="bank-chip" style={{ borderColor: bank.color }}>
              <span className="bank-chip-dot" style={{ backgroundColor: bank.color }} />
              {bank.name}
            </div>
          ))}
        </div>
      </details>
    </ToolLayout>
  )
}
