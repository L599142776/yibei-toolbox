import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  width?: number | string
  fontSize?: number
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  width = 180,
  fontSize = 14,
  disabled = false,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={ref}
      className={`select-wrapper ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    >
      <button
        type="button"
        className={`select-trigger ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{ fontSize }}
      >
        <span className="select-value">
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`select-icon ${open ? 'open' : ''}`}
        />
      </button>

      {open && (
        <div className="select-content">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`select-item ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span className="select-item-label">{option.label}</span>
              {option.value === value && <Check size={14} className="select-item-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Select