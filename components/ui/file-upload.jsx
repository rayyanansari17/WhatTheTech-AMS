'use client'
import { useRef, useState } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FileUpload({ value, onChange, accept = '.pdf,.docx,.doc,.txt,.rtf,.odt', maxSize = 10, label = 'Upload file', className }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File must be smaller than ${maxSize}MB`)
      return
    }
    onChange(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  if (value) {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800", className)}>
        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <File className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{value.name || 'resume.pdf'}</p>
          <p className="text-xs text-muted-foreground">
            {value.size ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
          </p>
        </div>
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
        dragOver ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-accent/30",
        className
      )}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
        <Upload className="w-5 h-5 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click · PDF, DOCX, DOC, TXT · max {maxSize}MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}
