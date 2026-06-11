'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Plus, Trash2, Megaphone, Bell } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminAnnouncementsPage() {
  const supabase = getSupabaseClient()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ title: '', body: '' })
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.body.trim()) errs.body = 'Body is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('announcements').insert({
      title: form.title.trim(),
      body: form.body.trim(),
      created_by: user.id,
    })
    if (error) { toast.error('Failed to post announcement'); setSaving(false); return }
    toast.success('Announcement posted!')
    setForm({ title: '', body: '' })
    setOpen(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    setDeleteId(null)
    load()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Broadcast messages to all participants</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" />New Announcement</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 pb-4 h-24 animate-pulse bg-muted/50" /></Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No announcements yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Post your first announcement to participants</p>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" />Post Announcement</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="card-hover">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{a.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(a.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteId(a.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm({ title: '', body: '' }); setErrors({}) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>This will be visible to all registered participants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input className="mt-1.5" value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }}
                placeholder="Announcement title" error={!!errors.title} />
              {errors.title && <p className="text-destructive text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea className="mt-1.5" value={form.body} onChange={e => { setForm(p => ({ ...p, body: e.target.value })); setErrors(p => ({ ...p, body: '' })) }}
                placeholder="Write your announcement..." rows={4} error={!!errors.body} />
              {errors.body && <p className="text-destructive text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.body}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}><Megaphone className="w-4 h-4" />Post Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
