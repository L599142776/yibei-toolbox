import ToolLayout from '../../components/ToolLayout'
import { ExternalLink, Gamepad2 } from 'lucide-react'

const GAME_URL = 'https://supermarioplay.com/cn'

export default function SuperMario() {
  return (
    <ToolLayout title="超级马里奥" description="经典平台跳跃游戏 - 在线版">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 16px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e52521, #cc4400)',
          borderRadius: 16, padding: '40px 32px',
          textAlign: 'center', maxWidth: 500, width: '100%',
          boxShadow: '0 8px 32px rgba(229,37,33,0.3)',
        }}>
          <Gamepad2 size={64} color="#ffd700" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px', fontWeight: 700 }}>
            超级马里奥 - 完整版
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
            8 个世界 × 4 关 = 32 关完整通关，支持世界地图选关、
            随机地图生成、关卡编辑器。
          </p>
          <button
            onClick={() => window.open(GAME_URL, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#ffd700', color: '#333', border: 'none',
              borderRadius: 8, padding: '12px 28px', fontSize: 16,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <ExternalLink size={20} />
            在新窗口打开游戏
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 12,
          padding: '20px 24px', maxWidth: 500, width: '100%',
          fontSize: 13, color: '#888', lineHeight: 1.8,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ margin: 0 }}><strong>操作说明</strong></p>
          <p style={{ margin: '4px 0' }}>方向键 / WASD 移动，↑ / W / 空格 跳跃（按住跳更高）</p>
          <p style={{ margin: '4px 0' }}>Shift / Ctrl 冲刺 / 发射火球，P 暂停，M 静音</p>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            该游戏为外部在线版本，由 supermarioplay.com 提供。
            点击按钮将在新标签页中打开完整游戏。
          </p>
        </div>
      </div>
    </ToolLayout>
  )
}
