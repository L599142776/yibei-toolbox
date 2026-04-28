// UUID 生成器 - 支持多版本 UUID 生成

import { useState } from 'react'
import { Copy, RefreshCw, Info } from 'lucide-react'
import { v1, v4, v6, v7 } from 'uuid'
import ToolLayout from '../../components/ToolLayout'

// UUID 版本类型
type UuidVersion = 'v1' | 'v4' | 'v6' | 'v7'

// UUID 版本详细配置
interface UuidVersionDetail {
  value: UuidVersion
  label: string
  shortDesc: string
  description: string
  rules: string[]
  useCases: string[]
  example: string
}

// UUID 版本列表
const UUID_VERSIONS: UuidVersionDetail[] = [
  {
    value: 'v1',
    label: 'UUID v1',
    shortDesc: '基于时间戳和 MAC 地址',
    description: 'UUID v1 基于时间戳（60位）+ MAC地址（48位）+ 时钟序列（14位）+ 版本号（4位）生成，包含时间和节点信息',
    rules: [
      '时间戳：使用 60 位时间戳（从 1582-10-15 开始的 100 纳秒间隔数）',
      '时钟序列：14 位，用于防止时钟回拨导致的重复',
      '节点标识：48 位 MAC 地址，唯一标识生成设备',
      '版本标识：第 13 位字符固定为 "1"',
      '变体标识：第 17 位字符固定为 "8", "9", "a" 或 "b"',
    ],
    useCases: ['需要追踪生成时间和设备的场景', '分布式系统中需要时序排序', '日志追踪和审计'],
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  },
  {
    value: 'v4',
    label: 'UUID v4',
    shortDesc: '基于随机数生成，最常用',
    description: 'UUID v4 完全基于随机数生成，122 位随机位提供 2^122 种可能，碰撞概率极低',
    rules: [
      '随机位：122 位完全随机生成',
      '版本标识：第 13 位字符固定为 "4"',
      '变体标识：第 17 位字符固定为 "8", "9", "a" 或 "b"',
      '不依赖时间戳或 MAC 地址',
      '每次生成都是独立随机的',
    ],
    useCases: ['通用唯一标识符需求', '会话 ID、请求 ID', '数据库主键（非时序场景）', 'API 密钥、令牌'],
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
  {
    value: 'v6',
    label: 'UUID v6',
    shortDesc: '基于时间戳的有序 UUID',
    description: 'UUID v6 是 v1 的改进版，将时间戳放在高位，使 UUID 按时间单调递增，便于数据库索引',
    rules: [
      '时间戳：48 位 Unix 时间戳（秒）放在最高位',
      '时间精度：额外 12 位亚毫秒时间精度',
      '时钟序列：14 位，防止时钟回拨重复',
      '节点标识：48 位 MAC 地址或随机节点 ID',
      '版本标识：第 13 位字符固定为 "6"',
      '按字典序排序即按时间排序',
    ],
    useCases: ['需要时序排序的数据库主键', '时间序列数据标识', '日志和事件追踪', '需要 v1 特性但要求有序性'],
    example: '1e8400e2-9b41-6d4a-a716-446655440000',
  },
  {
    value: 'v7',
    label: 'UUID v7',
    shortDesc: '基于 Unix 时间戳，最新推荐',
    description: 'UUID v7 基于 Unix 时间戳（毫秒）+ 随机数，按时间单调递增，数据库友好，性能优异',
    rules: [
      '时间戳：48 位 Unix 时间戳（毫秒级）放在最高位',
      '随机位：74 位随机数据',
      '版本标识：第 13 位字符固定为 "7"',
      '变体标识：第 17 位字符固定为 "8", "9", "a" 或 "b"',
      '按字典序排序即按时间排序',
      '无需 MAC 地址，保护隐私',
    ],
    useCases: ['数据库主键（强烈推荐）', '分布式系统 ID 生成', '时间序列数据', '高并发场景下的 ID 生成', '替代雪花算法'],
    example: '018f3b7c-7b0c-7e6a-8b5d-5c5c5c5c5c5c',
  },
]

// 根据版本生成 UUID
function generateUUIDByVersion(version: UuidVersion): string {
  switch (version) {
    case 'v1':
      return v1()
    case 'v4':
      return v4()
    case 'v6':
      return v6()
    case 'v7':
      return v7()
    default:
      return v4()
  }
}

export default function UuidGenerator() {
  // 当前选择的 UUID 版本
  const [version, setVersion] = useState<UuidVersion>('v4')
  // 生成数量
  const [count, setCount] = useState(1)
  // UUID 列表
  const [uuids, setUuids] = useState<string[]>(() => [generateUUIDByVersion('v4')])
  // 是否大写
  const [upper, setUpper] = useState(false)
  // 是否移除连字符
  const [removeHyphens, setRemoveHyphens] = useState(false)
  // 显示版本说明
  const [showVersionInfo, setShowVersionInfo] = useState(false)

  // 格式化 UUID（根据大小写和连字符设置）
  const formatUUID = (uuid: string): string => {
    let result = uuid
    if (removeHyphens) {
      result = result.replace(/-/g, '')
    }
    if (upper) {
      result = result.toUpperCase()
    } else {
      result = result.toLowerCase()
    }
    return result
  }

  // 重新生成 UUID
  const regenerate = () => {
    const arr = Array.from({ length: count }, () => generateUUIDByVersion(version))
    setUuids(arr.map(formatUUID))
  }

  // 复制全部 UUID
  const copyAll = () => navigator.clipboard.writeText(uuids.join('\n'))

  // 切换版本时重新生成
  const handleVersionChange = (newVersion: UuidVersion) => {
    setVersion(newVersion)
    const arr = Array.from({ length: count }, () => generateUUIDByVersion(newVersion))
    setUuids(arr.map(formatUUID))
  }

  // 获取当前版本的说明
  const currentVersionInfo = UUID_VERSIONS.find((v) => v.value === version)

  return (
    <ToolLayout
      title="UUID 生成器"
      description="支持 UUID v1、v4、v6、v7 多版本生成"
    >
      <div className="uuid-generator">
        {/* 版本选择区域 */}
        <div className="uuid-section">
          <div className="uuid-section-header">
            <label className="uuid-label">UUID 版本:</label>
            <button
              className="uuid-info-btn"
              onClick={() => setShowVersionInfo(!showVersionInfo)}
              title="查看版本说明"
            >
              <Info size={16} />
            </button>
          </div>

          {/* 版本选择按钮组 */}
          <div className="uuid-version-buttons">
            {UUID_VERSIONS.map((v) => (
              <button
                key={v.value}
                className={`uuid-version-btn ${version === v.value ? 'active' : ''}`}
                onClick={() => handleVersionChange(v.value)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* 版本详细说明 */}
          {showVersionInfo && currentVersionInfo && (
            <div className="uuid-version-detail">
              {/* 版本简介 */}
              <div className="uuid-detail-section">
                <h4 className="uuid-detail-title">📋 版本简介</h4>
                <p className="uuid-detail-desc">{currentVersionInfo.description}</p>
              </div>

              {/* 生成规则 */}
              <div className="uuid-detail-section">
                <h4 className="uuid-detail-title">🔧 生成规则</h4>
                <ul className="uuid-detail-list">
                  {currentVersionInfo.rules.map((rule, index) => (
                    <li key={index} className="uuid-detail-item">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* 适用场景 */}
              <div className="uuid-detail-section">
                <h4 className="uuid-detail-title">💡 适用场景</h4>
                <div className="uuid-use-cases">
                  {currentVersionInfo.useCases.map((useCase, index) => (
                    <span key={index} className="uuid-use-case-tag">{useCase}</span>
                  ))}
                </div>
              </div>

              {/* 格式示例 */}
              <div className="uuid-detail-section">
                <h4 className="uuid-detail-title">📝 格式示例</h4>
                <code className="uuid-example">{currentVersionInfo.example}</code>
              </div>
            </div>
          )}
        </div>

        {/* 设置区域 */}
        <div className="uuid-section">
          <div className="uuid-settings-row">
            {/* 数量设置 */}
            <div className="uuid-setting-item">
              <label className="uuid-label">生成数量:</label>
              <input
                className="uuid-input"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => {
                  const newCount = Math.max(1, Math.min(100, Number(e.target.value)))
                  setCount(newCount)
                }}
              />
            </div>

            {/* 格式选项 */}
            <div className="uuid-format-options">
              <label className="uuid-checkbox">
                <input
                  type="checkbox"
                  checked={upper}
                  onChange={(e) => {
                    setUpper(e.target.checked)
                    setUuids(uuids.map(formatUUID))
                  }}
                />
                <span>大写</span>
              </label>
              <label className="uuid-checkbox">
                <input
                  type="checkbox"
                  checked={removeHyphens}
                  onChange={(e) => {
                    setRemoveHyphens(e.target.checked)
                    setUuids(uuids.map(formatUUID))
                  }}
                />
                <span>移除连字符</span>
              </label>
            </div>
          </div>
        </div>

        {/* 输出区域 */}
        <div className="uuid-section">
          <label className="uuid-label">生成的 UUID:</label>
          <div className="uuid-output">
            {uuids.map((uuid, index) => (
              <div key={index} className="uuid-item">
                <span className="uuid-index">{index + 1}.</span>
                <code className="uuid-value">{uuid}</code>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="uuid-actions">
          <button className="uuid-btn uuid-btn-primary" onClick={regenerate}>
            <RefreshCw size={16} /> 重新生成
          </button>
          <button className="uuid-btn uuid-btn-secondary" onClick={copyAll}>
            <Copy size={16} /> 复制全部
          </button>
        </div>
      </div>

      {/* 样式 */}
      <style>{`
        .uuid-generator {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .uuid-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .uuid-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .uuid-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .uuid-info-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .uuid-info-btn:hover {
          background: var(--bg-hover);
          color: var(--accent);
        }

        .uuid-version-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .uuid-version-btn {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }

        .uuid-version-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .uuid-version-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .uuid-version-detail {
          padding: 20px;
          background: var(--bg-input);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .uuid-detail-section {
          margin-bottom: 20px;
        }

        .uuid-detail-section:last-child {
          margin-bottom: 0;
        }

        .uuid-detail-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .uuid-detail-desc {
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.6;
          margin: 0;
        }

        .uuid-detail-list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.8;
        }

        .uuid-detail-item {
          margin-bottom: 4px;
        }

        .uuid-detail-item:last-child {
          margin-bottom: 0;
        }

        .uuid-use-cases {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .uuid-use-case-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          font-size: 12px;
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.1);
          border-radius: 20px;
          border: 1px solid rgba(var(--accent-rgb), 0.2);
        }

        .uuid-example {
          display: block;
          padding: 12px 16px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          color: var(--text);
          background: var(--bg-card);
          border-radius: 8px;
          border: 1px solid var(--border);
          word-break: break-all;
        }

        .uuid-settings-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
        }

        .uuid-setting-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .uuid-input {
          width: 80px;
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text);
          outline: none;
        }

        .uuid-input:focus {
          border-color: var(--accent);
        }

        .uuid-format-options {
          display: flex;
          gap: 16px;
        }

        .uuid-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
        }

        .uuid-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .uuid-output {
          padding: 16px;
          background: var(--bg-input);
          border-radius: 8px;
          border: 1px solid var(--border);
          max-height: 300px;
          overflow-y: auto;
        }

        .uuid-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }

        .uuid-item:last-child {
          border-bottom: none;
        }

        .uuid-index {
          font-size: 12px;
          color: var(--text-muted);
          min-width: 24px;
        }

        .uuid-value {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 14px;
          color: var(--text);
          word-break: break-all;
        }

        .uuid-actions {
          display: flex;
          gap: 12px;
        }

        .uuid-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .uuid-btn-primary {
          background: var(--accent);
          color: white;
        }

        .uuid-btn-primary:hover {
          background: var(--accent-hover);
        }

        .uuid-btn-secondary {
          background: var(--bg-card);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .uuid-btn-secondary:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
        }
      `}</style>
    </ToolLayout>
  )
}
