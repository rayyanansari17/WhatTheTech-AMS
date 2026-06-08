/**
 * GET /api/cron/daily-digest
 * Runs daily at 8 AM IST via Vercel Cron (cron schedule: "30 2 * * *" = 8:00 AM IST).
 * Sends: #43 daily registration digest to admin.
 */
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ADMIN_EMAIL) {
    return Response.json({ skipped: 'No ADMIN_EMAIL set' })
  }

  const supabase = getServiceClient()
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })

  // New registrations since yesterday
  const { data: newProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .gt('created_at', yesterday)

  // Total counts
  const { count: totalCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: paidCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'paid')

  const { count: totalTeams } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })

  // Get emails for new users
  const recentUsers = []
  for (const p of (newProfiles || []).slice(0, 20)) {
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id)
    if (authUser?.user?.email) {
      // Get their team if any
      const { data: membership } = await supabase
        .from('team_members')
        .select('teams(team_name)')
        .eq('user_id', p.id)
        .maybeSingle()

      recentUsers.push({
        name: p.full_name || authUser.user.email,
        email: authUser.user.email,
        team: membership?.teams?.team_name || '',
      })
    }
  }

  await triggerEmail({
    type: 'admin_daily_digest',
    to: process.env.ADMIN_EMAIL,
    props: {
      date: todayStr,
      newRegistrations: newProfiles?.length || 0,
      totalRegistrations: totalCount || 0,
      paidCount: paidCount || 0,
      unpaidCount: (totalTeams || 0) - (paidCount || 0),
      totalTeams: totalTeams || 0,
      recentUsers,
    },
  })

  return Response.json({ ok: true, sent: 1 })
}

export { GET as POST }
