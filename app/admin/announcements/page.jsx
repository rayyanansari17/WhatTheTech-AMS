'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Plus, Trash2, Megaphone, Bell, Calendar, Clock, MapPin, Image, ExternalLink, Users, Upload, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  title: '', body: '',
  event_date: '', event_time: '', location: '',
  rsvp_type: 'none', rsvp_link: '',
  poster_url: '',
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [posterPreview, setPosterPreview] = useState(null)
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const fileRef = useRef(null)

  async function load() {
    const res = await fetch('/api/admin/announcements')
    const data = await res.json()
    setAnnouncements(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  async function handlePosterUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPoster(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/announcements/upload-poster', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      set('poster_url', data.url)
      setPosterPreview(data.url)
      toast.success('Poster uploaded!')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingPoster(false)
    }
  }

  function removePoster() {
    set('poster_url', '')
    setPosterPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleCreate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.body.trim()) errs.body = 'Message is required'
    if (form.rsvp_type === 'external' && !form.rsvp_link.trim()) errs.rsvp_link = 'RSVP link is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          event_date: form.event_date || null,
          event_time: form.event_time || null,
          location: form.location || null,
          poster_url: form.poster_url || null,
          rsvp_type: form.rsvp_type || 'none',
          rsvp_link: form.rsvp_type === 'external' ? (form.rsvp_link || null) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok && !data.needsMigration) throw new Error(data.error || 'Failed to post announcement')
      if (data.needsMigration) {
        setNeedsMigration(true)
        toast('Announcement posted. Run the schema migration to enable all fields.', { icon: '⚠️' })
      } else {
        toast.success('Announcement posted!')
      }
      setForm(EMPTY_FORM)
      setPosterPreview(null)
      setOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const res = await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    setDeleteId(null)
    load()
  }

  function closeDialog() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setPosterPreview(null)
    setErrors({})
    if (fileRef.current) fileRef.current.value = ''
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

      {needsMigration && (
        <div className="mb-5 p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Schema migration needed for full functionality.</p>
            <p className="mt-1 text-xs">Run the SQL in <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">supabase/migrations/add_announcement_fields.sql</code> in your Supabase SQL Editor to enable event date, location, poster, and RSVP fields.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Card key={i}><CardContent className="pt-4 pb-4 h-24 animate-pulse bg-muted/50" /></Card>)}
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{a.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(a.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>

                      {/* Extra fields */}
                      {(a.event_date || a.event_time || a.location) && (
                        <div className="flex flex-wrap gap-3 mt-2">
                          {(a.event_date || a.event_time) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {a.event_date ? new Date(a.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              {a.event_time && ` · ${a.event_time}`}
                            </span>
                          )}
                          {a.location && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />{a.location}
                            </span>
                          )}
                        </div>
                      )}

                      {a.poster_url && (
                        <img src={a.poster_url} alt="Event poster"
                          className="mt-3 rounded-xl object-cover max-h-[200px] w-full" />
                      )}

                      {a.rsvp_type && a.rsvp_type !== 'none' && (
                        <div className="mt-2">
                          {a.rsvp_type === 'external' && a.rsvp_link ? (
                            <a href={a.rsvp_link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                              <ExternalLink className="w-3 h-3" />RSVP Link: {a.rsvp_link}
                            </a>
                          ) : a.rsvp_type === 'system' ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />RSVP via Platform
                            </span>
                          ) : null}
                        </div>
                      )}
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
      <Dialog open={open} onOpenChange={v => { if (!v) closeDialog() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Visible to all registered participants.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input className="mt-1.5" value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Announcement title" />
              {errors.title && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>

            {/* Message */}
            <div>
              <Label>Message *</Label>
              <Textarea className="mt-1.5" value={form.body}
                onChange={e => set('body', e.target.value)}
                placeholder="Write your announcement..." rows={3} />
              {errors.body && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.body}</p>}
            </div>

            {/* Event Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Event Date</Label>
                <Input type="date" className="mt-1.5" value={form.event_date}
                  onChange={e => set('event_date', e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Event Time</Label>
                <Input type="time" className="mt-1.5" value={form.event_time}
                  onChange={e => set('event_time', e.target.value)} />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location</Label>
              <Input className="mt-1.5" value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. BITS Pilani Hyderabad Campus" />
            </div>

            {/* Poster Upload */}
            <div>
              <Label className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5" />Event Poster</Label>
              {posterPreview ? (
                <div className="mt-1.5 relative">
                  <img src={posterPreview} alt="Poster preview"
                    className="w-full rounded-xl object-cover max-h-[200px]" />
                  <button onClick={removePoster}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingPoster ? 'Uploading...' : 'Click to upload (JPG, PNG, WebP)'}
                  </span>
                  <span className="text-xs text-muted-foreground/70">Recommended: 1200 × 400 px</span>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp"
                    className="hidden" onChange={handlePosterUpload} disabled={uploadingPoster} />
                </label>
              )}
            </div>

            {/* RSVP Type */}
            <div>
              <Label>RSVP</Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: 'none', label: 'No RSVP' },
                  { value: 'external', label: 'RSVP on Platform (Luma, Eventbrite, etc.)' },
                  { value: 'system', label: 'RSVP via App' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="rsvp_type" value={opt.value}
                      checked={form.rsvp_type === opt.value}
                      onChange={e => set('rsvp_type', e.target.value)}
                      className="accent-primary" />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RSVP Link - only when external */}
            {form.rsvp_type === 'external' && (
              <div>
                <Label className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" />RSVP Link *</Label>
                <Input className="mt-1.5" value={form.rsvp_link}
                  onChange={e => set('rsvp_link', e.target.value)}
                  placeholder="https://lu.ma/your-event" />
                {errors.rsvp_link && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.rsvp_link}</p>}
              </div>
            )}

            {form.rsvp_type === 'system' && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                Participants will RSVP directly through the app on their dashboard.
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || uploadingPoster}>
              <Megaphone className="w-4 h-4" />{saving ? 'Posting...' : 'Post Announcement'}
            </Button>
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
