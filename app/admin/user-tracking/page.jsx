'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MousePointer2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

const SOURCE_LABELS = {
  linkedin: 'LinkedIn',
  meta: 'Meta (Facebook/Instagram)',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  google: 'Google',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  email: 'Email',
  referral: 'Referral',
  organic: 'Organic Search',
  direct: 'Direct',
}

function label(src) {
  if (!src) return 'Organic / Direct'
  return SOURCE_LABELS[src.toLowerCase()] || src
}

export default function UserTrackingPage() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function load() {
      // Fetch all profiles with utm data (non-organiser only)
      const { data, error } = await supabase
        .from('profiles')
        .select('utm_source, utm_medium, utm_campaign')
        .eq('is_organiser', false)

      if (error || !data) { setLoading(false); return }

      const total = data.length

      // Group by utm_source
      const map = new Map()
      for (const p of data) {
        const key = p.utm_source || null
        map.set(key, (map.get(key) || 0) + 1)
      }

      // Sort: known sources first by count, null (organic/direct) always last
      const sorted = [...map.entries()]
        .filter(([k]) => k !== null)
        .sort((a, b) => b[1] - a[1])

      const nullCount = map.get(null) ?? 0

      const result = [
        ...sorted.map(([src, count]) => ({ src, count })),
        { src: null, count: nullCount },
      ]

      setRows({ result, total })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <MousePointer2 className="w-6 h-6" /> User Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marketing source attribution from UTM parameters captured at first visit.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Registrations by Source
            {!loading && rows && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {rows.total} total registrants
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !rows || rows.result.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No registration data yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Count</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.result.map(({ src, count }, i) => {
                  const pct = rows.total > 0 ? ((count / rows.total) * 100).toFixed(1) : '0.0'
                  const isLast = i === rows.result.length - 1
                  return (
                    <tr
                      key={src ?? '__null__'}
                      className={`border-b border-border last:border-0 ${isLast ? 'text-muted-foreground' : ''}`}
                    >
                      <td className="px-6 py-3 font-medium">{label(src)}</td>
                      <td className="px-6 py-3 tabular-nums">{count}</td>
                      <td className="px-6 py-3 tabular-nums">
                        <div className="flex items-center gap-2">
                          <span>{pct}%</span>
                          {rows.total > 0 && (
                            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        UTM values are captured at first landing (30-day first-touch cookie) and written to the <code>profiles</code> table when a user completes their profile. Rows with no UTM are shown as Organic / Direct.
      </p>
    </div>
  )
}
