// src/tools/network/Github加速.tsx
import { useState, useEffect, useCallback } from 'react'
import { Copy, Download, Link2, Check, ExternalLink, RefreshCw, Loader2, FileArchive, Github } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

const MIRRORS = [
  { name: 'ghproxy.com', prefix: 'https://ghproxy.com/', url: 'https://www.ghproxy.com/' },
  { name: 'mirror.ghproxy.com', prefix: 'https://mirror.ghproxy.com/', url: 'https://mirror.ghproxy.com/' },
  { name: 'hub.fastgit.xyz', prefix: 'https://hub.fastgit.xyz/', url: 'https://hub.fastgit.xyz/' },
  { name: 'gh.llkk.cc', prefix: 'https://gh.llkk.cc/', url: 'https://gh.llkk.cc/' },
]

const PATTERNS = [
  { regex: /github\.com\/([^\/]+)\/([^\/]+)\/releases\/download\/([^\/]+)\/(.+)/, type: 'release' },
  { regex: /github\.com\/([^\/]+)\/([^\/]+)\/archive\/(.+)/, type: 'archive' },
  { regex: /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)/, type: 'raw' },
  { regex: /api\.github\.com\/repos\/([^\/]+)\/([^\/]+)\/releases\/assets\/(\d+)/, type: 'api-release' },
]

interface MirrorResult {
  name: string
  url: string
  homepage: string
  copied: boolean
}

interface ReleaseAsset {
  id: number
  name: string
  size: number
  download_count: number
  browser_download_url: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export default function Github加速() {
  const [input, setInput] = useState('')
  const [mirrors, setMirrors] = useState<MirrorResult[]>([])
  const [urlType, setUrlType] = useState<string>('')
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null)
  const [allCopied, setAllCopied] = useState(false)
  const [releaseAssets, setReleaseAssets] = useState<ReleaseAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [assetError, setAssetError] = useState('')

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text')
      if (text && text.includes('github.com')) {
        setInput(text)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  useEffect(() => {
    if (!input.trim()) {
      setMirrors([])
      setUrlType('')
      setRepoInfo(null)
      setReleaseAssets([])
      return
    }

    let matched = false
    let owner = ''
    let repo = ''

    for (const pattern of PATTERNS) {
      const match = input.match(pattern.regex)
      if (match) {
        matched = true
        if (pattern.type === 'raw') {
          owner = match[1]
          repo = match[2]
        } else if (pattern.type === 'api-release') {
          owner = match[1]
          repo = match[2]
        } else {
          owner = match[1]
          repo = match[2]
        }
        setUrlType(pattern.type)
        setRepoInfo({ owner, repo })
        break
      }
    }
    
    if (!matched) {
      const releasePageMatch = input.match(/github\.com\/([^\/]+)\/([^\/]+)\/releases/)
      const repoPageMatch = input.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\/|$)/)

      if (releasePageMatch) {
        owner = releasePageMatch[1]
        repo = releasePageMatch[2]
        setUrlType('release-page')
        setRepoInfo({ owner, repo })
        fetchReleaseAssets(owner, repo)
      } else if (repoPageMatch) {
        owner = repoPageMatch[1]
        repo = repoPageMatch[2]
        setUrlType('repo-page')
        setRepoInfo({ owner, repo })
        setReleaseAssets([])
      } else {
        setUrlType('')
        setRepoInfo(null)
        setReleaseAssets([])
      }
      return
    }

    let downloadUrl = input.trim()

    downloadUrl = downloadUrl.replace(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)/,
      'github.com/$1/$2/raw/$3')

    downloadUrl = downloadUrl.replace(/api\.github\.com\/repos\/([^\/]+)\/([^\/]+)\/releases\/assets\/(\d+)/,
      'github.com/$1/$2/releases/download/latest/unknown')

    const newMirrors = MIRRORS.map(m => ({
      name: m.name,
      url: m.prefix + downloadUrl,
      homepage: m.url,
      copied: false,
    }))
    setMirrors(newMirrors)
    setReleaseAssets([])
  }, [input])

  const fetchReleaseAssets = async (owner: string, repo: string) => {
    setLoadingAssets(true)
    setAssetError('')
    setReleaseAssets([])

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)
      if (!response.ok) {
        throw new Error('Failed to fetch release info')
      }
      const data = await response.json()

      if (data.assets && data.assets.length > 0) {
        setReleaseAssets(data.assets.map((a: any) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          download_count: a.download_count || 0,
          browser_download_url: a.browser_download_url,
        })))
      } else {
        setAssetError('No assets found in latest release')
      }
    } catch (err) {
      setAssetError('Failed to fetch release info. Rate limit may be exceeded.')
    } finally {
      setLoadingAssets(false)
    }
  }
  
  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
  }, [])
  
  const copyAllMirrors = useCallback(async () => {
    const allUrls = mirrors.map(m => m.url).join('\n')
    await copyToClipboard(allUrls)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
  }, [mirrors, copyToClipboard])
  
  const copyMirror = useCallback((index: number) => {
    copyToClipboard(mirrors[index].url)
    setMirrors(prev => prev.map((m, i) => i === index ? { ...m, copied: true } : m))
    setTimeout(() => {
      setMirrors(prev => prev.map((m, i) => i === index ? { ...m, copied: false } : m))
    }, 1500)
  }, [copyToClipboard])
  
  const openInBrowser = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const generateAssetMirrors = (assetUrl: string): MirrorResult[] => {
    return MIRRORS.map(m => ({
      name: m.name,
      url: m.prefix + assetUrl,
      homepage: m.url,
      copied: false,
    }))
  }

  const exampleUrls = [
    { label: 'Release 下载', url: 'https://github.com/electron/electron/releases/download/v28.0.0/electron-v28.0.0-linux-x64.zip' },
    { label: '源码归档', url: 'https://github.com/facebook/react/archive/refs/heads/main.zip' },
    { label: 'Raw 文件', url: 'https://raw.githubusercontent.com/torvalds/linux/master/README' },
  ]

  return (
    <ToolLayout
      title="GitHub 加速"
      description="将 GitHub 下载链接转换为镜像加速地址，支持多种镜像源"
    >
      <div className="tool-section">
        <label className="tool-label">
          <Link2 size={14} style={{ marginRight: 6 }} />
          GitHub 链接
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 GitHub 下载链接或 Release 页面地址..."
            style={{ flex: 1 }}
          />
          {input && (
            <button 
              className="btn btn-outline" 
              onClick={() => setInput('')}
              title="清空"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="tool-label" style={{ lineHeight: '32px' }}>示例:</span>
          {exampleUrls.map((ex, i) => (
            <button
              key={i}
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setInput(ex.url)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {mirrors.length > 0 && (
        <div className="tool-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="tool-label">
              <Download size={14} style={{ marginRight: 6 }} />
              加速镜像 ({urlType})
            </label>
            <button 
              className="btn btn-primary" 
              onClick={copyAllMirrors}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              {allCopied ? <Check size={14} /> : <Copy size={14} />}
              <span style={{ marginLeft: 4 }}>{allCopied ? '已复制' : '复制全部'}</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mirrors.map((mirror, index) => (
              <div key={mirror.name} className="mirror-row">
                <div className="mirror-info">
                  <span className="mirror-name">{mirror.name}</span>
                  <span className="mirror-url">{mirror.url}</span>
                </div>
                <div className="mirror-actions">
                  <button 
                    className="btn btn-icon" 
                    onClick={() => copyMirror(index)}
                    title="复制链接"
                  >
                    {mirror.copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button 
                    className="btn btn-icon" 
                    onClick={() => openInBrowser(mirror.url)}
                    title="直接下载"
                  >
                    <Download size={14} />
                  </button>
                  <button 
                    className="btn btn-icon" 
                    onClick={() => openInBrowser(mirror.homepage)}
                    title="访问镜像站"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="info-box" style={{ marginTop: 16 }}>
            <p>💡 使用镜像加速下载，可有效解决 GitHub 下载速度慢或连接失败的问题。</p>
            <p>⚠️ 镜像站可能存在稳定性差异，建议选择可用的镜像。</p>
          </div>
        </div>
      )}

      {urlType === 'release-page' && (
        <div className="tool-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="tool-label">
              <FileArchive size={14} style={{ marginRight: 6 }} />
              Release 资源列表
            </label>
            {repoInfo && (
              <button 
                className="btn btn-outline" 
                onClick={() => fetchReleaseAssets(repoInfo.owner, repoInfo.repo)}
                disabled={loadingAssets}
                style={{ fontSize: 12 }}
              >
                {loadingAssets ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                <span style={{ marginLeft: 4 }}>刷新</span>
              </button>
            )}
          </div>
          
          {loadingAssets && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
              <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>正在获取 Release 信息...</p>
            </div>
          )}
          
          {assetError && (
            <div className="error-box">
              <p>⚠️ {assetError}</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>提示: GitHub API 有速率限制，可直接使用示例链接测试。</p>
            </div>
          )}
          
          {releaseAssets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {releaseAssets.map((asset) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onCopy={copyToClipboard}
                  onOpen={openInBrowser}
                  generateMirrors={generateAssetMirrors}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {urlType === 'repo-page' && repoInfo && (
        <div className="tool-section">
          <div className="info-box">
            <p>🔗 检测到仓库页面: <strong>{repoInfo.owner}/{repoInfo.repo}</strong></p>
            <p style={{ marginTop: 8 }}>📌 请访问该仓库的 Releases 页面，选择具体版本进行下载。</p>
            <a
              href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: 'inline-flex', marginTop: 12, textDecoration: 'none' }}
            >
              <Github size={14} />
              <span style={{ marginLeft: 6 }}>访问 Releases 页面</span>
            </a>
          </div>
        </div>
      )}

      {input.trim() && !urlType && !mirrors.length && (
        <div className="error-box">
          <p>⚠️ 未能识别的 GitHub 链接格式</p>
          <p style={{ marginTop: 4, fontSize: 12 }}>支持的格式:</p>
          <ul style={{ marginTop: 4, fontSize: 12, paddingLeft: 16 }}>
            <li>github.com/user/repo/releases/download/...</li>
            <li>github.com/user/repo/archive/...</li>
            <li>raw.githubusercontent.com/...</li>
            <li>github.com/user/repo/releases (Release 页面)</li>
          </ul>
        </div>
      )}

      <div className="tool-section">
        <label className="tool-label">
          <ExternalLink size={14} style={{ marginRight: 6 }} />
          常用镜像站
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {MIRRORS.map((m) => (
            <a
              key={m.name}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mirror-link-card"
            >
              <span className="mirror-link-name">{m.name}</span>
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>
      
      <style>{`
        .tool-section {
          margin-bottom: 24px;
        }
        
        .mirror-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          gap: 12px;
        }
        
        .mirror-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .mirror-name {
          font-weight: 500;
          color: var(--accent);
          font-size: 13px;
        }
        
        .mirror-url {
          font-size: 11px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .mirror-actions {
          display: flex;
          gap: 4px;
        }
        
        .btn-icon {
          padding: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        
        .btn-icon:hover {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        
        .mirror-link-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          text-decoration: none;
          transition: all 0.15s;
        }
        
        .mirror-link-card:hover {
          border-color: var(--accent);
          background: var(--bg-tertiary);
        }
        
        .mirror-link-name {
          font-size: 13px;
          font-weight: 500;
        }
        
        .info-box {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .error-box {
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-size: 13px;
          color: #ef4444;
        }
        
        .asset-card {
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        
        .asset-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .asset-name {
          font-weight: 500;
          font-size: 13px;
        }
        
        .asset-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .asset-mirrors {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .asset-mirror-url {
          font-size: 11px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </ToolLayout>
  )
}

// Asset Card Component
interface AssetCardProps {
  asset: ReleaseAsset
  onCopy: (text: string) => void
  onOpen: (url: string) => void
  generateMirrors: (url: string) => MirrorResult[]
}

function AssetCard({ asset, onCopy, onOpen, generateMirrors }: AssetCardProps) {
  const [expanded, setExpanded] = useState(false)
  const mirrors = generateMirrors(asset.browser_download_url)
  
  return (
    <div className="asset-card">
      <div className="asset-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileArchive size={16} style={{ color: 'var(--accent)' }} />
          <span className="asset-name">{asset.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            className="btn btn-icon" 
            onClick={() => onCopy(asset.browser_download_url)}
            title="复制原链接"
          >
            <Copy size={12} />
          </button>
          <button 
            className="btn btn-icon" 
            onClick={() => onOpen(asset.browser_download_url)}
            title="直接下载"
          >
            <Download size={12} />
          </button>
          <button 
            className="btn btn-icon" 
            onClick={() => setExpanded(!expanded)}
            title={expanded ? '收起' : '查看镜像'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      <div className="asset-meta">
        <span>📦 {formatBytes(asset.size)}</span>
        <span>⬇️ {formatNumber(asset.download_count)} 次下载</span>
      </div>
      {expanded && (
        <div className="asset-mirrors">
          {mirrors.map((m) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--accent)', minWidth: 100 }}>{m.name}</span>
              <span className="asset-mirror-url" style={{ flex: 1 }}>{m.url}</span>
              <button 
                className="btn btn-icon" 
                style={{ padding: 4 }}
                onClick={() => onCopy(m.url)}
                title="复制"
              >
                <Copy size={10} />
              </button>
              <button 
                className="btn btn-icon" 
                style={{ padding: 4 }}
                onClick={() => onOpen(m.url)}
                title="下载"
              >
                <Download size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
