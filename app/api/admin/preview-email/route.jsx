import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { render } from '@react-email/render'
import NudgeSecureTeamSpotEmail from '@/emails/nudge-secure-team-spot'
import NudgeDepositCompleteEmail from '@/emails/nudge-deposit-complete'
import NudgeCompleteApplicationEmail from '@/emails/nudge-complete-application'
import NudgeTeamIncompleteEmail from '@/emails/nudge-team-incomplete'
import AnnounceDepositEmail from '@/emails/announce-deposit'
import ApologyWrongDatesEmail from '@/emails/apology-wrong-dates'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function requireOrganiser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = getServiceClient()
  const { data: profile } = await service.from('profiles').select('is_organiser').eq('id', user.id).single()
  return profile?.is_organiser ? user : null
}

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'

const PREVIEW_MAP = {
  unpaid_teams: {
    C: NudgeSecureTeamSpotEmail,
    props: {
      leaderName: 'Arjun Mehta',
      teamName: 'Team Cipher',
      amount: '₹299',
      paymentUrl: `${appUrl}/register/payment`,
    },
  },
  deposit_teams: {
    C: NudgeDepositCompleteEmail,
    props: {
      name: 'Arjun Mehta',
      teamName: 'Team Cipher',
      balanceAmount: '₹150',
      deadline: '1 August 2026',
      paymentUrl: `${appUrl}/register/payment`,
    },
  },
  incomplete_profiles: {
    C: NudgeCompleteApplicationEmail,
    props: {
      name: 'Arjun Mehta',
      continueUrl: `${appUrl}/register/profile`,
    },
  },
  incomplete_teams: {
    C: NudgeTeamIncompleteEmail,
    props: {
      leaderName: 'Arjun Mehta',
      teamName: 'Team Cipher',
      currentMembers: 1,
      minMembers: 2,
      teamCode: 'CIPH42',
      dashboardUrl: `${appUrl}/dashboard`,
    },
  },
  announce_deposit: {
    C: AnnounceDepositEmail,
    props: {
      name: 'Arjun Mehta',
      teamName: 'Team Cipher',
      balanceAmount: '₹150',
      paymentUrl: `${appUrl}/register/payment`,
    },
  },
  apology_wrong_dates: {
    C: ApologyWrongDatesEmail,
    props: {
      name: 'Mohammed Abdul Majeed',
      teamName: 'ROKATSU',
      dashboardUrl: `${appUrl}/dashboard`,
    },
  },
}

export async function GET(req) {
  const user = await requireOrganiser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const entry = PREVIEW_MAP[type]
  if (!entry) {
    return new Response(`Unknown email type: ${type}`, { status: 400 })
  }

  const { C, props } = entry
  const html = await render(<C {...props} />)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
