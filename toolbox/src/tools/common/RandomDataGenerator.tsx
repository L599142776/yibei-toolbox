// src/tools/common/RandomDataGenerator.tsx
import { useState, useCallback, useMemo } from 'react'
import { Copy, RefreshCw, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import DataTable from '../../components/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

// ============ Generator Functions ============

function randomInt(min: number, max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return min + (arr[0] % (max - min + 1))
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(): string {
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '漕', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文']
  const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '飞', '鹏', '辉', '红', '兰', '玉兰', '玲', '建军', '建国', '建军', '志强', '永强', '建华', '建华', '秀珍', '桂兰', '丹', '凤', '婷', '欣', '宇', '晨', '欣怡', '思雨', '子轩', '梓涵', '浩然', '一诺', '子墨', '雨萱']
  const hasTwoChars = Math.random() > 0.3
  const surname = randomElement(surnames)
  const givenName = hasTwoChars ? randomElement(givenNames.filter(n => n.length === 2)) : randomElement(givenNames.filter(n => n.length === 1))
  return surname + givenName
}

function generateEmail(): string {
  const prefixes = ['test', 'user', 'admin', 'demo', 'hello', 'guest', 'info', 'support', 'service', 'contact', 'zhang', 'wang', 'li', 'chen', 'liu', 'yang', 'zhao', 'huang', 'wu', 'zhou', 'xu', 'sun', 'hu', 'zhu', 'gao', 'lin', 'he', 'guo', 'ma', 'luo']
  const domains = ['gmail.com', 'qq.com', '163.com', '126.com', 'outlook.com', 'hotmail.com', 'sina.com', 'sohu.com', '139.com', '189.com', 'aliyun.com', 'foxmail.com']
  const prefix = randomElement(prefixes) + randomInt(1, 999)
  const domain = randomElement(domains)
  return `${prefix}@${domain}`
}

function generatePhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '147', '150', '151', '152', '153', '155', '156', '157', '158', '159', '166', '170', '171', '172', '173', '175', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '191', '193', '195', '197', '198', '199']
  const prefix = randomElement(prefixes)
  const suffix = String(randomInt(10000000, 99999999))
  return prefix + suffix
}

function generateAddress(): string {
  const provinces = ['北京市', '上海市', '天津市', '重庆市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '湖南省', '河南省', '河北省', '山东省', '陕西省', '安徽省', '福建省', '江西省', '云南省', '贵州省', '辽宁省', '吉林省', '黑龙江省', '内蒙古', '新疆', '宁夏', '青海省', '甘肃省', '西藏', '广西', '海南省']
  const cities = ['市辖区', '市', '县']
  const districts = ['朝阳区', '海淀区', '西城区', '东城区', '浦东新区', '徐汇区', '黄浦区', '静安区', '天河区', '越秀区', '白云区', '南山区', '福田区', '罗湖区', '锦江区', '武侯区', '青羊区', '江岸区', '江汉区', '硚口区', '西湖区', '拱墅区', '江干区', '滨江区', '庐阳区', '蜀山区', '包河区', '芙蓉区', '岳麓区', '雨花区']
  const streets = ['人民路', '建设路', '解放路', '中山路', '长江路', '黄河路', '和平路', '胜利路', '幸福路', '光明路', '新华路', '文化路', '体育路', '园林路', '公园路', '大学路', '学院路', '科技路', '创新路', '发展路']
  const province = randomElement(provinces)
  const city = randomElement(cities)
  const district = randomElement(districts)
  const street = randomElement(streets)
  const number = randomInt(1, 999)
  return `${province}${city}${district}${street}${number}号`
}

function generateDate(): string {
  const year = randomInt(1990, 2025)
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function generateUUID(): string {
  return crypto.randomUUID()
}

function generateChineseId(): string {
  const addresses = ['110101', '310101', '440103', '320105', '510104', '420102', '610103', '330105', '210102', '500101', '130102', '370202', '140102', '410102', '210202', '500102', '320202', '330102', '440100', '350200']
  const addressCode = randomElement(addresses)
  const birthYear = randomInt(1950, 2005)
  const birthMonth = randomInt(1, 12)
  const birthDay = randomInt(1, 28)
  const birthCode = `${birthYear}${String(birthMonth).padStart(2, '0')}${String(birthDay).padStart(2, '0')}`
  const sequence = String(randomInt(100, 999))
  const front17 = addressCode + birthCode + sequence
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(front17[i]) * weights[i]
  }
  const checkCode = checkCodes[sum % 11]
  return front17 + checkCode
}

function generateIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
}

function generateURL(): string {
  const domains = ['example.com', 'demo.com', 'test.com', 'website.com', 'app.com', 'service.com', 'api.com', 'web.com', 'site.com', 'online.com']
  const protocols = ['http://', 'https://']
  const paths = ['', '/', '/home', '/about', '/contact', '/products', '/services', '/blog', '/news', '/user']
  const protocol = randomElement(protocols)
  const domain = randomElement(domains)
  const path = randomElement(paths)
  return `${protocol}${domain}${path}`
}

// ============ Data Type Config ============

interface DataTypeConfig {
  id: string
  label: string
  generator: () => string
}

const DATA_TYPES: DataTypeConfig[] = [
  { id: 'name', label: '姓名', generator: generateName },
  { id: 'email', label: '邮箱', generator: generateEmail },
  { id: 'phone', label: '手机号', generator: generatePhone },
  { id: 'address', label: '地址', generator: generateAddress },
  { id: 'date', label: '日期', generator: generateDate },
  { id: 'uuid', label: 'UUID', generator: generateUUID },
  { id: 'idCard', label: '身份证', generator: generateChineseId },
  { id: 'ip', label: 'IP地址', generator: generateIP },
  { id: 'url', label: 'URL', generator: generateURL },
]

// ============ Component ============

export default function RandomDataGenerator() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['name', 'email', 'phone'])
  const [count, setCount] = useState(10)
  const [results, setResults] = useState<string[][]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const toggleType = useCallback((id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }, [])

  const generate = useCallback(() => {
    if (selectedTypes.length === 0) return
    const data: string[][] = []
    for (let i = 0; i < count; i++) {
      const row = selectedTypes.map(type => {
        const config = DATA_TYPES.find(d => d.id === type)
        return config ? config.generator() : ''
      })
      data.push(row)
    }
    setResults(data)
  }, [selectedTypes, count])

  const copyRow = useCallback((index: number) => {
    const row = results[index]
    if (row) {
      navigator.clipboard.writeText(row.join('\t'))
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    }
  }, [results])

  const copyAll = useCallback(() => {
    if (results.length === 0) return
    const text = results.map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }, [results])

  const resultTableRows = useMemo(() => {
    return results.map((row, index) => {
      const rec: Record<string, unknown> = { __idx: index + 1 }
      for (let i = 0; i < selectedTypes.length; i++) {
        rec[`col_${i}`] = row[i] ?? ''
      }
      return rec
    })
  }, [results, selectedTypes.length])

  const resultTableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const cols: ColumnDef<Record<string, unknown>>[] = [
      {
        accessorKey: '__idx',
        header: '#',
        size: 60,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
        cell: ({ getValue }) => <span style={{ color: 'var(--text-secondary)' }}>{String(getValue() ?? '')}</span>,
      },
    ]

    cols.push(
      ...selectedTypes.map((type, i) => {
        const config = DATA_TYPES.find(d => d.id === type)
        return {
          accessorKey: `col_${i}`,
          header: config?.label ?? type,
          size: 160,
          enableSorting: false,
          cell: ({ getValue }) => <span style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{String(getValue() ?? '')}</span>,
        } satisfies ColumnDef<Record<string, unknown>>
      })
    )

    cols.push({
      id: '__actions__',
      header: () => <div style={{ width: '100%', textAlign: 'right' }}>操作</div>,
      size: 110,
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const idx = row.index
        return (
          <button
            onClick={() => copyRow(idx)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copiedIndex === idx ? 'var(--success)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              marginLeft: 'auto',
            }}
          >
            {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
            {copiedIndex === idx ? '已复制' : '复制'}
          </button>
        )
      },
    })

    return cols
  }, [copiedIndex, copyRow, selectedTypes])

  return (
    <ToolLayout title="随机数据生成器" description="生成 Mock 测试数据，支持姓名、邮箱、手机号、地址等多种类型">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, minHeight: 500 }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              数据类型
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DATA_TYPES.map(type => (
                <label
                  key={type.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => toggleType(type.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              生成数量
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                className="input"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>条 (1-100)</span>
            </div>
          </div>

          <button
            className="btn"
            onClick={generate}
            disabled={selectedTypes.length === 0}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <RefreshCw size={16} />
            生成数据
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {selectedTypes.length > 0
              ? `已选择 ${selectedTypes.length} 种类型，每行TAB分隔`
              : '请至少选择一种数据类型'}
          </div>
        </div>

        {/* Right Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              生成结果
              {results.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>({results.length} 条)</span>}
            </h3>
            {results.length > 0 && (
              <button
                className="btn btn-outline"
                onClick={copyAll}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
              >
                {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                {copiedAll ? '已复制' : '复制全部'}
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {results.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}>
                点击"生成数据"开始生成
              </div>
            ) : (
              <DataTable
                data={resultTableRows}
                columns={resultTableColumns}
                maxHeight={560}
                rowHeight={36}
                headerHeight={40}
                getRowStyle={(_, rowIndex) => ({
                  borderBottom: '1px solid var(--border)',
                  background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)',
                })}
              />
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
