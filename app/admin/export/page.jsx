'use client'
import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Download, Users, CreditCard, UserCircle, Check, PhoneCall, UserX, UsersRound, Wallet, LayoutGrid } from 'lucide-react'
import { MIN_TEAM_SIZE } from '@/lib/constants'
import toast from 'react-hot-toast'

function ExportCard({ title, description, icon: Icon, onExport, loading }) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onExport} loading={loading} className="w-full">
          <Download className="w-4 h-4" />Download CSV
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminExportPage() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState({
    teams: false, participants: false, payments: false, checkins: false,
    unpaidTeams: false, depositPaid: false, incompleteProfiles: false,
    incompleteTeams: false, paidContacts: false, byTrack: false,
  })

  function setL(key, val) { setLoading(prev => ({ ...prev, [key]: val })) }

  function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Full data exports ──────────────────────────────────────────────────────

  async function exportTeams() {
    setL('teams', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .order('created_at', { ascending: false })
      const rows = [['Team Name', 'Team Code', 'Leader', 'Leader Email', 'Leader Phone', 'Track', 'Idea', 'Members', 'Status', 'Payment', 'Created']]
      data?.forEach(t => rows.push([
        t.team_name, t.team_code, t.profiles?.full_name, t.profiles?.email, t.profiles?.phone,
        t.track, t.idea_title || '', t.member_count, t.status, t.payment_status, t.created_at,
      ]))
      downloadCSV(rows, 'ff_teams')
      toast.success('Teams CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('teams', false) }
  }

  async function exportParticipants() {
    setL('participants', true)
    try {
      const { data } = await supabase.from('profiles')
        .select('*, team_members(teams(team_name))')
        .eq('profile_complete', true).neq('is_organiser', true)
      const rows = [['Name', 'Email', 'Phone', 'Gender', 'Age', 'Institution', 'Degree', 'Field', 'Year of Study', 'City', 'State', 'Role', 'Skills', 'Track', 'T-Shirt', 'Team']]
      data?.forEach(p => rows.push([
        p.full_name, p.email, p.phone, p.gender, p.age,
        p.institution, p.degree_type, p.field_of_study, p.year_of_study,
        p.city, p.state, p.role_type, p.skills?.join(';'),
        p.track_preference, p.tshirt_size,
        p.team_members?.[0]?.teams?.team_name || '',
      ]))
      downloadCSV(rows, 'ff_participants')
      toast.success('Participants CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('participants', false) }
  }

  async function exportPayments() {
    setL('payments', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email)')
        .eq('payment_status', 'paid')
      const rows = [['Team', 'Leader', 'Email', 'Amount (₹)', 'Order ID', 'Payment ID', 'Date']]
      data?.forEach(p => rows.push([
        p.team_name, p.profiles?.full_name, p.profiles?.email,
        p.amount_paid || '', p.payment_order_id || '', p.payment_id || '', p.created_at,
      ]))
      downloadCSV(rows, 'ff_payments')
      toast.success('Payments CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('payments', false) }
  }

  async function exportCheckins() {
    setL('checkins', true)
    try {
      const { data } = await supabase.from('check_ins')
        .select('*, profiles!check_ins_user_id_fkey(full_name, email), teams(team_name)')
        .order('checked_in_at', { ascending: false })
      const rows = [['Name', 'Email', 'Team', 'Checked In At']]
      data?.forEach(c => rows.push([
        c.profiles?.full_name, c.profiles?.email, c.teams?.team_name, c.checked_in_at,
      ]))
      downloadCSV(rows, 'ff_checkins')
      toast.success('Check-ins CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('checkins', false) }
  }

  // ── Campaign segment exports ───────────────────────────────────────────────

  async function exportUnpaidTeams() {
    setL('unpaidTeams', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .in('payment_status', ['unpaid', 'pending', 'failed'])
        .order('created_at', { ascending: false })
      const rows = [['Leader Name', 'Phone', 'Email', 'Team Name', 'Amount Due']]
      data?.forEach(t => {
        const due = t.max_members === 5 ? '₹1,299' : `₹${(t.max_members || 1) * 299}`
        rows.push([t.profiles?.full_name, t.profiles?.phone, t.profiles?.email, t.team_name, due])
      })
      downloadCSV(rows, 'ff_unpaid_teams')
      toast.success('Unpaid teams CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('unpaidTeams', false) }
  }

  async function exportDepositPaid() {
    setL('depositPaid', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .eq('payment_status', 'deposit_paid')
        .order('deposit_paid_at', { ascending: false })
      const rows = [['Leader Name', 'Phone', 'Email', 'Team Name', 'Balance Due', 'Deposit Paid On']]
      data?.forEach(t => {
        const maxM = t.max_members || 1
        const balance = `₹${(maxM === 5 ? 1299 : maxM * 299) - 149}`
        rows.push([t.profiles?.full_name, t.profiles?.phone, t.profiles?.email, t.team_name, balance, t.deposit_paid_at || ''])
      })
      downloadCSV(rows, 'ff_deposit_paid')
      toast.success('Deposit paid CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('depositPaid', false) }
  }

  async function exportIncompleteProfiles() {
    setL('incompleteProfiles', true)
    try {
      const { data } = await supabase.from('profiles')
        .select('full_name, email, phone')
        .eq('profile_complete', false)
        .eq('is_organiser', false)
        .order('created_at', { ascending: false })
      const rows = [['Name', 'Phone', 'Email']]
      data?.forEach(p => rows.push([p.full_name, p.phone, p.email]))
      downloadCSV(rows, 'ff_incomplete_profiles')
      toast.success('Incomplete profiles CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('incompleteProfiles', false) }
  }

  async function exportIncompleteTeams() {
    setL('incompleteTeams', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .lt('member_count', MIN_TEAM_SIZE)
        .order('created_at', { ascending: false })
      const rows = [['Leader Name', 'Phone', 'Email', 'Team Name', 'Team Code', 'Members']]
      data?.forEach(t => rows.push([
        t.profiles?.full_name, t.profiles?.phone, t.profiles?.email,
        t.team_name, t.team_code, `${t.member_count}/${MIN_TEAM_SIZE}`,
      ]))
      downloadCSV(rows, 'ff_incomplete_teams')
      toast.success('Incomplete teams CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('incompleteTeams', false) }
  }

  async function exportPaidContacts() {
    setL('paidContacts', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
      const rows = [['Leader Name', 'Phone', 'Email', 'Team Name', 'Amount Paid']]
      data?.forEach(t => rows.push([
        t.profiles?.full_name, t.profiles?.phone, t.profiles?.email,
        t.team_name, t.amount_paid ? `₹${t.amount_paid}` : '',
      ]))
      downloadCSV(rows, 'ff_paid_contacts')
      toast.success('Paid contacts CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('paidContacts', false) }
  }

  async function exportByTrack() {
    setL('byTrack', true)
    try {
      const { data } = await supabase.from('teams')
        .select('*, profiles!teams_leader_id_fkey(full_name, email, phone)')
        .order('track', { ascending: true })
      const rows = [['Track', 'Leader Name', 'Phone', 'Email', 'Team Name', 'Payment Status']]
      data?.forEach(t => rows.push([
        t.track, t.profiles?.full_name, t.profiles?.phone, t.profiles?.email,
        t.team_name, t.payment_status,
      ]))
      downloadCSV(rows, 'ff_teams_by_track')
      toast.success('Teams by track CSV downloaded')
    } catch { toast.error('Export failed') } finally { setL('byTrack', false) }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Download data as CSV files</p>
      </div>

      {/* All Data */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Data</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-8">
        <ExportCard title="All Teams" description="Team names, codes, tracks, status, payment info"
          icon={Users} onExport={exportTeams} loading={loading.teams} />
        <ExportCard title="All Participants" description="Full profiles with skills, education, contact"
          icon={UserCircle} onExport={exportParticipants} loading={loading.participants} />
        <ExportCard title="Payments" description="Payment IDs, amounts, order references"
          icon={CreditCard} onExport={exportPayments} loading={loading.payments} />
        <ExportCard title="Check-ins" description="Event day check-in log with timestamps"
          icon={Check} onExport={exportCheckins} loading={loading.checkins} />
      </div>

      {/* Campaign Segments */}
      <div className="flex items-center gap-2 mb-1">
        <PhoneCall className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campaign Segments</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Phone-first CSVs ready for WhatsApp outreach</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        <ExportCard title="Unpaid Teams" description="Leaders who haven't paid yet, with amount due"
          icon={Wallet} onExport={exportUnpaidTeams} loading={loading.unpaidTeams} />
        <ExportCard title="Deposit Paid (Balance Due)" description="Leaders who paid ₹149 deposit, with remaining balance"
          icon={CreditCard} onExport={exportDepositPaid} loading={loading.depositPaid} />
        <ExportCard title="Incomplete Profiles" description="Registered users who haven't finished their profile"
          icon={UserX} onExport={exportIncompleteProfiles} loading={loading.incompleteProfiles} />
        <ExportCard title="Incomplete Teams" description="Solo leaders whose team still needs more members"
          icon={UsersRound} onExport={exportIncompleteTeams} loading={loading.incompleteTeams} />
        <ExportCard title="Paid Teams Contacts" description="Leaders of fully paid teams, with amount paid"
          icon={Users} onExport={exportPaidContacts} loading={loading.paidContacts} />
        <ExportCard title="Teams by Track" description="All teams sorted by track, filter by track in Excel"
          icon={LayoutGrid} onExport={exportByTrack} loading={loading.byTrack} />
      </div>
    </div>
  )
}
