'use client'

import { useEffect, useState } from 'react'
import { Shield, ShieldCheck, UserMinus, UserPlus, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchAdmins() {
    const res = await fetch('/api/admin/manage-admin')
    if (res.status === 403) { setForbidden(true); setLoading(false); return }
    const data = await res.json()
    setAdmins(data.admins || [])
    setPending(data.pending || [])
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  async function addAdmin(e) {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', email: email.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setAdding(false); return }
    toast.success(data.message)
    setEmail('')
    setAdding(false)
    fetchAdmins()
  }

  async function toggleSuperAdmin(userId, currentValue) {
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_super_admin', userId, value: !currentValue }),
    })
    if (!res.ok) { toast.error('Failed to update role'); return }
    toast.success(!currentValue ? 'Super admin granted' : 'Super admin removed')
    fetchAdmins()
  }

  async function removeAdmin(userId, name) {
    if (!confirm(`Remove ${name} as admin? They will lose all admin access.`)) return
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', userId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success(`${name} removed as admin`)
    fetchAdmins()
  }

  async function removePending(pendingEmail) {
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_pending', email: pendingEmail }),
    })
    if (!res.ok) { toast.error('Failed to remove'); return }
    toast.success(`${pendingEmail} removed from pending`)
    fetchAdmins()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )

  if (forbidden) return (
    <div className="p-8">
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <p className="font-semibold text-destructive">Super Admin Access Required</p>
        <p className="text-sm text-muted-foreground mt-1">Only super admins can manage admin users.</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          Manage Admins
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add or remove admin access. Super admins can manage this list.
        </p>
      </div>

      {/* Add admin */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add Admin
        </h2>
        <form onSubmit={addAdmin} className="flex gap-2">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          If the person hasn't signed up yet, they'll get access automatically when they first sign in.
        </p>
      </div>

      {/* Admin list */}
      <div className="rounded-lg border bg-card divide-y">
        <div className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Current Admins ({admins.length})
        </div>
        {admins.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No admins found.</div>
        )}
        {admins.map(admin => (
          <div key={admin.id} className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{admin.full_name || '(no name)'}</span>
                {admin.is_super_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Crown className="h-3 w-3" /> Super Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{admin.email}</div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button
                onClick={() => toggleSuperAdmin(admin.id, admin.is_super_admin)}
                title={admin.is_super_admin ? 'Remove super admin' : 'Grant super admin'}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
              >
                {admin.is_super_admin
                  ? <ShieldCheck className="h-4 w-4 text-yellow-500" />
                  : <Shield className="h-4 w-4 text-muted-foreground" />}
              </button>
              <button
                onClick={() => removeAdmin(admin.id, admin.full_name || admin.email)}
                title="Remove admin"
                className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors"
              >
                <UserMinus className="h-4 w-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pending admins */}
      {pending.length > 0 && (
        <div className="rounded-lg border bg-card divide-y">
          <div className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
            Pending — awaiting first sign-in ({pending.length})
          </div>
          {pending.map(p => (
            <div key={p.email} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-medium">{p.email}</div>
                <div className="text-xs text-muted-foreground">Will get admin access on first login</div>
              </div>
              <button
                onClick={() => removePending(p.email)}
                title="Cancel pending invite"
                className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors ml-4"
              >
                <UserMinus className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <ShieldCheck className="inline h-3 w-3 mr-1" />
        Click the shield icon to toggle super admin. Click the minus icon to remove admin access entirely.
      </p>
    </div>
  )
}
