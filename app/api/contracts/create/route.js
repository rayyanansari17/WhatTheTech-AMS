import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createParticipationContract } from '@/lib/econtracts'

export async function POST(req) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ECONTRACTS_API_KEY) {
    console.warn('[contracts/create] ECONTRACTS_API_KEY not configured  -  skipping')
    return NextResponse.json({ success: true, skipped: true })
  }

  try {
    const { name, acceptedAt } = await req.json()
    const result = await createParticipationContract({
      name: name || user.email.split('@')[0],
      email: user.email,
      acceptedAt: acceptedAt || new Date().toISOString(),
    })
    console.log('[contracts/create] Participation contract created:', result?.contract?.id)
    return NextResponse.json({ success: true, contractId: result?.contract?.id })
  } catch (err) {
    console.error('[contracts/create] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
