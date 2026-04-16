// UUID 生成器 - 支持多版本 UUID 生成

import { useState } from 'react'
import { Copy, RefreshCw, Info } from 'lucide-react'
import { v1, v4, v6, v7 } from 'uuid'
import ToolLayout from '../../components/ToolLayout'

// UUID 版本类型
type UuidVersion = 'v1' | 'v4' | 'v6' | 'v7'

// UUID 版本配置
interface UuidVersionConfig {
  value: UuidVersion
  label: string
  description: string
}

// UUID 版本列表
const UUID_VERSIONS: UuidVersionConfig[] = [
  {
    value: 'v1',
    label: 'UUID v1',
    description: '基于时间戳和 MAC 地址，包含时间和节点信息',
  },
  {
    value: 'v4',
    label: 'UUID v4',
    description: '基于随机数生成，最常用，完全随机',
  },
  {
    value: 'v6',
    label: 'UUID v6',
    description: '基于时间戳的有序 UUID，改进版 v1，按时间排序',
  },
  {
    value: 'v7',
    label: 'UUID v7',
    description: '基于 Unix 时间戳的有序 UUID，最新推荐，数据库友好',
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

          {/* 版本说明 */}
          {showVersionInfo && currentVersionInfo && (
            <div className="uuid-version-info">
              <strong>{currentVersionInfo.label}:</strong> {currentVersionInfo.description}
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

        .uuid-version-info {
          padding: 12px 16px;
          background: var(--bg-input);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.5;
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
