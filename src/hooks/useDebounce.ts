import { useState, useEffect } from 'react'

/**
 * 防抖 hook
 * @param value 要防抖的值
 * @param delay 延迟毫秒数，默认 300
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
