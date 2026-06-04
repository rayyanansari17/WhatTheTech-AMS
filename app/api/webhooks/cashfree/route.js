/**
 * POST /api/webhooks/cashfree
 * Cashfree payment webhook — triggers payment_success / payment_failed emails.
 * Configure this URL in Cashfree Dashboard → Webhooks.
 */
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function verifySignature(rawBody, signature, timestamp) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET
  if (!secret) return true // skip verification if not set (dev)
  const payload = timestamp + rawBody
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64')
  return expected === signature
}

export async function POST(req) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')

    if (!verifySignature(rawBody, signature, timestamp)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const { type, data } = event

    const supabase = getServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

    // PAYMENT_SUCCESS_WEBHOOK
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = data?.order?.order_id
      const amount = data?.payment?.payment_amount
      const currency = data?.payment?.payment_currency || 'INR'

      if (!orderId) return Response.json({ ok: true })

      // Find team by order ID
      const { data: team } = await supabase
        .from('teams')
        .select('id, team_name, payment_status')
        .eq('payment_order_id', orderId)
        .maybeSingle()

      if (!team) return Response.json({ ok: true })

      // Update payment status if not already paid
      if (team.payment_status !== 'paid') {
        await supabase.from('teams').update({
          payment_status: 'paid',
          amount_paid: amount,
        }).eq('id', team.id)
      }

      // Get team members with their profiles
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, is_leader, profiles(full_name, email:id)')
        .eq('team_id', team.id)

      // Get user emails from auth.users
      for (const m of members || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (!authUser?.user?.email) continue

        await triggerEmail({
          type: 'payment_success',
          to: authUser.user.email,
          userId: m.user_id,
          props: {
            name: m.profiles?.full_name || authUser.user.email.split('@')[0],
            teamName: team.team_name,
            orderId,
            amount: `₹${amount}`,
            dashboardUrl: `${appUrl}/dashboard`,
          },
        })
      }

      // Admin alert
      if (process.env.ADMIN_EMAIL) {
        const leader = members?.find(m => m.is_leader)
        const { data: leaderAuth } = leader
          ? await supabase.auth.admin.getUserById(leader.user_id)
          : { data: null }

        await triggerEmail({
          type: 'admin_new_registration',
          to: process.env.ADMIN_EMAIL,
          props: {
            userName: leaderAuth?.user?.user_metadata?.full_name || 'Unknown',
            userEmail: leaderAuth?.user?.email || '',
            teamName: team.team_name,
            paymentStatus: 'paid',
          },
        })
      }
    }

    // PAYMENT_FAILED_WEBHOOK
    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = data?.order?.order_id
      const reason = data?.payment?.payment_message || ''

      if (!orderId) return Response.json({ ok: true })

      // Try to find who initiated this payment from order metadata
      // Cashfree encodes customer_id in the order
      const customerId = data?.customer_details?.customer_id

      if (customerId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(customerId)
        if (authUser?.user?.email) {
          const retryUrl = `${appUrl}/register/payment`

          await triggerEmail({
            type: 'payment_failed',
            to: authUser.user.email,
            userId: customerId,
            props: {
              name: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
              retryUrl,
              reason,
            },
          })

          // Admin alert
          if (process.env.ADMIN_EMAIL) {
            await triggerEmail({
              type: 'admin_payment_failure',
              to: process.env.ADMIN_EMAIL,
              props: {
                userName: authUser.user.user_metadata?.full_name || '',
                userEmail: authUser.user.email,
                orderId,
                reason,
                failedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              },
            })
          }
        }
      }
    }

    // USER_DROPPED_WEBHOOK — user reached payment screen but abandoned before completing
    if (type === 'USER_DROPPED_WEBHOOK') {
      const orderId = data?.order?.order_id
      const amount = data?.order?.order_amount
      const customerId = data?.customer_details?.customer_id

      if (orderId) {
        // Reset status back to pending so payment buttons reappear
        await supabase
          .from('teams')
          .update({ payment_status: 'pending' })
          .eq('payment_order_id', orderId)
      }

      if (customerId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(customerId)
        if (authUser?.user?.email) {
          // Find their team for context
          const { data: memberRow } = await supabase
            .from('team_members')
            .select('team_id, teams(team_name)')
            .eq('user_id', customerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          await triggerEmail({
            type: 'nudge_complete_payment',
            to: authUser.user.email,
            userId: customerId,
            props: {
              name: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
              teamName: memberRow?.teams?.team_name || '',
              amount: amount ? `₹${amount}` : '₹598',
              paymentUrl: `${appUrl}/register/payment`,
            },
          })
        }
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[cashfree webhook]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
