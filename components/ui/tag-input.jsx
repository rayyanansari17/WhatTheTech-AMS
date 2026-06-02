'use client'
import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TagInput({ value = [], onChange, max = 5, placeholder = 'Type and press Enter', className }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  function addTag(tag) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed) || value.length >= max) return
    onChange([...value, trimmed])
    setInputValue('')
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
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 min-h-10 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-colors cursor-text",
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
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      )}
      {value.length >= max && (
        <span className="text-xs text-muted-foreground self-center ml-1">Max {max} tags</span>
      )}
    </div>
  )
}
