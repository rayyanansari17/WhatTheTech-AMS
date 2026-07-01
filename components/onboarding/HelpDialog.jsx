'use client'
import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function HelpDialog({ title, sections, storageKey }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!storageKey) return
    if (!localStorage.getItem(storageKey)) {
      setOpen(true)
      localStorage.setItem(storageKey, '1')
    }
  }, [storageKey])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="How it works"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {sections.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.heading}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-2" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
