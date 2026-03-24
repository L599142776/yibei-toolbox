// src/tools/text/Symbols.tsx
import { useState, useMemo } from 'react'
import { Search, Star, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

interface SymbolItem {
  symbol: string
  name: string
  nameEn: string
}

interface SymbolCategory {
  id: string
  name: string
  icon: string
  symbols: SymbolItem[]
}

const categories: SymbolCategory[] = [
  {
    id: 'greek',
    name: '希腊字母',
    icon: 'αβγ',
    symbols: [
      { symbol: 'α', name: '阿尔法', nameEn: 'alpha' },
      { symbol: 'β', name: '贝塔', nameEn: 'beta' },
      { symbol: 'γ', name: '伽马', nameEn: 'gamma' },
      { symbol: 'δ', name: '德尔塔', nameEn: 'delta' },
      { symbol: 'ε', name: '艾普西隆', nameEn: 'epsilon' },
      { symbol: 'ζ', name: '泽塔', nameEn: 'zeta' },
      { symbol: 'η', name: '伊塔', nameEn: 'eta' },
      { symbol: 'θ', name: '西塔', nameEn: 'theta' },
      { symbol: 'ι', name: '约塔', nameEn: 'iota' },
      { symbol: 'κ', name: '卡帕', nameEn: 'kappa' },
      { symbol: 'λ', name: '拉姆达', nameEn: 'lambda' },
      { symbol: 'μ', name: '缪', nameEn: 'mu' },
      { symbol: 'ν', name: '纽', nameEn: 'nu' },
      { symbol: 'ξ', name: '克西', nameEn: 'xi' },
      { symbol: 'ο', name: '奥米克戎', nameEn: 'omicron' },
      { symbol: 'π', name: '派', nameEn: 'pi' },
      { symbol: 'ρ', name: '柔', nameEn: 'rho' },
      { symbol: 'σ', name: '西格玛', nameEn: 'sigma' },
      { symbol: 'τ', name: '陶', nameEn: 'tau' },
      { symbol: 'υ', name: '宇普西隆', nameEn: 'upsilon' },
      { symbol: 'φ', name: '斐', nameEn: 'phi' },
      { symbol: 'χ', name: '卡帕', nameEn: 'chi' },
      { symbol: 'ψ', name: '普西', nameEn: 'psi' },
      { symbol: 'ω', name: '欧米伽', nameEn: 'omega' },
      { symbol: 'Α', name: '大写阿尔法', nameEn: 'Alpha' },
      { symbol: 'Β', name: '大写贝塔', nameEn: 'Beta' },
      { symbol: 'Γ', name: '大写伽马', nameEn: 'Gamma' },
      { symbol: 'Δ', name: '大写德尔塔', nameEn: 'Delta' },
      { symbol: 'Ε', name: '大写艾普西隆', nameEn: 'Epsilon' },
      { symbol: 'Ζ', name: '大写泽塔', nameEn: 'Zeta' },
      { symbol: 'Η', name: '大写伊塔', nameEn: 'Eta' },
      { symbol: 'Θ', name: '大写西塔', nameEn: 'Theta' },
      { symbol: 'Ι', name: '大写约塔', nameEn: 'Iota' },
      { symbol: 'Κ', name: '大写卡帕', nameEn: 'Kappa' },
      { symbol: 'Λ', name: '大写拉姆达', nameEn: 'Lambda' },
      { symbol: 'Μ', name: '大写缪', nameEn: 'Mu' },
      { symbol: 'Ν', name: '大写纽', nameEn: 'Nu' },
      { symbol: 'Ξ', name: '大写克西', nameEn: 'Xi' },
      { symbol: 'Ο', name: '大写奥米克戎', nameEn: 'Omicron' },
      { symbol: 'Π', name: '大写派', nameEn: 'Pi' },
      { symbol: 'Ρ', name: '大写柔', nameEn: 'Rho' },
      { symbol: 'Σ', name: '大写西格玛', nameEn: 'Sigma' },
      { symbol: 'Τ', name: '大写陶', nameEn: 'Tau' },
      { symbol: 'Υ', name: '大写宇普西隆', nameEn: 'Upsilon' },
      { symbol: 'Φ', name: '大写斐', nameEn: 'Phi' },
      { symbol: 'Χ', name: '大写卡帕', nameEn: 'Chi' },
      { symbol: 'Ψ', name: '大写普西', nameEn: 'Psi' },
      { symbol: 'Ω', name: '大写欧米伽', nameEn: 'Omega' },
    ],
  },
  {
    id: 'math',
    name: '数学符号',
    icon: '∑∏√',
    symbols: [
      { symbol: '∑', name: '求和', nameEn: 'summation' },
      { symbol: '∏', name: '连乘', nameEn: 'product' },
      { symbol: '√', name: '平方根', nameEn: 'square root' },
      { symbol: '∛', name: '立方根', nameEn: 'cube root' },
      { symbol: '∜', name: '四次方根', nameEn: 'fourth root' },
      { symbol: '∞', name: '无穷', nameEn: 'infinity' },
      { symbol: '±', name: '加减', nameEn: 'plus minus' },
      { symbol: '∓', name: '减加', nameEn: 'minus plus' },
      { symbol: '×', name: '乘', nameEn: 'times' },
      { symbol: '÷', name: '除', nameEn: 'divide' },
      { symbol: '≠', name: '不等于', nameEn: 'not equal' },
      { symbol: '≈', name: '约等于', nameEn: 'approximately' },
      { symbol: '≡', name: '恒等于', nameEn: 'identical' },
      { symbol: '≢', name: '不全等于', nameEn: 'not identical' },
      { symbol: '≤', name: '小于等于', nameEn: 'less or equal' },
      { symbol: '≥', name: '大于等于', nameEn: 'greater or equal' },
      { symbol: '≪', name: '远小于', nameEn: 'much less' },
      { symbol: '≫', name: '远大于', nameEn: 'much greater' },
      { symbol: '∝', name: '正比于', nameEn: 'proportional to' },
      { symbol: '∂', name: '偏导', nameEn: 'partial' },
      { symbol: '∆', name: 'Delta', nameEn: 'delta' },
      { symbol: '∇', name: '梯度', nameEn: 'nabla' },
      { symbol: '∈', name: '属于', nameEn: 'element of' },
      { symbol: '∉', name: '不属于', nameEn: 'not element of' },
      { symbol: '⊂', name: '子集', nameEn: 'subset' },
      { symbol: '⊃', name: '超集', nameEn: 'superset' },
      { symbol: '⊆', name: '子集或等于', nameEn: 'subset or equal' },
      { symbol: '⊇', name: '超集或等于', nameEn: 'superset or equal' },
      { symbol: '∪', name: '并集', nameEn: 'union' },
      { symbol: '∩', name: '交集', nameEn: 'intersection' },
      { symbol: '∅', name: '空集', nameEn: 'empty set' },
      { symbol: '∠', name: '角', nameEn: 'angle' },
      { symbol: '∟', name: '直角', nameEn: 'right angle' },
      { symbol: '⊥', name: '垂直', nameEn: 'perpendicular' },
      { symbol: '∥', name: '平行', nameEn: 'parallel' },
      { symbol: '∵', name: '因为', nameEn: 'because' },
      { symbol: '∴', name: '所以', nameEn: 'therefore' },
      { symbol: '∀', name: '任意', nameEn: 'for all' },
      { symbol: '∃', name: '存在', nameEn: 'exists' },
      { symbol: '∄', name: '不存在', nameEn: 'not exists' },
      { symbol: '⌒', name: '圆弧', nameEn: 'arc' },
      { symbol: '⊕', name: '异或', nameEn: 'xor' },
      { symbol: '⊗', name: '张量积', nameEn: 'tensor product' },
      { symbol: '⊙', name: '点积', nameEn: 'circled dot' },
      { symbol: '∫', name: '积分', nameEn: 'integral' },
      { symbol: '∬', name: '二重积分', nameEn: 'double integral' },
      { symbol: '∭', name: '三重积分', nameEn: 'triple integral' },
      { symbol: '∮', name: '曲线积分', nameEn: 'contour integral' },
      { symbol: '∯', name: '面积分', nameEn: 'surface integral' },
      { symbol: '∰', name: '体积分', nameEn: 'volume integral' },
      { symbol: 'ℕ', name: '自然数集', nameEn: 'natural numbers' },
      { symbol: 'ℤ', name: '整数集', nameEn: 'integers' },
      { symbol: 'ℚ', name: '有理数集', nameEn: 'rationals' },
      { symbol: 'ℝ', name: '实数集', nameEn: 'real numbers' },
      { symbol: 'ℂ', name: '复数集', nameEn: 'complex numbers' },
      { symbol: '‰', name: '千分号', nameEn: 'per mille' },
      { symbol: '‱', name: '万分号', nameEn: 'per ten thousand' },
      { symbol: '¼', name: '四分之一', nameEn: 'quarter' },
      { symbol: '½', name: '二分之一', nameEn: 'half' },
      { symbol: '¾', name: '四分之三', nameEn: 'three quarters' },
      { symbol: '⅓', name: '三分之一', nameEn: 'one third' },
      { symbol: '⅔', name: '三分之二', nameEn: 'two thirds' },
      { symbol: '⅛', name: '八分之一', nameEn: 'one eighth' },
      { symbol: '⅜', name: '八分之三', nameEn: 'three eighths' },
      { symbol: '⅝', name: '八分之五', nameEn: 'five eighths' },
      { symbol: '⅞', name: '八分之七', nameEn: 'seven eighths' },
    ],
  },
  {
    id: 'arrows',
    name: '箭头符号',
    icon: '→⇒↑',
    symbols: [
      { symbol: '→', name: '右箭头', nameEn: 'right arrow' },
      { symbol: '←', name: '左箭头', nameEn: 'left arrow' },
      { symbol: '↑', name: '上箭头', nameEn: 'up arrow' },
      { symbol: '↓', name: '下箭头', nameEn: 'down arrow' },
      { symbol: '↔', name: '左右箭头', nameEn: 'left right arrow' },
      { symbol: '↕', name: '上下箭头', nameEn: 'up down arrow' },
      { symbol: '⇒', name: '双线右箭头', nameEn: 'double right arrow' },
      { symbol: '⇐', name: '双线左箭头', nameEn: 'double left arrow' },
      { symbol: '⇑', name: '双线上箭头', nameEn: 'double up arrow' },
      { symbol: '⇓', name: '双线下箭头', nameEn: 'double down arrow' },
      { symbol: '⇔', name: '双线左右箭头', nameEn: 'double left right' },
      { symbol: '⇕', name: '双线上下箭头', nameEn: 'double up down' },
      { symbol: '↗', name: '右上箭头', nameEn: 'northeast arrow' },
      { symbol: '↘', name: '右下箭头', nameEn: 'southeast arrow' },
      { symbol: '↙', name: '左下箭头', nameEn: 'southwest arrow' },
      { symbol: '↖', name: '左上箭头', nameEn: 'northwest arrow' },
      { symbol: '↩', name: '左转箭头', nameEn: 'left arrow hook' },
      { symbol: '↪', name: '右转箭头', nameEn: 'right arrow hook' },
      { symbol: '↻', name: '顺时针箭头', nameEn: 'clockwise arrow' },
      { symbol: '↺', name: '逆时针箭头', nameEn: 'counterclockwise' },
      { symbol: '➔', name: '粗右箭头', nameEn: 'heavy arrow' },
      { symbol: '➙', name: '重右箭头', nameEn: 'heavy right' },
      { symbol: '➜', name: '触须右箭头', nameEn: 'feathered right' },
      { symbol: '➝', name: '三角右箭头', nameEn: 'triangle right' },
      { symbol: '➟', name: '虚线右箭头', nameEn: 'dashed right' },
      { symbol: '➠', name: '飞行箭头', nameEn: 'flying arrow' },
      { symbol: '➡', name: '黑右箭头', nameEn: 'black right' },
      { symbol: '➤', name: '三角黑箭头', nameEn: 'triangle black' },
      { symbol: '⇢', name: '东北箭头', nameEn: 'northeast' },
      { symbol: '⇡', name: '向上箭头', nameEn: 'up arrow' },
      { symbol: '⇣', name: '向下箭头', nameEn: 'down arrow' },
      { symbol: '⟵', name: '长左箭头', nameEn: 'long left' },
      { symbol: '⟶', name: '长右箭头', nameEn: 'long right' },
      { symbol: '⟷', name: '长左右箭头', nameEn: 'long left right' },
      { symbol: '⟹', name: '长双线右箭头', nameEn: 'long double right' },
      { symbol: '⟸', name: '长双线左箭头', nameEn: 'long double left' },
      { symbol: '⟺', name: '长双线左右箭头', nameEn: 'long double left right' },
      { symbol: '↽', name: '左重音箭头', nameEn: 'left harpoon' },
      { symbol: '⇁', name: '右重音箭头', nameEn: 'right harpoon' },
      { symbol: '↿', name: '上重音箭头', nameEn: 'up harpoon' },
      { symbol: '⇂', name: '下重音箭头', nameEn: 'down harpoon' },
    ],
  },
  {
    id: 'currency',
    name: '货币符号',
    icon: '€£¥',
    symbols: [
      { symbol: '€', name: '欧元', nameEn: 'Euro' },
      { symbol: '£', name: '英镑', nameEn: 'Pound' },
      { symbol: '¥', name: '日元/人民币', nameEn: 'Yen / Yuan' },
      { symbol: '₹', name: '印度卢比', nameEn: 'Indian Rupee' },
      { symbol: '₽', name: '俄罗斯卢布', nameEn: 'Russian Ruble' },
      { symbol: '₿', name: '比特币', nameEn: 'Bitcoin' },
      { symbol: '₿', name: '比特币', nameEn: 'Bitcoin' },
      { symbol: '₴', name: '乌克兰格里夫纳', nameEn: 'Hryvnia' },
      { symbol: '₦', name: '尼日利亚奈拉', nameEn: 'Naira' },
      { symbol: '₱', name: '菲律宾比索', nameEn: 'Peso' },
      { symbol: '₩', name: '韩元', nameEn: 'Won' },
      { symbol: '₪', name: '以色列谢克尔', nameEn: 'Shekel' },
      { symbol: '₫', name: '越南盾', nameEn: 'Dong' },
      { symbol: '₮', name: '蒙古图格里克', nameEn: 'Tugrik' },
      { symbol: '₭', name: '老挝基普', nameEn: 'Kip' },
      { symbol: '₸', name: '哈萨克斯坦坚戈', nameEn: 'Tenge' },
      { symbol: '₺', name: '土耳其里拉', nameEn: 'Turkish Lira' },
      { symbol: '₼', name: '阿塞拜疆马纳特', nameEn: 'Manat' },
      { symbol: '₾', name: '格鲁吉亚拉里', nameEn: 'Lari' },
      { symbol: '฿', name: '泰铢', nameEn: 'Baht' },
      { symbol: '៛', name: '柬埔寨瑞尔', nameEn: 'Riel' },
      { symbol: '₵', name: '加纳塞地', nameEn: 'Cedi' },
      { symbol: '¢', name: '美分', nameEn: 'Cent' },
      { symbol: '₡', name: '科朗', nameEn: 'Colon' },
      { symbol: '$', name: '美元', nameEn: 'Dollar' },
      { symbol: 'AUD', name: '澳元', nameEn: 'Australian Dollar' },
      { symbol: 'CAD', name: '加元', nameEn: 'Canadian Dollar' },
      { symbol: 'CHF', name: '瑞士法郎', nameEn: 'Swiss Franc' },
      { symbol: 'CNY', name: '人民币', nameEn: 'Chinese Yuan' },
      { symbol: 'HKD', name: '港元', nameEn: 'Hong Kong Dollar' },
      { symbol: 'NZD', name: '新西兰元', nameEn: 'New Zealand Dollar' },
      { symbol: 'SEK', name: '瑞典克朗', nameEn: 'Swedish Krona' },
      { symbol: 'KRW', name: '韩元', nameEn: 'South Korean Won' },
      { symbol: 'SGD', name: '新加坡元', nameEn: 'Singapore Dollar' },
      { symbol: 'INR', name: '印度卢比', nameEn: 'Indian Rupee' },
      { symbol: 'MXN', name: '墨西哥比索', nameEn: 'Mexican Peso' },
      { symbol: 'BRL', name: '巴西雷亚尔', nameEn: 'Brazilian Real' },
      { symbol: 'ZAR', name: '南非兰特', nameEn: 'South African Rand' },
      { symbol: 'RUB', name: '俄罗斯卢布', nameEn: 'Russian Ruble' },
      { symbol: 'TRY', name: '土耳其里拉', nameEn: 'Turkish Lira' },
      { symbol: 'PLN', name: '波兰兹罗提', nameEn: 'Polish Zloty' },
      { symbol: 'THB', name: '泰铢', nameEn: 'Thai Baht' },
    ],
  },
  {
    id: 'punctuation',
    name: '标点符号',
    icon: '—…«»',
    symbols: [
      { symbol: '—', name: '破折号', nameEn: 'em dash' },
      { symbol: '–', name: '短破折号', nameEn: 'en dash' },
      { symbol: '‑', name: '非断行连字符', nameEn: 'non-breaking hyphen' },
      { symbol: '‒', name: '数字连线', nameEn: 'figure dash' },
      { symbol: '…', name: '省略号', nameEn: 'ellipsis' },
      { symbol: '·', name: '中间点', nameEn: 'middle dot' },
      { symbol: '•', name: '项目符号', nameEn: 'bullet' },
      { symbol: '‣', name: '三角形项目符号', nameEn: 'triangle bullet' },
      { symbol: '◦', name: '白色项目符号', nameEn: 'white bullet' },
      { symbol: '⁃', name: '短项目符号', nameEn: 'hyphen bullet' },
      { symbol: '«', name: '左双尖引号', nameEn: 'left guillemet' },
      { symbol: '»', name: '右双尖引号', nameEn: 'right guillemet' },
      { symbol: '‹', name: '左单尖引号', nameEn: 'left single guillemet' },
      { symbol: '›', name: '右单尖引号', nameEn: 'right single guillemet' },
      { symbol: '「', name: '左直角引号', nameEn: 'left corner bracket' },
      { symbol: '」', name: '右直角引号', nameEn: 'right corner bracket' },
      { symbol: '『', name: '左书名号', nameEn: 'left white corner' },
      { symbol: '』', name: '右书名号', nameEn: 'right white corner' },
      { symbol: '【', name: '左实心方括号', nameEn: 'left black lenticular' },
      { symbol: '】', name: '右实心方括号', nameEn: 'right black lenticular' },
      { symbol: '〈', name: '左尖括号', nameEn: 'left angle bracket' },
      { symbol: '〉', name: '右尖括号', nameEn: 'right angle bracket' },
      { symbol: '《', name: '左双尖括号', nameEn: 'left double angle' },
      { symbol: '》', name: '右双尖括号', nameEn: 'right double angle' },
      { symbol: '「', name: '中文引号左', nameEn: 'Chinese quote left' },
      { symbol: '」', name: '中文引号右', nameEn: 'Chinese quote right' },
      { symbol: '〘', name: '左白色双尖括号', nameEn: 'left white double angle' },
      { symbol: '〙', name: '右白色双尖括号', nameEn: 'right white double angle' },
      { symbol: '〚', name: '左白色单尖括号', nameEn: 'left white single angle' },
      { symbol: '〛', name: '右白色单尖括号', nameEn: 'right white single angle' },
      { symbol: '❝', name: '左双引号', nameEn: 'heavy double turned' },
      { symbol: '❞', name: '右双引号', nameEn: 'heavy double quote' },
      { symbol: '❛', name: '左单引号', nameEn: 'heavy single turned' },
      { symbol: '❜', name: '右单引号', nameEn: 'heavy single quote' },
      { symbol: 'ʻ', name: '左单引号修饰', nameEn: 'modifier letter' },
      { symbol: 'ʼ', name: '右单引号修饰', nameEn: 'modifier letter apostrophe' },
      { symbol: '′', name: '撇号/分钟', nameEn: 'prime / minutes' },
      { symbol: '″', name: '双撇/秒', nameEn: 'double prime / seconds' },
      { symbol: '‴', name: '三撇', nameEn: 'triple prime' },
      { symbol: '‶', name: '双反引号', nameEn: 'reversed double quote' },
      { symbol: '‵', name: '反引号', nameEn: 'reversed single quote' },
      { symbol: '⁗', name: '四连音符', nameEn: 'quadruple prime' },
    ],
  },
  {
    id: 'box',
    name: '制表符号',
    icon: '─│┌',
    symbols: [
      { symbol: '─', name: '水平线', nameEn: 'horizontal' },
      { symbol: '━', name: '粗水平线', nameEn: 'heavy horizontal' },
      { symbol: '│', name: '垂直线', nameEn: 'vertical' },
      { symbol: '┃', name: '粗垂直线', nameEn: 'heavy vertical' },
      { symbol: '┌', name: '左上角', nameEn: 'top left' },
      { symbol: '┐', name: '右上角', nameEn: 'top right' },
      { symbol: '└', name: '左下角', nameEn: 'bottom left' },
      { symbol: '┘', name: '右下角', nameEn: 'bottom right' },
      { symbol: '├', name: '左边中间', nameEn: 'left tee' },
      { symbol: '┤', name: '右边中间', nameEn: 'right tee' },
      { symbol: '┬', name: '上边中间', nameEn: 'top tee' },
      { symbol: '┴', name: '下边中间', nameEn: 'bottom tee' },
      { symbol: '┼', name: '交叉', nameEn: 'cross' },
      { symbol: '╔', name: '双线左上角', nameEn: 'double top left' },
      { symbol: '╗', name: '双线右上角', nameEn: 'double top right' },
      { symbol: '╚', name: '双线左下角', nameEn: 'double bottom left' },
      { symbol: '╝', name: '双线右下角', nameEn: 'double bottom right' },
      { symbol: '╠', name: '双线左边', nameEn: 'double left tee' },
      { symbol: '╣', name: '双线右边', nameEn: 'double right tee' },
      { symbol: '╦', name: '双线上边', nameEn: 'double top tee' },
      { symbol: '╩', name: '双线下边', nameEn: 'double bottom tee' },
      { symbol: '╬', name: '双线交叉', nameEn: 'double cross' },
      { symbol: '═', name: '双线水平', nameEn: 'double horizontal' },
      { symbol: '║', name: '双线垂直', nameEn: 'double vertical' },
      { symbol: '╒', name: '上左圆角', nameEn: 'round top left' },
      { symbol: '╕', name: '上右圆角', nameEn: 'round top right' },
      { symbol: '╘', name: '下左圆角', nameEn: 'round bottom left' },
      { symbol: '╛', name: '下右圆角', nameEn: 'round bottom right' },
      { symbol: '╞', name: '点左边', nameEn: 'dotted left tee' },
      { symbol: '╪', name: '点水平', nameEn: 'dotted horizontal tee' },
      { symbol: '╟', name: '点右边', nameEn: 'dotted right tee' },
      { symbol: '╭', name: '圆左上角', nameEn: 'round corner top left' },
      { symbol: '╮', name: '圆右上角', nameEn: 'round corner top right' },
      { symbol: '╰', name: '圆左下角', nameEn: 'round corner bottom left' },
      { symbol: '╯', name: '圆右下角', nameEn: 'round corner bottom right' },
      { symbol: '╲', name: '反斜线', nameEn: 'light diagonal down left' },
      { symbol: '╱', name: '斜线', nameEn: 'light diagonal down right' },
      { symbol: '╳', name: 'X', nameEn: 'light diagonal cross' },
      { symbol: '☰', name: '汉堡菜单', nameEn: 'trigram for heaven' },
      { symbol: '⌧', name: '输入符号', nameEn: 'X in a rectangle' },
      { symbol: '┰', name: '上T右', nameEn: 'T down right' },
      { symbol: '┱', name: '上左T', nameEn: 'T up left' },
      { symbol: '┲', name: '上T点右', nameEn: 'T down left dot' },
      { symbol: '┳', name: '上T', nameEn: 'T down' },
      { symbol: '┴', name: '下T', nameEn: 'T up' },
      { symbol: '┵', name: '下右T', nameEn: 'T down right' },
      { symbol: '┶', name: '下左T', nameEn: 'T up left' },
      { symbol: '┸', name: '下点右T', nameEn: 'T bottom right dot' },
      { symbol: '┹', name: '下点左T', nameEn: 'T bottom left dot' },
      { symbol: '┺', name: '下左T点', nameEn: 'T left dot' },
      { symbol: '┻', name: '上T点', nameEn: 'T top left dot' },
      { symbol: '╀', name: '下T右', nameEn: 'T down left' },
      { symbol: '╁', name: '下T左', nameEn: 'T down right' },
      { symbol: '╂', name: 'T交叉', nameEn: 'T vertical and cross' },
    ],
  },
  {
    id: 'emoji',
    name: 'Emoji 表情',
    icon: '🙂😂',
    symbols: [
      { symbol: '🙂', name: '微笑', nameEn: 'slightly smiling' },
      { symbol: '😊', name: '笑脸', nameEn: 'smiling face' },
      { symbol: '😄', name: '大笑', nameEn: 'grinning face' },
      { symbol: '😁', name: '露齿笑', nameEn: 'beaming face' },
      { symbol: '😆', name: '笑哭', nameEn: 'grinning squinting' },
      { symbol: '😅', name: '苦笑', nameEn: 'sweating smile' },
      { symbol: '🤣', name: '笑到翻滚', nameEn: 'rolling on floor' },
      { symbol: '😂', name: '笑到流泪', nameEn: 'tears of joy' },
      { symbol: '🙃', name: '倒置笑脸', nameEn: 'upside-down' },
      { symbol: '😉', name: '眨眼', nameEn: 'winking' },
      { symbol: '😍', name: '花痴', nameEn: 'heart eyes' },
      { symbol: '🥰', name: '爱心脸', nameEn: 'smiling hearts' },
      { symbol: '😘', name: '飞吻', nameEn: 'face blowing kiss' },
      { symbol: '😗', name: '亲亲', nameEn: 'kissing face' },
      { symbol: '😚', name: '闭眼亲亲', nameEn: 'kissing closed eyes' },
      { symbol: '😙', name: '眯眼亲亲', nameEn: 'kissing smiling eyes' },
      { symbol: '🥲', name: '含泪微笑', nameEn: 'smiling with tear' },
      { symbol: '😋', name: '流口水', nameEn: 'face savoring' },
      { symbol: '😛', name: '吐舌头', nameEn: 'face with tongue' },
      { symbol: '😜', name: '调皮眨眼', nameEn: 'winking tongue' },
      { symbol: '🤪', name: '疯狂', nameEn: 'crazy face' },
      { symbol: '😝', name: '闭眼吐舌', nameEn: 'squinting tongue' },
      { symbol: '🤑', name: '发财', nameEn: 'money-mouth' },
      { symbol: '🤗', name: '拥抱', nameEn: 'hugging' },
      { symbol: '🤭', name: '捂嘴笑', nameEn: 'face with hand' },
      { symbol: '🤫', name: '嘘', nameEn: 'shushing face' },
      { symbol: '🤔', name: '思考', nameEn: 'thinking' },
      { symbol: '🤐', name: '闭嘴', nameEn: 'zipper-mouth' },
      { symbol: '🤨', name: '挑眉', nameEn: 'raised eyebrow' },
      { symbol: '😐', name: '面无表情', nameEn: 'neutral' },
      { symbol: '😑', name: '无表情', nameEn: 'expressionless' },
      { symbol: '😶', name: '闭嘴沉默', nameEn: 'face without mouth' },
      { symbol: '😏', name: '得意', nameEn: 'smirking' },
      { symbol: '😒', name: '不爽', nameEn: 'unamused' },
      { symbol: '🙄', name: '翻白眼', nameEn: 'rolling eyes' },
      { symbol: '😬', name: '尴尬', nameEn: 'grimacing' },
      { symbol: '😮', name: '张嘴', nameEn: 'face open mouth' },
      { symbol: '🤥', name: '说谎', nameEn: 'lying face' },
      { symbol: '😌', name: '放松', nameEn: 'relieved' },
      { symbol: '😔', name: '失落', nameEn: 'pensive' },
      { symbol: '😪', name: '困', nameEn: 'sleepy' },
      { symbol: '🤤', name: '流口水', nameEn: 'drooling' },
      { symbol: '😴', name: '睡觉', nameEn: 'sleeping' },
      { symbol: '😷', name: '生病', nameEn: 'mask' },
      { symbol: '🤒', name: '发烧', nameEn: 'thermometer' },
      { symbol: '🤕', name: '受伤', nameEn: 'head bandage' },
      { symbol: '🤢', name: '恶心', nameEn: 'nauseated' },
      { symbol: '🤮', name: '呕吐', nameEn: 'vomiting' },
      { symbol: '🤧', name: '打喷嚏', nameEn: 'sneezing' },
      { symbol: '🥵', name: '中暑', nameEn: 'hot' },
      { symbol: '🥶', name: '冻僵', nameEn: 'cold' },
      { symbol: '🥴', name: '晕', nameEn: 'woozy' },
      { symbol: '😵', name: '眩晕', nameEn: 'dizzy' },
      { symbol: '🤯', name: '头脑爆炸', nameEn: 'exploding head' },
      { symbol: '🤠', name: '牛仔帽', nameEn: 'cowboy hat' },
      { symbol: '🥳', name: '派对', nameEn: 'partying' },
      { symbol: '🥸', name: '伪装', nameEn: 'disguised' },
      { symbol: '😎', name: '太阳镜', nameEn: 'sunglasses' },
      { symbol: '🤓', name: '书呆子', nameEn: 'nerd' },
      { symbol: '🧐', name: '单片眼镜', nameEn: 'monocle' },
      { symbol: '😕', name: '困惑', nameEn: 'confused' },
      { symbol: '😟', name: '担心', nameEn: 'worried' },
      { symbol: '🙁', name: '不开心', nameEn: 'frowning' },
      { symbol: '😮', name: '惊讶', nameEn: 'astonished' },
      { symbol: '😯', name: '沉默', nameEn: 'flushed' },
      { symbol: '😲', name: '震惊', nameEn: 'astonished' },
      { symbol: '😳', name: '脸红', nameEn: 'flushed' },
      { symbol: '🥺', name: '可怜巴巴', nameEn: 'pleading' },
      { symbol: '😦', name: '皱眉', nameEn: 'frowning' },
      { symbol: '😧', name: '焦虑', nameEn: 'anguished' },
      { symbol: '😨', name: '害怕', nameEn: 'fearful' },
      { symbol: '😰', name: '流汗紧张', nameEn: 'anxious' },
      { symbol: '😥', name: '失望', nameEn: 'disappointed' },
      { symbol: '😢', name: '哭泣', nameEn: 'crying' },
      { symbol: '😭', name: '大哭', nameEn: 'loudly crying' },
      { symbol: '😱', name: '恐惧', nameEn: 'scream' },
      { symbol: '😖', name: '沮丧', nameEn: 'confounded' },
      { symbol: '😣', name: '痛苦', nameEn: 'persevering' },
      { symbol: '😞', name: '失望', nameEn: 'disappointed' },
      { symbol: '😓', name: '疲惫', nameEn: 'downcast' },
      { symbol: '😩', name: '疲倦', nameEn: 'weary' },
      { symbol: '😫', name: '精疲力尽', nameEn: 'tired' },
      { symbol: '🥱', name: '无聊', nameEn: 'yawning' },
      { symbol: '😤', name: '生气', nameEn: 'face with steam' },
      { symbol: '😡', name: '愤怒', nameEn: 'pouting' },
      { symbol: '😠', name: '恼怒', nameEn: 'angry' },
      { symbol: '🤬', name: '咒骂', nameEn: 'cursing' },
      { symbol: '😈', name: '恶魔', nameEn: 'devil' },
      { symbol: '👿', name: '恶魔脸', nameEn: 'angry devil' },
      { symbol: '💀', name: '骷髅', nameEn: 'skull' },
      { symbol: '☠️', name: '骷髅头', nameEn: 'skull crossbones' },
      { symbol: '💩', name: '便便', nameEn: 'pile of poo' },
      { symbol: '🤡', name: '小丑', nameEn: 'clown' },
      { symbol: '👹', name: '鬼', nameEn: 'ogre' },
      { symbol: '👺', name: '天狗', nameEn: 'goblin' },
      { symbol: '👻', name: '幽灵', nameEn: 'ghost' },
      { symbol: '👽', name: '外星人', nameEn: 'alien' },
      { symbol: '👾', name: '外星人怪物', nameEn: 'alien monster' },
      { symbol: '🤖', name: '机器人', nameEn: 'robot' },
      { symbol: '😺', name: '开心猫', nameEn: 'cat smiling' },
      { symbol: '😸', name: '大笑猫', nameEn: 'cat grin' },
      { symbol: '😹', name: '喜极而泣猫', nameEn: 'cat tears joy' },
      { symbol: '😻', name: '爱心眼猫', nameEn: 'cat heart eyes' },
      { symbol: '😼', name: '嘲笑猫', nameEn: 'cat smirk' },
      { symbol: '😽', name: '亲亲猫', nameEn: 'cat kiss' },
      { symbol: '🙀', name: '惊恐猫', nameEn: 'cat screaming' },
      { symbol: '😿', name: '哭泣猫', nameEn: 'cat crying' },
      { symbol: '😾', name: '生气猫', nameEn: 'cat pouting' },
      { symbol: '🙈', name: '非礼勿视', nameEn: 'see no evil' },
      { symbol: '🙉', name: '非礼勿听', nameEn: 'hear no evil' },
      { symbol: '🙊', name: '非礼勿言', nameEn: 'speak no evil' },
    ],
  },
  {
    id: 'chinese-punct',
    name: '中文标点',
    icon: '，。！？',
    symbols: [
      { symbol: '，', name: '逗号', nameEn: 'Chinese comma' },
      { symbol: '。', name: '句号', nameEn: 'Chinese period' },
      { symbol: '、', name: '顿号', nameEn: 'enumeration comma' },
      { symbol: '；', name: '分号', nameEn: 'Chinese semicolon' },
      { symbol: '：', name: '冒号', nameEn: 'Chinese colon' },
      { symbol: '！', name: '感叹号', nameEn: 'Chinese exclamation' },
      { symbol: '？', name: '问号', nameEn: 'Chinese question mark' },
      { symbol: '\u201C', name: '左双引号', nameEn: 'left double quote' },
      { symbol: '\u201D', name: '右双引号', nameEn: 'right double quote' },
      { symbol: '\u2018', name: '左单引号', nameEn: 'left single quote' },
      { symbol: '\u2019', name: '右单引号', nameEn: 'right single quote' },
      { symbol: '（', name: '左圆括号', nameEn: 'left parenthesis' },
      { symbol: '）', name: '右圆括号', nameEn: 'right parenthesis' },
      { symbol: '【', name: '左方括号', nameEn: 'left bracket' },
      { symbol: '】', name: '右方括号', nameEn: 'right bracket' },
      { symbol: '《', name: '左书名号', nameEn: 'left book title' },
      { symbol: '》', name: '右书名号', nameEn: 'right book title' },
      { symbol: '〈', name: '左尖括号', nameEn: 'left angle bracket' },
      { symbol: '〉', name: '右尖括号', nameEn: 'right angle bracket' },
      { symbol: '「', name: '左直角引号', nameEn: 'left corner bracket' },
      { symbol: '」', name: '右直角引号', nameEn: 'right corner bracket' },
      { symbol: '『', name: '左白括号', nameEn: 'left white corner' },
      { symbol: '』', name: '右白括号', nameEn: 'right white corner' },
      { symbol: '〔', name: '左鱼尾号', nameEn: 'left tortoise shell' },
      { symbol: '〕', name: '右鱼尾号', nameEn: 'right tortoise shell' },
      { symbol: '〖', name: '左双白括号', nameEn: 'left white lenticular' },
      { symbol: '〗', name: '右双白括号', nameEn: 'right white lenticular' },
      { symbol: '【', name: '左实心括号', nameEn: 'left black lenticular' },
      { symbol: '】', name: '右实心括号', nameEn: 'right black lenticular' },
      { symbol: '～', name: '波浪号', nameEn: 'Chinese tilde' },
      { symbol: '……', name: '省略号', nameEn: 'Chinese ellipsis' },
      { symbol: '——', name: '破折号', nameEn: 'Chinese em dash' },
      { symbol: '·', name: '间隔号', nameEn: 'middle dot' },
      { symbol: '〇', name: '数字零', nameEn: 'Chinese zero' },
      { symbol: '〡', name: '数字一', nameEn: 'Chinese one' },
      { symbol: '〢', name: '数字二', nameEn: 'Chinese two' },
      { symbol: '〣', name: '数字三', nameEn: 'Chinese three' },
      { symbol: '〤', name: '数字四', nameEn: 'Chinese four' },
      { symbol: '〥', name: '数字五', nameEn: 'Chinese five' },
      { symbol: '〦', name: '数字六', nameEn: 'Chinese six' },
      { symbol: '〧', name: '数字七', nameEn: 'Chinese seven' },
      { symbol: '〨', name: '数字八', nameEn: 'Chinese eight' },
      { symbol: '〩', name: '数字九', nameEn: 'Chinese nine' },
      { symbol: '十', name: '数字十', nameEn: 'Chinese ten' },
    ],
  },
  {
    id: 'stars',
    name: '星号符号',
    icon: '★☆⚝',
    symbols: [
      { symbol: '★', name: '实心星', nameEn: 'filled star' },
      { symbol: '☆', name: '空心星', nameEn: 'outline star' },
      { symbol: '⚝', name: '六角星', nameEn: 'six-pointed star' },
      { symbol: '✦', name: '小实心星', nameEn: 'black four-pointed star' },
      { symbol: '✧', name: '小空心星', nameEn: 'white four-pointed star' },
      { symbol: '✩', name: '四叉星', nameEn: 'stress star' },
      { symbol: '✪', name: '圈星', nameEn: 'circled star' },
      { symbol: '✫', name: '开嘴星', nameEn: 'open center star' },
      { symbol: '✬', name: '实心星填充', nameEn: 'black star filled' },
      { symbol: '✭', name: '浅色星', nameEn: 'outlined star' },
      { symbol: '✮', name: '粗星', nameEn: 'heavy star' },
      { symbol: '✯', name: '旋转星', nameEn: 'pinwheel star' },
      { symbol: '✰', name: '大星', nameEn: 'shadowed star' },
      { symbol: '✱', name: '重斜线星', nameEn: 'heavy asterisk' },
      { symbol: '✲', name: '空心星', nameEn: 'open asterisk' },
      { symbol: '✳', name: '八臂星', nameEn: 'eight spokes' },
      { symbol: '✴', name: '八角星', nameEn: 'eight-pointed star' },
      { symbol: '✵', name: '八角星旋转', nameEn: 'eight-pointed star pinwheel' },
      { symbol: '✶', name: '六角星实心', nameEn: 'six-pointed star solid' },
      { symbol: '✷', name: '八角粗星', nameEn: 'eight-pointed star heavy' },
      { symbol: '✸', name: '重尖星', nameEn: 'heavy open star' },
      { symbol: '✹', name: '十二角星', nameEn: 'twelve-pointed star' },
      { symbol: '✺', name: '十六角星', nameEn: 'sixteen-pointed star' },
      { symbol: '✻', name: '加粗星', nameEn: 'teardrop star' },
      { symbol: '✼', name: '开放泪滴星', nameEn: 'open teardrop' },
      { symbol: '✽', name: '重八臂星', nameEn: 'heavy asterisk' },
      { symbol: '✾', name: '六瓣花', nameEn: 'six-petal flower' },
      { symbol: '✿', name: '八瓣花', nameEn: 'eight-petal flower' },
      { symbol: '❀', name: '白色花', nameEn: 'white flower' },
      { symbol: '❁', name: '大白色花', nameEn: 'white flower large' },
      { symbol: '❂', name: '星圆圈', nameEn: 'circled star' },
      { symbol: '❃', name: '重泪滴星', nameEn: 'heavy teardrop' },
      { symbol: '❄', name: '雪花', nameEn: 'snowflake' },
      { symbol: '❅', name: '紧密雪花', nameEn: 'tight snowflake' },
      { symbol: '❆', name: '重雪花', nameEn: 'heavy snowflake' },
      { symbol: '❇', name: '闪光', nameEn: 'sparkle' },
      { symbol: '❈', name: '重闪光', nameEn: 'heavy sparkle' },
      { symbol: '❉', name: '星号', nameEn: 'asterisk' },
      { symbol: '❊', name: '十六角星', nameEn: 'sixteen-pointed star' },
      { symbol: '❋', name: '重星', nameEn: 'heavy asterisk' },
      { symbol: '⁕', name: '四叉星', nameEn: 'four asterisks' },
      { symbol: '⁑', name: '双星', nameEn: 'two asterisks' },
      { symbol: '⁂', name: '三星', nameEn: 'asterism' },
      { symbol: '☀', name: '太阳', nameEn: 'sun' },
      { symbol: '☁', name: '云', nameEn: 'cloud' },
      { symbol: '☂', name: '雨伞', nameEn: 'umbrella' },
      { symbol: '☃', name: '雪人', nameEn: 'snowman' },
      { symbol: '☄', name: '彗星', nameEn: 'comet' },
      { symbol: '☽', name: '上弦月', nameEn: 'first quarter moon' },
      { symbol: '☾', name: '下弦月', nameEn: 'last quarter moon' },
      { symbol: '★', name: '黑星', nameEn: 'black star' },
      { symbol: '☆', name: '白星', nameEn: 'white star' },
    ],
  },
  {
    id: 'temperature',
    name: '温度符号',
    icon: '℃℉',
    symbols: [
      { symbol: '℃', name: '摄氏度', nameEn: 'Celsius' },
      { symbol: '℉', name: '华氏度', nameEn: 'Fahrenheit' },
      { symbol: 'K', name: '开尔文', nameEn: 'Kelvin' },
      { symbol: '°', name: '度', nameEn: 'degree' },
      { symbol: '°C', name: '摄氏度', nameEn: 'Celsius' },
      { symbol: '°F', name: '华氏度', nameEn: 'Fahrenheit' },
      { symbol: '°K', name: '开尔文', nameEn: 'Kelvin' },
      { symbol: '零下', name: '零度以下', nameEn: 'below zero' },
      { symbol: '°', name: '度数符号', nameEn: 'ring above' },
    ],
  },
  {
    id: 'checkmark',
    name: '对勾符号',
    icon: '✓✔☑',
    symbols: [
      { symbol: '✓', name: '对勾', nameEn: 'checkmark' },
      { symbol: '✔', name: '粗对勾', nameEn: 'heavy checkmark' },
      { symbol: '☑', name: '打勾方框', nameEn: 'ballot box checked' },
      { symbol: '☒', name: '打叉方框', nameEn: 'ballot box x' },
      { symbol: '∨', name: '逻辑或', nameEn: 'logical or' },
      { symbol: '√', name: '根号', nameEn: 'square root' },
      { symbol: '🗸', name: '轻对勾', nameEn: 'light checkmark' },
      { symbol: '🗹', name: '粗对勾', nameEn: 'bold checkmark' },
      { symbol: '✅', name: '白色对勾', nameEn: 'white checkmark' },
      { symbol: '❎', name: '白色叉', nameEn: 'cross mark button' },
      { symbol: '✗', name: '叉号', nameEn: 'ballot x' },
      { symbol: '✘', name: '粗叉号', nameEn: 'heavy ballot x' },
      { symbol: '☓', name: '粗叉', nameEn: 'saltire' },
      { symbol: '✕', name: '乘号', nameEn: 'multiplication x' },
      { symbol: '✖', name: '粗乘号', nameEn: 'heavy multiplication x' },
      { symbol: '⊗', name: '圈乘号', nameEn: 'circled times' },
      { symbol: '⊙', name: '圈点', nameEn: 'circled dot' },
      { symbol: '⊘', name: '圈除', nameEn: 'circled division' },
      { symbol: '⊛', name: '圈星', nameEn: 'circled asterisk' },
      { symbol: '⊚', name: '大白圈', nameEn: 'circle large' },
      { symbol: '○', name: '小白圈', nameEn: 'white circle' },
      { symbol: '◉', name: '鱼眼圈', nameEn: 'fisin eye' },
      { symbol: '◎', name: '双圈', nameEn: 'bullseye' },
      { symbol: '●', name: '黑点', nameEn: 'black circle' },
      { symbol: '◌', name: '虚线圈', nameEn: 'dotted circle' },
      { symbol: '◍', name: '竖线白圈', nameEn: 'circle vert line' },
      { symbol: '◐', name: '半黑左圈', nameEn: 'circle left half' },
      { symbol: '◑', name: '半黑右圈', nameEn: 'circle right half' },
      { symbol: '◒', name: '半黑上圈', nameEn: 'circle upper half' },
      { symbol: '◓', name: '半黑下圈', nameEn: 'circle lower half' },
      { symbol: '◔', name: '上半空心圈', nameEn: 'circle upper right' },
      { symbol: '◕', name: '右上缺口圈', nameEn: 'circle all but upper' },
      { symbol: '◖', name: '左半黑圈', nameEn: 'left half black' },
      { symbol: '◗', name: '右半黑圈', nameEn: 'right half black' },
    ],
  },
  {
    id: 'power',
    name: '上标下标',
    icon: '²³¹',
    symbols: [
      { symbol: '⁰', name: '上标0', nameEn: 'superscript 0' },
      { symbol: '¹', name: '上标1', nameEn: 'superscript 1' },
      { symbol: '²', name: '上标2', nameEn: 'superscript 2' },
      { symbol: '³', name: '上标3', nameEn: 'superscript 3' },
      { symbol: '⁴', name: '上标4', nameEn: 'superscript 4' },
      { symbol: '⁵', name: '上标5', nameEn: 'superscript 5' },
      { symbol: '⁶', name: '上标6', nameEn: 'superscript 6' },
      { symbol: '⁷', name: '上标7', nameEn: 'superscript 7' },
      { symbol: '⁸', name: '上标8', nameEn: 'superscript 8' },
      { symbol: '⁹', name: '上标9', nameEn: 'superscript 9' },
      { symbol: '⁺', name: '上标加号', nameEn: 'superscript plus' },
      { symbol: '⁻', name: '上标减号', nameEn: 'superscript minus' },
      { symbol: '⁼', name: '上标等号', nameEn: 'superscript equals' },
      { symbol: '⁽', name: '上标左括号', nameEn: 'superscript left paren' },
      { symbol: '⁾', name: '上标右括号', nameEn: 'superscript right paren' },
      { symbol: 'ⁿ', name: '上标n', nameEn: 'superscript n' },
      { symbol: 'ⁱ', name: '上标i', nameEn: 'superscript i' },
      { symbol: '₀', name: '下标0', nameEn: 'subscript 0' },
      { symbol: '₁', name: '下标1', nameEn: 'subscript 1' },
      { symbol: '₂', name: '下标2', nameEn: 'subscript 2' },
      { symbol: '₃', name: '下标3', nameEn: 'subscript 3' },
      { symbol: '₄', name: '下标4', nameEn: 'subscript 4' },
      { symbol: '₅', name: '下标5', nameEn: 'subscript 5' },
      { symbol: '₆', name: '下标6', nameEn: 'subscript 6' },
      { symbol: '₇', name: '下标7', nameEn: 'subscript 7' },
      { symbol: '₈', name: '下标8', nameEn: 'subscript 8' },
      { symbol: '₉', name: '下标9', nameEn: 'subscript 9' },
      { symbol: '₊', name: '下标加号', nameEn: 'subscript plus' },
      { symbol: '₋', name: '下标减号', nameEn: 'subscript minus' },
      { symbol: '₌', name: '下标等号', nameEn: 'subscript equals' },
      { symbol: '₍', name: '下标左括号', nameEn: 'subscript left paren' },
      { symbol: '₎', name: '下标右括号', nameEn: 'subscript right paren' },
      { symbol: 'ₐ', name: '下标a', nameEn: 'subscript a' },
      { symbol: 'ₑ', name: '下标e', nameEn: 'subscript e' },
      { symbol: 'ₒ', name: '下标o', nameEn: 'subscript o' },
      { symbol: 'ₓ', name: '下标x', nameEn: 'subscript x' },
      { symbol: 'ₕ', name: '下标h', nameEn: 'subscript h' },
      { symbol: 'ₖ', name: '下标k', nameEn: 'subscript k' },
      { symbol: 'ₗ', name: '下标l', nameEn: 'subscript l' },
      { symbol: 'ₘ', name: '下标m', nameEn: 'subscript m' },
      { symbol: 'ₙ', name: '下标n', nameEn: 'subscript n' },
      { symbol: 'ₚ', name: '下标p', nameEn: 'subscript p' },
      { symbol: 'ₛ', name: '下标s', nameEn: 'subscript s' },
      { symbol: 'ₜ', name: '下标t', nameEn: 'subscript t' },
    ],
  },
]

const STORAGE_KEY = 'symbols-most-used'

export default function Symbols() {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [mostUsed, setMostUsed] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null)

  // Save most used to localStorage
  const updateMostUsed = (symbol: string) => {
    const newMostUsed = { ...mostUsed, [symbol]: (mostUsed[symbol] || 0) + 1 }
    setMostUsed(newMostUsed)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMostUsed))
    } catch {
      // Ignore errors
    }
  }

  // Copy to clipboard
  const copySymbol = (symbol: string) => {
    navigator.clipboard.writeText(symbol).then(() => {
      setCopiedSymbol(symbol)
      updateMostUsed(symbol)
      setTimeout(() => setCopiedSymbol(null), 1500)
    })
  }

  // Get most used symbols sorted by count
  const mostUsedSymbols = useMemo(() => {
    const sorted = Object.entries(mostUsed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
    return sorted.map(([symbol]) => symbol)
  }, [mostUsed])

  // Search across all categories
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    const results: SymbolItem[] = []
    for (const cat of categories) {
      for (const item of cat.symbols) {
        if (
          item.symbol.includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.nameEn.toLowerCase().includes(query)
        ) {
          results.push(item)
        }
      }
    }
    return results
  }, [searchQuery])

  const activeSymbols = categories.find((c) => c.id === activeCategory)?.symbols || []

  return (
    <ToolLayout
      title="特殊符号"
      description="常用符号大全，支持搜索和复制"
    >
      <div className="symbols-container">
        {/* Search Bar */}
        <div className="symbols-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="搜索符号、名称或英文..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="symbols-search-input"
          />
          {searchQuery && (
            <button
              className="symbols-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="symbols-main">
          {/* Sidebar - Category List */}
          <nav className="symbols-sidebar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`symbols-category-btn ${
                  activeCategory === cat.id && !searchResults ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSearchQuery('')
                }}
              >
                <span className="symbols-category-icon">{cat.icon}</span>
                <span className="symbols-category-name">{cat.name}</span>
                <span className="symbols-category-count">{cat.symbols.length}</span>
              </button>
            ))}
          </nav>

          {/* Main Content - Symbol Grid */}
          <div className="symbols-content">
            {/* Most Used Section */}
            {mostUsedSymbols.length > 0 && !searchResults && (
              <div className="symbols-section">
                <h3 className="symbols-section-title">
                  <Star size={16} />
                  最常用
                </h3>
                <div className="symbols-grid">
                  {mostUsedSymbols.map((symbol) => {
                    const item = categories
                      .flatMap((c) => c.symbols)
                      .find((s) => s.symbol === symbol)
                    return (
                      <button
                        key={symbol}
                        className={`symbols-item ${copiedSymbol === symbol ? 'copied' : ''}`}
                        onClick={() => copySymbol(symbol)}
                        title={item ? `${item.name} (${item.nameEn})` : symbol}
                      >
                        <span className="symbols-char">{symbol}</span>
                        <span className="symbols-name">{item?.name || symbol}</span>
                        {copiedSymbol === symbol && (
                          <span className="symbols-copied">
                            <Check size={14} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults !== null && (
              <div className="symbols-section">
                <h3 className="symbols-section-title">
                  <Search size={16} />
                  搜索结果 ({searchResults.length})
                </h3>
                {searchResults.length > 0 ? (
                  <div className="symbols-grid">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.symbol}-${item.name}`}
                        className={`symbols-item ${copiedSymbol === item.symbol ? 'copied' : ''}`}
                        onClick={() => copySymbol(item.symbol)}
                        title={`${item.name} (${item.nameEn})`}
                      >
                        <span className="symbols-char">{item.symbol}</span>
                        <span className="symbols-name">{item.name}</span>
                        {copiedSymbol === item.symbol && (
                          <span className="symbols-copied">
                            <Check size={14} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="symbols-no-results">未找到匹配的符号</p>
                )}
              </div>
            )}

            {/* Category Symbols */}
            {!searchResults && (
              <div className="symbols-section">
                <h3 className="symbols-section-title">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h3>
                <div className="symbols-grid">
                  {activeSymbols.map((item) => (
                    <button
                      key={`${item.symbol}-${item.name}`}
                      className={`symbols-item ${copiedSymbol === item.symbol ? 'copied' : ''}`}
                      onClick={() => copySymbol(item.symbol)}
                      title={`${item.name} (${item.nameEn})`}
                    >
                      <span className="symbols-char">{item.symbol}</span>
                      <span className="symbols-name">{item.name}</span>
                      {copiedSymbol === item.symbol && (
                        <span className="symbols-copied">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .symbols-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        .symbols-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 10px;
          border: 1px solid var(--border, #2d2d3d);
        }

        .symbols-search svg {
          color: var(--text-secondary, #888);
          flex-shrink: 0;
        }

        .symbols-search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text, #fff);
          font-size: 14px;
          outline: none;
        }

        .symbols-search-input::placeholder {
          color: var(--text-secondary, #888);
        }

        .symbols-search-clear {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          font-size: 18px;
          padding: 0 4px;
          line-height: 1;
        }

        .symbols-search-clear:hover {
          color: var(--text, #fff);
        }

        .symbols-main {
          display: flex;
          gap: 16px;
          flex: 1;
          min-height: 0;
        }

        .symbols-sidebar {
          width: 160px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .symbols-category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          color: var(--text-secondary, #888);
        }

        .symbols-category-btn:hover {
          background: var(--bg-secondary, #1e1e2e);
          color: var(--text, #fff);
        }

        .symbols-category-btn.active {
          background: var(--accent, #6366f1);
          color: #fff;
        }

        .symbols-category-icon {
          font-size: 16px;
          width: 28px;
          text-align: center;
        }

        .symbols-category-name {
          flex: 1;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .symbols-category-count {
          font-size: 11px;
          opacity: 0.7;
        }

        .symbols-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .symbols-section {
          margin-bottom: 24px;
        }

        .symbols-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #888);
          margin-bottom: 12px;
        }

        .symbols-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 8px;
        }

        .symbols-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 12px 8px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border, #2d2d3d);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .symbols-item:hover {
          background: var(--bg-tertiary, #252536);
          border-color: var(--accent, #6366f1);
          transform: translateY(-2px);
        }

        .symbols-item.copied {
          background: rgba(34, 197, 94, 0.2);
          border-color: #22c55e;
        }

        .symbols-char {
          font-size: 24px;
          line-height: 1;
          color: var(--text, #fff);
        }

        .symbols-name {
          font-size: 10px;
          color: var(--text-secondary, #888);
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .symbols-copied {
          position: absolute;
          top: 4px;
          right: 4px;
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .symbols-no-results {
          text-align: center;
          color: var(--text-secondary, #888);
          padding: 40px 20px;
        }

        @media (max-width: 640px) {
          .symbols-main {
            flex-direction: column;
          }

          .symbols-sidebar {
            width: 100%;
            flex-direction: row;
            flex-wrap: wrap;
            overflow-x: auto;
            padding-right: 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border, #2d2d3d);
          }

          .symbols-category-btn {
            padding: 8px 12px;
            white-space: nowrap;
          }

          .symbols-category-count {
            display: none;
          }

          .symbols-content {
            padding-right: 0;
          }

          .symbols-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          }

          .symbols-char {
            font-size: 20px;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
