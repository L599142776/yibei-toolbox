/**
 * 文件下载工具
 */

/** 从 Blob 触发下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  URL.revokeObjectURL(url)
}

/** 从 URL 触发下载 */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** 将文本内容下载为文件 */
export function downloadText(text: string, filename: string, encoding = 'utf-8'): void {
  const blob = new Blob([text], { type: `text/plain;charset=${encoding}` })
  downloadBlob(blob, filename)
}

/** 将 JSON 内容下载为文件 */
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename)
}
