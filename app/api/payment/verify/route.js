import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment, activeGateway } from '@/lib/payment'
import { triggerEmail } from '@/lib/send-email-internal'
import { createRegistrationContract } from '@/lib/econtracts'
import QRCode from 'qrcode'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function sendPaymentSuccessEmails(supabase, teamId, orderId, amount) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('id, team_name, checkin_token')
    .eq('id', teamId)
    .single()
  if (teamErr) { console.error('[payment email] team fetch error:', teamErr.message); return }
  if (!team) { console.error('[payment email] team not found:', teamId); return }

  const { data: members, error: membersErr } = await supabase
    .from('team_members')
    .select('user_id, is_leader, profiles(full_name)')
    .eq('team_id', teamId)
  if (membersErr) { console.error('[payment email] members fetch error:', membersErr.message); return }
  if (!members?.length) { console.error('[payment email] no members found for team:', teamId); return }

  // Generate QR code as base64 PNG for the team check-in token
  let qrDataUrl = null
  if (team.checkin_token) {
    try {
      qrDataUrl = await QRCode.toDataURL(team.checkin_token, {
        width: 200,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#ffffff' },
      })
    } catch (err) {
      console.error('[payment email] QR generation failed:', err.message)
    }
  }

  console.log(`[payment email] sending to ${members.length} members for team ${team.team_name}`)

  for (const m of members || []) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(m.user_id)
    if (authErr) { console.error('[payment email] auth.admin.getUserById error:', authErr.message); continue }
    if (!authUser?.user?.email) { console.error('[payment email] no email for user:', m.user_id); continue }
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
        qrDataUrl,
      },
    })
  }

  // Email all organizers
  const leader = members.find(m => m.is_leader) || members[0]
  const { data: leaderAuth } = await supabase.auth.admin.getUserById(leader.user_id)
  const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  const { data: organizers } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('is_organiser', true)
    .not('email', 'is', null)

  for (const org of organizers || []) {
    await triggerEmail({
      type: 'admin_new_registration',
      to: org.email,
      props: {
        userName: leader.profiles?.full_name || leaderAuth?.user?.email || '',
        userEmail: leaderAuth?.user?.email || '',
        teamName: team?.team_name || '',
        paymentStatus: 'paid',
        registeredAt,
      },
    })
  }

  // Send registration confirmation contracts via econtracts.ai
  if (process.env.ECONTRACTS_API_KEY) {
    const orderId = team.payment_order_id || ''
    for (const m of members || []) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (!authUser?.user?.email) continue
        await createRegistrationContract({
          name: m.profiles?.full_name || authUser.user.email.split('@')[0],
          email: authUser.user.email,
          teamName: team.team_name,
          amountPaid: amount,
          orderId,
        })
      } catch (err) {
        console.error('[contracts] Registration contract failed for', m.user_id, ':', err.message)
      }
    }
  }
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 })

  try {
    const body = await req.json()
    const { team_id } = body

    if (!team_id) {
      return Response.json({ error: 'Missing team_id' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const adminSupabase = getServiceClient()
    const gateway = activeGateway()

    // Dev-only bypass
    if (process.env.NODE_ENV === 'development' && body.order_id?.startsWith('test_')) {
      const { data: teamRow } = await supabase
        .from('teams').select('max_members').eq('id', team_id).single()
      const m = teamRow?.max_members || 1
      const amount_paid = m === 5 ? 1299 : m * 299

      const { error } = await supabase.from('teams').update({
        payment_status: 'paid',
        status: 'approved',
        payment_order_id: body.order_id,
        amount_paid,
      }).eq('id', team_id)

      if (error) throw error
      await sendPaymentSuccessEmails(adminSupabase, team_id, body.order_id, amount_paid).catch(console.error)
      return Response.json({ success: true })
    }

    let result
    let dbOrderId

    if (gateway === 'razorpay') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return Response.json({ error: 'Missing Razorpay payment fields' }, { status: 400 })
      }
      result = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
      dbOrderId = razorpay_order_id
    } else {
      const { order_id } = body
      if (!order_id) return Response.json({ error: 'Missing order_id' }, { status: 400 })
      result = await verifyPayment(order_id)
      dbOrderId = order_id
    }

    const { error } = await supabase
      .from('teams')
      .update({
        payment_status: 'paid',
        status: 'approved',
        payment_order_id: dbOrderId,
        payment_id: result.paymentId,
        amount_paid: result.amountPaid,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('id', team_id)

    if (error) throw error

    await sendPaymentSuccessEmails(adminSupabase, team_id, dbOrderId, result.amountPaid).catch(console.error)

    return Response.json({ success: true, order_id: dbOrderId })
  } catch (err) {
    console.error('Payment verify error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
