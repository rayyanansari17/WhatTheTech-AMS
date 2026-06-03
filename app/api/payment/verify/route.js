import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function sendPaymentSuccessEmails(supabase, teamId, orderId, amount) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

  const { data: team } = await supabase
    .from('teams')
    .select('id, team_name')
    .eq('id', teamId)
    .single()

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, is_leader, profiles(full_name)')
    .eq('team_id', teamId)

  for (const m of members || []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
    if (!authUser?.user?.email) continue
    await triggerEmail({
      type: 'payment_success',
      to: authUser.user.email,
      userId: m.user_id,
      props: {
        name: m.profiles?.full_name || authUser.user.email.split('@')[0],
        teamName: team?.team_name || '',
        orderId,
        amount: `₹${amount}`,
        dashboardUrl: `${appUrl}/dashboard`,
      },
    })
  }

  // Admin alert
  if (process.env.ADMIN_EMAIL && members?.length > 0) {
    const leader = members.find(m => m.is_leader) || members[0]
    const { data: leaderAuth } = await supabase.auth.admin.getUserById(leader.user_id)
    await triggerEmail({
      type: 'admin_new_registration',
      to: process.env.ADMIN_EMAIL,
      props: {
        userName: leader.profiles?.full_name || leaderAuth?.user?.email || '',
        userEmail: leaderAuth?.user?.email || '',
        teamName: team?.team_name || '',
        paymentStatus: 'paid',
        registeredAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
    })
  }
}

export async function POST(req) {
  try {
    const { order_id, team_id } = await req.json()

    if (!order_id || !team_id) {
      return Response.json({ error: 'Missing order_id or team_id' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const adminSupabase = getServiceClient()

    // Dev-only bypass
    if (process.env.NODE_ENV === 'development' && order_id.startsWith('test_')) {
      const { data: teamRow } = await supabase
        .from('teams').select('max_members').eq('id', team_id).single()
      const m = teamRow?.max_members || 1
      const amount_paid = m === 5 ? 1299 : m * 299

      const { error } = await supabase.from('teams').update({
        payment_status: 'paid',
        payment_order_id: order_id,
        amount_paid,
      }).eq('id', team_id)

      if (error) throw error

      // Fire emails (non-blocking)
      sendPaymentSuccessEmails(adminSupabase, team_id, order_id, amount_paid).catch(console.error)

      return Response.json({ success: true })
    }

    // Verify with Cashfree
    const baseUrl = process.env.CASHFREE_ENV === 'sandbox'
      ? 'https://sandbox.cashfree.com'
      : 'https://api.cashfree.com'

    const res = await fetch(`${baseUrl}/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2025-01-01',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Cashfree verify error:', data)
      return Response.json({ error: data?.message || 'Failed to fetch order from Cashfree' }, { status: 500 })
    }

    if (data.order_status !== 'PAID') {
      return Response.json({ error: `Payment not completed. Status: ${data.order_status}` }, { status: 400 })
    }

    const amount = data.order_amount || 0

    const { error } = await supabase
      .from('teams')
      .update({ payment_status: 'paid', payment_order_id: order_id, amount_paid: amount })
      .eq('id', team_id)

    if (error) throw error

    // Fire emails (non-blocking)
    sendPaymentSuccessEmails(adminSupabase, team_id, order_id, amount).catch(console.error)

    return Response.json({ success: true, order_id })
  } catch (err) {
    console.error('Cashfree verify error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
