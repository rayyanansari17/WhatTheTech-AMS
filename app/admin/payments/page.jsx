'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, CreditCard, DollarSign } from 'lucide-react'
import { useAdminRefresh } from '@/hooks/useAdminRefresh'
import AdminRefreshBar from '@/components/admin/AdminRefreshBar'

export default function AdminPaymentsPage() {
  const supabase = getSupabaseClient()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  async function loadPayments() {
    const { data } = await supabase
      .from('teams')
      .select('*, profiles!teams_leader_id_fkey(full_name, email)')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
    setPayments(data || [])
    setTotal((data || []).reduce((s, t) => s + (t.amount_paid || 0), 0))
  }

  useEffect(() => {
    setLoading(true)
    loadPayments().finally(() => setLoading(false))
  }, [])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: loadPayments, channelName: 'admin-payments-rt', table: 'teams' })

  function exportCSV() {
    const rows = [['Team', 'Leader', 'Email', 'Amount', 'Order ID', 'Payment ID', 'Date']]
    payments.forEach(p => {
      rows.push([
        p.team_name, p.profiles?.full_name || '', p.profiles?.email || '',
        p.amount_paid || '', p.payment_order_id || '', p.payment_id || '',
        formatDate(p.created_at),
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ff_payments_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{payments.length} paid teams</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRefreshBar
            isRefreshing={isRefreshing} isLive={isLive} lastUpdated={lastUpdated}
            countdown={countdown} justUpdated={justUpdated} onRefresh={manualRefresh}
          />
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4" />Export CSV</Button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/70 text-sm">Total Collected</p>
            <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            <p className="text-white/70 text-xs mt-0.5">from {payments.length} teams</p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Team', 'Leader', 'Amount', 'Cashfree Order ID', 'Payment Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-label text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No payments yet</p>
                </td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium">{p.team_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{p.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{p.profiles?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {formatCurrency(p.amount_paid || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.payment_order_id || '—'}</code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.payment_id || '—'}</code>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3"><Badge variant="paid">Paid ✓</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
