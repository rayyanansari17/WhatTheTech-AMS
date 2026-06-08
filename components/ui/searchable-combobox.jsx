'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
  error,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = options.filter(opt =>
    (typeof opt === 'string' ? opt : opt.label).toLowerCase().includes(query.toLowerCase())
  )

  const selectedLabel = value
    ? (() => {
        const found = options.find(o => (typeof o === 'string' ? o : o.value) === value)
        if (!found) return value
        return typeof found === 'string' ? found : found.label
      })()
    : null

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm border bg-background rounded-md h-10 hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
          error ? 'border-destructive' : 'border-input',
          open && 'border-primary ring-1 ring-ring'
        )}
      >
        <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 flex flex-col">
          <div className="p-2 border-b border-border flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 rounded border border-transparent focus:border-primary focus:outline-none"
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
            ) : (
              filtered.map(opt => {
                const optVal = typeof opt === 'string' ? opt : opt.value
                const optLabel = typeof opt === 'string' ? opt : opt.label
                const isSelected = optVal === value
                return (
                  <button
                    key={optVal}
                    type="button"
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
                      isSelected && 'bg-accent/60 font-medium text-primary'
                    )}
                    onClick={() => { onChange(optVal); setOpen(false); setQuery('') }}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
