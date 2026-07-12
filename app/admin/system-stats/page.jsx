'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Users, Group, UserPlus, QrCode, Mail, Megaphone, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const COLLECTION_META = [
  { key: 'profiles',     label: 'Participants',   icon: Users,     warning: 'This will also delete all teams, team members, check-ins, and email logs.' },
  { key: 'teams',        label: 'Teams',          icon: Group,     warning: 'This will also delete all team members and check-ins.' },
  { key: 'team_members', label: 'Team Members',   icon: UserPlus,  warning: null },
  { key: 'check_ins',    label: 'Check-ins',      icon: QrCode,    warning: null },
  { key: 'email_logs',   label: 'Email Logs',     icon: Mail,      warning: null },
  { key: 'announcements',label: 'Announcements',  icon: Megaphone, warning: null },
]

export default function SystemStatsPage() {
  const [counts, setCounts]         = useState({})
  const [loading, setLoading]       = useState(true)
  const [wipeTarget, setWipeTarget] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [wiping, setWiping]         = useState(false)

  const fetchCounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) { toast.error('Failed to load stats'); return }
      const data = await res.json()
      const map = {}
      data.counts.forEach(({ table, count }) => { map[table] = count })
      setCounts(map)
    } catch {
      toast.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  async function handleWipe() {
    if (confirmText !== 'delete' || !wipeTarget) return
    setWiping(true)
    try {
      const res = await fetch(`/api/admin/stats?collection=${wipeTarget.key}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Wipe failed')
        return
      }
      toast.success(`${wipeTarget.label} wiped successfully.`)
      setWipeTarget(null)
      setConfirmText('')
      await fetchCounts()
    } catch {
      toast.error('Wipe failed')
    } finally {
      setWiping(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">System Stats</h1>
          <p className="text-muted-foreground text-sm mt-1">Row counts for every collection. Wipe actions are irreversible.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCounts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {COLLECTION_META.map(({ key, label, icon: Icon, warning }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => { setWipeTarget({ key, label, warning }); setConfirmText('') }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading
                ? <Skeleton className="h-8 w-20" />
                : <p className="text-3xl font-bold tabular-nums">{(counts[key] ?? 0).toLocaleString()}</p>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!wipeTarget} onOpenChange={(o) => { if (!o && !wiping) { setWipeTarget(null); setConfirmText('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wipe {wipeTarget?.label}?</DialogTitle>
            <DialogDescription>
              {wipeTarget?.warning
                ? <span className="text-destructive font-medium">{wipeTarget.warning}<br /><br /></span>
                : null}
              This action cannot be undone. Type <strong>delete</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="delete"
            autoFocus
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setWipeTarget(null); setConfirmText('') }} disabled={wiping}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'delete' || wiping}
              onClick={handleWipe}
            >
              {wiping ? 'Deleting...' : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
