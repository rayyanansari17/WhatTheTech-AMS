'use client'
import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Download, Users, CreditCard, UserCircle, Check } from 'lucide-react'
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
  const [loading, setLoading] = useState({ teams: false, participants: false, payments: false, checkins: false })

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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Download all data as CSV files</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ExportCard title="All Teams" description="Team names, codes, tracks, status, payment info"
          icon={Users} onExport={exportTeams} loading={loading.teams} />
        <ExportCard title="All Participants" description="Full profiles with skills, education, contact"
          icon={UserCircle} onExport={exportParticipants} loading={loading.participants} />
        <ExportCard title="Payments" description="Payment IDs, amounts, Cashfree order references"
          icon={CreditCard} onExport={exportPayments} loading={loading.payments} />
        <ExportCard title="Check-ins" description="Event day check-in log with timestamps"
          icon={Check} onExport={exportCheckins} loading={loading.checkins} />
      </div>
    </div>
  )
}
