'use client'
import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TagInput({
  value = [],
  onChange,
  max = 5,
  placeholder = 'Type and press Enter',
  className,
  suggestions = [],
}) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const filtered = inputValue.length > 0
    ? suggestions
        .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
        .slice(0, 8)
    : []

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function addTag(tag) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed) || value.length >= max) return
    onChange([...value, trimmed])
    setInputValue('')
    setShowSuggestions(false)
  }

  function removeTag(tag) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 min-h-10 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-colors cursor-text',
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-accent text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70 transition-opacity ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              setShowSuggestions(e.target.value.length > 0 && suggestions.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.length > 0 && suggestions.length > 0) setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
        )}
        {value.length >= max && (
          <span className="text-xs text-muted-foreground self-center ml-1">Max {max} tags</span>
        )}
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto py-1">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onMouseDown={e => { e.preventDefault(); addTag(s) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
