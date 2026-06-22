/**
 * 通用格式化工具
 */

/** 格式化数字（千分位） */
export function formatNumber(n: number, locale = 'zh-CN'): string {
  return new Intl.NumberFormat(locale).format(n)
}

/** 截断文本 */
export function truncate(text: string, maxLen: number, suffix = '...'): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + suffix
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 格式化相对时间（几秒前、几分钟前…） */
export function formatRelativeTime(date: Date | number): string {
  const now = Date.now()
  const ts = typeof date === 'number' ? date : date.getTime()
  const diff = now - ts
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

/** 安全 HTML 转义 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (c) => map[c])
}

/** 延迟 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
