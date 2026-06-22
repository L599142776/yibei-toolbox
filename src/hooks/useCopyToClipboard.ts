import { useState, useCallback } from 'react'
import { copyToClipboard } from '../utils/clipboard'

/**
 * 复制到剪贴板 hook
 * 返回 [copy, copied] — copy 调用后 copied 短暂置 true
 */
export function useCopyToClipboard(resetDelay = 2000): [(text: string) => Promise<boolean>, boolean] {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), resetDelay)
      }
      return ok
    },
    [resetDelay]
  )

  return [copy, copied]
}
